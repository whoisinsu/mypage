// 패스키(WebAuthn) 인증 서버 — Cloudflare Workers + D1
// 정적 파일(index.html, css, js, assets)은 Workers Static Assets가 내보내고,
// /api/* 요청만 이 코드가 처리합니다.
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

const RP_NAME = "류인수 소개 페이지";
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 일회용 질문 보관 시간: 5분
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 세션 유지 시간: 2시간
const SESSION_COOKIE = "__Host-sid";
const USERNAME_RE = /^[a-z0-9_-]{3,20}$/;

// 패스키를 저장한 곳을 알아보기 위한 AAGUID 일부(공개 목록 기준)
const KNOWN_AAGUIDS = {
  "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4": "Google 비밀번호 관리자",
  "fbfc3007-154e-4ecc-8c0b-6e020557d7bd": "iCloud 키체인",
  "08987058-cadc-4b81-b6e1-30de50dcbe96": "Windows Hello",
  "9ddd1817-af5a-4672-a2b9-3e3dd95000a9": "Windows Hello",
  "6028b017-b1d4-4c02-b4b3-afcdafc96bb2": "Windows Hello",
  "bada5566-a7aa-401f-bd96-45619a55120d": "1Password",
  "d548826e-79b4-db40-a3d8-11116f7e8349": "Bitwarden",
  "53414d53-554e-4700-0000-000000000000": "Samsung Pass",
  "00000000-0000-0000-0000-000000000000": "알 수 없음(보안 키 또는 정보 비공개)",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }
    try {
      return await handleApi(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.code, message: err.message }, err.status);
      console.error(err);
      return json({ error: "server_error", message: "서버 오류가 발생했습니다." }, 500);
    }
  },
};

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function handleApi(request, env, url) {
  const { method } = request;
  const path = url.pathname;

  // 상태를 바꾸는 요청은 같은 출처에서 온 JSON만 받습니다(CSRF 방어).
  if (method !== "GET" && method !== "HEAD") {
    const origin = request.headers.get("Origin");
    if (origin !== url.origin) {
      throw new HttpError(403, "bad_origin", "다른 출처에서 온 요청은 받지 않습니다.");
    }
  }

  const ctx = { request, env, url, rp: { id: url.hostname, origin: url.origin } };

  if (path === "/api/session" && method === "GET") return getSession(ctx);
  if (path === "/api/register/options" && method === "POST") return registerOptions(ctx);
  if (path === "/api/register/verify" && method === "POST") return registerVerify(ctx);
  if (path === "/api/register/cancel" && method === "POST") return registerCancel(ctx);
  if (path === "/api/login/options" && method === "POST") return loginOptions(ctx);
  if (path === "/api/login/verify" && method === "POST") return loginVerify(ctx);
  if (path === "/api/logout" && method === "POST") return logout(ctx);
  if (path === "/api/private" && method === "GET") return listPrivate(ctx);
  if (path === "/api/private" && method === "POST") return addPrivate(ctx);
  if (path === "/api/credentials" && method === "GET") return listCredentials(ctx);

  let m;
  if ((m = path.match(/^\/api\/private\/(\d+)$/)) && method === "DELETE") return deletePrivate(ctx, Number(m[1]));
  if ((m = path.match(/^\/api\/users\/([^/]+)\/private$/)) && method === "GET") return readUserPrivate(ctx, decodeURIComponent(m[1]));
  if ((m = path.match(/^\/api\/credentials\/([A-Za-z0-9_-]+)$/)) && method === "DELETE") return deleteCredential(ctx, m[1]);

  throw new HttpError(404, "not_found", "없는 주소입니다.");
}

// ───────────────────────── 세션 ─────────────────────────

async function getSession(ctx) {
  const user = await currentUser(ctx);
  if (!user) return json({ authenticated: false });
  return json({ authenticated: true, user: { username: user.username } });
}

/** 쿠키의 세션 값으로 사용자를 찾습니다. 없거나 만료되었으면 null. */
async function currentUser({ request, env }) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.webauthn_user_id, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`
  ).bind(await sha256(token)).first();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
    return null;
  }
  return row;
}

async function requireUser(ctx) {
  const user = await currentUser(ctx);
  if (!user) throw new HttpError(401, "unauthenticated", "패스키로 로그인해야 볼 수 있습니다.");
  return user;
}

async function createSession(env, userId) {
  const token = isoBase64URL.fromBuffer(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(await sha256(token), userId, now, now + SESSION_TTL_MS).run();
  return sessionCookie(token, SESSION_TTL_MS / 1000);
}

async function logout(ctx) {
  const token = readCookie(ctx.request, SESSION_COOKIE);
  if (token) {
    await ctx.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  return json({ loggedOut: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}

// ───────────────────────── 등록 ─────────────────────────

async function registerOptions(ctx) {
  const { env, rp } = ctx;
  const body = await readJson(ctx.request);
  const passkeyName = String(body.passkeyName ?? "").trim();
  if (passkeyName.length < 1 || passkeyName.length > 40) {
    throw new HttpError(400, "bad_passkey_name", "패스키 이름을 1~40자로 적어주세요.");
  }

  await purgeExpired(env);
  const user = await currentUser(ctx);
  let userName, webauthnUserId, excludeCredentials = [], username = null;

  if (user) {
    // 로그인한 상태: 지금 계정에 패스키를 하나 더 붙입니다.
    userName = user.username;
    webauthnUserId = isoBase64URL.toBuffer(user.webauthn_user_id);
    const { results } = await env.DB.prepare(
      "SELECT id, transports FROM credentials WHERE user_id = ?"
    ).bind(user.id).all();
    // 같은 인증기에 같은 계정의 패스키가 겹쳐 생기지 않도록 이미 있는 것을 알려줍니다.
    excludeCredentials = results.map((c) => ({ id: c.id, transports: parseJson(c.transports) ?? undefined }));
  } else {
    // 로그인하지 않은 상태: 새 계정을 만듭니다. 계정은 확인이 끝난 뒤에야 저장합니다.
    username = String(body.username ?? "").trim().toLowerCase();
    if (!USERNAME_RE.test(username)) {
      throw new HttpError(400, "bad_username", "계정 이름은 영문 소문자·숫자·_·- 3~20자로 적어주세요.");
    }
    const exists = await env.DB.prepare("SELECT 1 FROM users WHERE username = ?").bind(username).first();
    if (exists) {
      throw new HttpError(409, "username_taken", "이미 있는 계정 이름입니다. 그 계정으로 로그인한 뒤 패스키를 추가하세요.");
    }
    userName = username;
    webauthnUserId = crypto.getRandomValues(new Uint8Array(32));
  }

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rp.id,
    userName,
    userID: webauthnUserId,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });

  await env.DB.prepare(
    `INSERT INTO challenges (challenge, purpose, user_id, username, webauthn_user_id, passkey_name, expires_at)
     VALUES (?, 'register', ?, ?, ?, ?, ?)`
  ).bind(
    options.challenge,
    user?.id ?? null,
    username,
    user ? null : isoBase64URL.fromBuffer(webauthnUserId),
    passkeyName,
    Date.now() + CHALLENGE_TTL_MS
  ).run();

  return json(options);
}

async function registerVerify(ctx) {
  const { env, rp } = ctx;
  const body = await readJson(ctx.request);
  const response = body.response;
  const pending = await consumeChallenge(env, response, "register");

  // 로그인한 상태로 시작한 등록이면, 끝낼 때도 같은 사람이어야 합니다.
  const user = await currentUser(ctx);
  if (pending.user_id && pending.user_id !== user?.id) {
    throw new HttpError(403, "session_mismatch", "등록을 시작한 계정과 지금 로그인한 계정이 다릅니다.");
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      requireUserVerification: false,
    });
  } catch (err) {
    throw new HttpError(400, "registration_failed", `등록 응답 확인에 실패했습니다: ${err.message}`);
  }
  if (!verification.verified) {
    throw new HttpError(400, "registration_failed", "등록 응답 확인에 실패했습니다.");
  }

  const info = verification.registrationInfo;
  const now = Date.now();
  let userId = pending.user_id;
  let setCookie = null;
  const statements = [];

  if (!userId) {
    // 새 계정: 등록을 시작할 때 인증기에 넘긴 사용자 핸들을 그대로 저장합니다.
    userId = crypto.randomUUID();
    const taken = await env.DB.prepare("SELECT 1 FROM users WHERE username = ?").bind(pending.username).first();
    if (taken) throw new HttpError(409, "username_taken", "그 사이에 같은 이름의 계정이 생겼습니다.");
    statements.push(
      env.DB.prepare("INSERT INTO users (id, username, webauthn_user_id, created_at) VALUES (?, ?, ?, ?)")
        .bind(userId, pending.username, pending.webauthn_user_id, now),
      ...seedItems(env, userId, pending.username, now)
    );
  }

  const publicKey = isoBase64URL.fromBuffer(info.credential.publicKey);
  statements.push(
    env.DB.prepare(
      `INSERT INTO credentials (id, user_id, public_key, counter, transports, device_type, backed_up, aaguid, name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      info.credential.id,
      userId,
      publicKey,
      info.credential.counter,
      JSON.stringify(info.credential.transports ?? []),
      info.credentialDeviceType,
      info.credentialBackedUp ? 1 : 0,
      info.aaguid,
      pending.passkey_name,
      now
    )
  );
  await env.DB.batch(statements);

  if (!pending.user_id) setCookie = await createSession(env, userId);

  // 서버에 실제로 저장된 행을 그대로 돌려줍니다. 비밀번호도, 개인키도 없습니다.
  const stored = await env.DB.prepare("SELECT * FROM credentials WHERE id = ?").bind(info.credential.id).first();
  return json(
    { verified: true, storedCredential: describeCredential(stored, true) },
    200,
    setCookie ? { "Set-Cookie": setCookie } : {}
  );
}

/** 사용자가 패스키 창을 닫았을 때: 보관하던 질문을 지워 서버에 아무것도 남기지 않습니다. */
async function registerCancel(ctx) {
  const body = await readJson(ctx.request);
  const challenge = String(body.challenge ?? "");
  const res = await ctx.env.DB.prepare(
    "DELETE FROM challenges WHERE challenge = ? AND purpose = 'register'"
  ).bind(challenge).run();
  return json({ cancelled: true, removedChallenges: res.meta.changes });
}

// ───────────────────────── 로그인 ─────────────────────────

async function loginOptions(ctx) {
  const { env, rp } = ctx;
  await purgeExpired(env);
  // 계정 이름을 묻지 않습니다. 기기에 있는 패스키 중 하나를 고르면 그걸로 사람을 알아봅니다.
  const options = await generateAuthenticationOptions({ rpID: rp.id, userVerification: "preferred" });
  await env.DB.prepare(
    "INSERT INTO challenges (challenge, purpose, expires_at) VALUES (?, 'login', ?)"
  ).bind(options.challenge, Date.now() + CHALLENGE_TTL_MS).run();
  return json(options);
}

async function loginVerify(ctx) {
  const { env, rp } = ctx;
  const body = await readJson(ctx.request);
  const response = body.response;
  // ① 질문부터 꺼내 지웁니다. 이미 쓴 질문이면 여기서 거절됩니다.
  const pending = await consumeChallenge(env, response, "login");

  // ② 서버에 남아 있는 패스키인지 봅니다. 지운 패스키는 여기서 거절됩니다.
  const credential = await env.DB.prepare(
    `SELECT c.*, u.username FROM credentials c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
  ).bind(String(response?.id ?? "")).first();
  if (!credential) {
    throw new HttpError(401, "unknown_credential", "등록되어 있지 않거나 지워진 패스키입니다.");
  }

  // ③ 저장해 둔 공개키로 서명을 확인합니다.
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: pending.challenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.id,
      credential: {
        id: credential.id,
        publicKey: isoBase64URL.toBuffer(credential.public_key),
        counter: credential.counter,
        transports: parseJson(credential.transports) ?? undefined,
      },
      requireUserVerification: false,
    });
  } catch (err) {
    throw new HttpError(401, "signature_invalid", `서명 확인에 실패했습니다: ${err.message}`);
  }
  if (!verification.verified) {
    throw new HttpError(401, "signature_invalid", "서명 확인에 실패했습니다.");
  }

  await env.DB.prepare("UPDATE credentials SET counter = ?, last_used_at = ? WHERE id = ?")
    .bind(verification.authenticationInfo.newCounter, Date.now(), credential.id).run();

  const setCookie = await createSession(env, credential.user_id);
  return json(
    { verified: true, user: { username: credential.username }, passkey: credential.name },
    200,
    { "Set-Cookie": setCookie }
  );
}

// ───────────────────────── 비공개 자료 ─────────────────────────

async function listPrivate(ctx) {
  const user = await requireUser(ctx);
  // 주소에 ?user=다른계정 을 붙여도 무시합니다. 늘 세션의 사용자 자료만 꺼냅니다.
  return json(await privatePayload(ctx.env, user));
}

async function readUserPrivate(ctx, username) {
  const user = await requireUser(ctx);
  if (username.toLowerCase() !== user.username) {
    throw new HttpError(403, "forbidden", "다른 계정의 비공개 자료는 읽을 수 없습니다.");
  }
  return json(await privatePayload(ctx.env, user));
}

async function addPrivate(ctx) {
  const user = await requireUser(ctx);
  const body = await readJson(ctx.request);
  const category = String(body.category ?? "메모").trim().slice(0, 20) || "메모";
  const title = String(body.title ?? "").trim().slice(0, 80);
  const text = String(body.body ?? "").trim().slice(0, 1000);
  if (!title) throw new HttpError(400, "bad_title", "제목을 적어주세요.");
  // 요청 본문에 user / owner 같은 값을 넣어도 쓰지 않습니다. 주인은 늘 세션의 사용자입니다.
  await ctx.env.DB.prepare(
    "INSERT INTO private_items (user_id, category, title, body, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(user.id, category, title, text, Date.now()).run();
  return json(await privatePayload(ctx.env, user), 201);
}

async function deletePrivate(ctx, id) {
  const user = await requireUser(ctx);
  const res = await ctx.env.DB.prepare("DELETE FROM private_items WHERE id = ? AND user_id = ?")
    .bind(id, user.id).run();
  if (res.meta.changes === 0) {
    // 남의 항목인지 없는 항목인지 구분해서 알려주지 않습니다.
    throw new HttpError(404, "not_found", "내 항목 중에 그런 것이 없습니다.");
  }
  return json(await privatePayload(ctx.env, user));
}

async function privatePayload(env, user) {
  const { results } = await env.DB.prepare(
    "SELECT id, category, title, body, created_at FROM private_items WHERE user_id = ? ORDER BY id"
  ).bind(user.id).all();
  return { owner: user.username, count: results.length, items: results };
}

function seedItems(env, userId, username, now) {
  // 만들어 넣은 예시 내용입니다. 실제 개인정보가 아닙니다.
  const items = [
    ["프로젝트 메모", "준비 중인 프로젝트 (예시)", `[${username}] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.`],
    ["지원 목록", "지원하려는 곳 (예시)", `[${username}] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).`],
    ["회고", "이번 주 회고 (예시)", `[${username}] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.`],
  ];
  return items.map(([category, title, body], i) =>
    env.DB.prepare("INSERT INTO private_items (user_id, category, title, body, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(userId, category, title, body, now + i)
  );
}

// ───────────────────────── 패스키 목록 ─────────────────────────

async function listCredentials(ctx) {
  const user = await requireUser(ctx);
  const { results } = await ctx.env.DB.prepare(
    "SELECT * FROM credentials WHERE user_id = ? ORDER BY created_at"
  ).bind(user.id).all();
  return json({ owner: user.username, count: results.length, credentials: results.map((c) => describeCredential(c, false)) });
}

async function deleteCredential(ctx, id) {
  const user = await requireUser(ctx);
  const { env } = ctx;
  const own = await env.DB.prepare("SELECT id FROM credentials WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  if (!own) {
    throw new HttpError(404, "not_found", "내 패스키 중에 그런 것이 없습니다.");
  }
  const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM credentials WHERE user_id = ?").bind(user.id).first();
  if (n <= 1) {
    // 마지막 패스키를 지우면 이 계정에 들어갈 방법이 사라지므로 막습니다.
    throw new HttpError(409, "last_passkey", "마지막 남은 패스키는 지울 수 없습니다. 다른 패스키를 먼저 등록하세요.");
  }
  await env.DB.prepare("DELETE FROM credentials WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  return listCredentials(ctx);
}

function describeCredential(c, includeFullKey) {
  return {
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    lastUsedAt: c.last_used_at,
    publicKey: includeFullKey ? c.public_key : `${c.public_key.slice(0, 24)}…`,
    publicKeyFormat: "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
    counter: c.counter,
    transports: parseJson(c.transports) ?? [],
    deviceType: c.device_type,
    backedUp: Boolean(c.backed_up),
    aaguid: c.aaguid,
    storedIn: guessStorage(c),
  };
}

function guessStorage(c) {
  const known = KNOWN_AAGUIDS[c.aaguid];
  if (known && c.aaguid !== "00000000-0000-0000-0000-000000000000") return known;
  const transports = parseJson(c.transports) ?? [];
  if (transports.includes("usb") || transports.includes("nfc")) return "보안 키(추정)";
  if (c.device_type === "multiDevice") return "동기화되는 비밀번호 관리자(추정)";
  return known ?? "기기 자체(추정)";
}

// ───────────────────────── 공통 ─────────────────────────

/**
 * 응답 안의 clientDataJSON에서 질문을 꺼내, 서버에 보관된 같은 질문을 지우면서 가져옵니다.
 * 한 번 꺼낸 질문은 다시 쓸 수 없습니다.
 */
async function consumeChallenge(env, response, purpose) {
  let challenge;
  try {
    const clientData = JSON.parse(
      new TextDecoder().decode(isoBase64URL.toBuffer(response.response.clientDataJSON))
    );
    challenge = String(clientData.challenge);
  } catch {
    throw new HttpError(400, "bad_response", "응답 형식이 올바르지 않습니다.");
  }
  const row = await env.DB.prepare(
    "DELETE FROM challenges WHERE challenge = ? AND purpose = ? RETURNING *"
  ).bind(challenge, purpose).first();
  if (!row) {
    throw new HttpError(400, "challenge_not_found", "서버가 보관 중인 질문이 아닙니다. 이미 쓴 질문이거나 만료되었습니다.");
  }
  if (row.expires_at < Date.now()) {
    throw new HttpError(400, "challenge_expired", "질문의 유효 시간(5분)이 지났습니다.");
  }
  return row;
}

async function purgeExpired(env) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM challenges WHERE expires_at < ?").bind(now),
    env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
  ]);
}

async function readJson(request) {
  if (!(request.headers.get("Content-Type") ?? "").includes("application/json")) {
    throw new HttpError(415, "bad_content_type", "JSON으로 보내주세요.");
  }
  try {
    return (await request.json()) ?? {};
  } catch {
    throw new HttpError(400, "bad_json", "JSON 형식이 올바르지 않습니다.");
  }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

function sessionCookie(value, maxAgeSeconds) {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return isoBase64URL.fromBuffer(new Uint8Array(digest));
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
