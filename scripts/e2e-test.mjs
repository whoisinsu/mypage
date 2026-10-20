// 소프트웨어 인증기로 등록·로그인·로그아웃·비공개 자료 조회를 끝까지 돌려 보고,
// 막힌 요청과 통과한 요청을 Markdown 기록으로 남깁니다.
//
//   node scripts/e2e-test.mjs                       # 로컬(wrangler dev, http://localhost:8787)
//   node scripts/e2e-test.mjs https://<배포 주소>   # 배포한 서버
//
// 기록 파일: evidence/e2e-<호스트>.md (세션 값은 가려서 적습니다)
import { webcrypto as crypto } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = (process.argv[2] ?? "http://localhost:8787").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;
const RP_ID = new URL(BASE).hostname;
const RUN = Math.random().toString(36).slice(2, 7);

// ───────── 작은 도우미 ─────────

const enc = new TextEncoder();
const b64url = (buf) => Buffer.from(buf).toString("base64url");
const fromB64url = (s) => new Uint8Array(Buffer.from(s, "base64url"));
const sha256 = async (data) => new Uint8Array(await crypto.subtle.digest("SHA-256", data));
const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
};

// 최소한의 CBOR 인코더(정수·바이트열·문자열·맵만)
function cbor(value) {
  const head = (major, n) => {
    if (n < 24) return Uint8Array.of((major << 5) | n);
    if (n < 256) return Uint8Array.of((major << 5) | 24, n);
    if (n < 65536) return Uint8Array.of((major << 5) | 25, n >> 8, n & 255);
    throw new Error("too long");
  };
  if (typeof value === "number") return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === "string") {
    const b = enc.encode(value);
    return concat(head(3, b.length), b);
  }
  if (value instanceof Uint8Array) return concat(head(2, value.length), value);
  if (value instanceof Map) {
    const parts = [head(5, value.size)];
    for (const [k, v] of value) parts.push(cbor(k), cbor(v));
    return concat(...parts);
  }
  throw new Error("unsupported");
}

// WebCrypto의 r||s 서명을 WebAuthn이 쓰는 DER 형식으로 바꿉니다.
function rawToDer(raw) {
  const int = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    b = b.slice(i);
    if (b[0] & 0x80) b = concat(Uint8Array.of(0), b);
    return concat(Uint8Array.of(0x02, b.length), b);
  };
  const body = concat(int(raw.slice(0, 32)), int(raw.slice(32)));
  return concat(Uint8Array.of(0x30, body.length), body);
}

// ───────── 소프트웨어 인증기(테스트용 가짜 기기) ─────────

class SoftAuthenticator {
  constructor(label) {
    this.label = label;
    this.credentials = []; // { id, keyPair, userHandle, signCount }
  }

  async create(options) {
    const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const credId = crypto.getRandomValues(new Uint8Array(16));
    const coseKey = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, fromB64url(jwk.x)], [-3, fromB64url(jwk.y)]]));
    const authData = concat(
      await sha256(enc.encode(options.rp.id)),
      Uint8Array.of(0x45), // UP | UV | AT
      Uint8Array.of(0, 0, 0, 0),
      new Uint8Array(16), // AAGUID
      Uint8Array.of(0, credId.length),
      credId,
      coseKey
    );
    const clientDataJSON = enc.encode(
      JSON.stringify({ type: "webauthn.create", challenge: options.challenge, origin: ORIGIN, crossOrigin: false })
    );
    const attestationObject = cbor(new Map([["fmt", "none"], ["attStmt", new Map()], ["authData", authData]]));
    this.credentials.push({ id: b64url(credId), keyPair, userHandle: options.user.id, signCount: 0 });
    // 개인키(keyPair.privateKey)는 내보낼 수 없게(false) 만들었고, 아래 본문에도 들어가지 않습니다.
    return {
      id: b64url(credId),
      rawId: b64url(credId),
      type: "public-key",
      response: { clientDataJSON: b64url(clientDataJSON), attestationObject: b64url(attestationObject), transports: ["internal"] },
      clientExtensionResults: {},
      authenticatorAttachment: "platform",
    };
  }

  async get(options, credId = this.credentials[0].id) {
    const cred = this.credentials.find((c) => c.id === credId);
    cred.signCount += 1;
    const authData = concat(
      await sha256(enc.encode(options.rpId)),
      Uint8Array.of(0x05), // UP | UV
      Uint8Array.of(0, 0, 0, cred.signCount)
    );
    const clientDataJSON = enc.encode(
      JSON.stringify({ type: "webauthn.get", challenge: options.challenge, origin: ORIGIN, crossOrigin: false })
    );
    const raw = new Uint8Array(
      await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cred.keyPair.privateKey, concat(authData, await sha256(clientDataJSON)))
    );
    return {
      id: cred.id,
      rawId: cred.id,
      type: "public-key",
      response: {
        clientDataJSON: b64url(clientDataJSON),
        authenticatorData: b64url(authData),
        signature: b64url(rawToDer(raw)),
        userHandle: cred.userHandle,
      },
      clientExtensionResults: {},
    };
  }
}

// ───────── HTTP와 기록 ─────────

const log = [];
let failures = 0;

const mask = (v) => (v ? `${v.slice(0, 4)}…(가림)…${v.slice(-2)}` : v);

function section(title, criteria) {
  log.push(`\n## ${title}\n\n관련 통과 기준: ${criteria}\n`);
}

function note(text) {
  log.push(`${text}\n`);
}

function check(cond, label) {
  log.push(`- ${cond ? "✅" : "❌"} ${label}`);
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
}

class Client {
  constructor(name) {
    this.name = name;
    this.sid = null;
  }

  async call(method, path, body, { origin = ORIGIN, sid = this.sid, quiet = false, raw = false } = {}) {
    const headers = {};
    if (origin) headers.Origin = origin;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (sid) headers.Cookie = `__Host-sid=${sid}`;
    const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: "manual" });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie?.startsWith("__Host-sid=")) {
      const v = setCookie.split(";")[0].split("=")[1];
      if (sid === this.sid) this.sid = v || null;
    }
    const text = await res.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {}
    if (!quiet) {
      const reqLines = [`${method} ${path}`];
      if (sid) reqLines.push(`Cookie: __Host-sid=${mask(sid)}`);
      if (origin) reqLines.push(`Origin: ${origin}`);
      let entry = `\n**[${this.name}]** \`${method} ${path}\` → **${res.status}**\n\n\`\`\`http\n${reqLines.join("\n")}\n\`\`\`\n`;
      if (body !== undefined) entry += `\n요청 본문\n\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\`\n`;
      if (setCookie) entry += `\n응답 헤더: \`Set-Cookie: ${setCookie.replace(/=([^;]+)/, (_, v) => `=${mask(v)}`)}\`\n`;
      if (!raw) entry += `\n응답 본문\n\`\`\`json\n${typeof data === "string" ? data : JSON.stringify(data, null, 2)}\n\`\`\`\n`;
      log.push(entry);
    }
    return { status: res.status, data, text };
  }

  async register(device, username, passkeyName) {
    const opt = await this.call("POST", "/api/register/options", username ? { username, passkeyName } : { passkeyName });
    const response = await device.create(opt.data);
    const ver = await this.call("POST", "/api/register/verify", { response });
    return { opt, response, ver };
  }

  async login(device, credId) {
    const opt = await this.call("POST", "/api/login/options", {});
    const response = await device.get(opt.data, credId);
    const ver = await this.call("POST", "/api/login/verify", { response });
    return { opt, response, ver };
  }
}

// ───────── 시나리오 ─────────

const alice = new Client(`alice-${RUN}`);
const bob = new Client(`bob-${RUN}`);
const aliceDevice1 = new SoftAuthenticator("alice 노트북");
const aliceDevice2 = new SoftAuthenticator("alice 휴대폰");
const bobDevice = new SoftAuthenticator("bob 노트북");

log.push(`# 패스키 확인 기록 (자동 테스트)\n`);
log.push(`- 대상: ${BASE}\n- 실행 시각: ${new Date().toISOString()}\n- 계정: \`${alice.name}\`, \`${bob.name}\` (테스트용으로 만든 계정)\n- 인증기: 이 스크립트 안의 소프트웨어 인증기(P-256 키를 메모리에서 만들고, 개인키는 내보낼 수 없게 생성)\n- 세션 쿠키 값은 앞 4자와 뒤 2자만 남기고 가렸습니다.\n`);

// 1. 로그인 없이 열기
section("1. 로그인 없이 비공개 자료 열기", "T08-C15, C16, C17, C18");
const anon = new Client("로그인 안 함");
const page = await anon.call("GET", "/private.html", undefined, { origin: null, raw: true });
note(`받은 \`private.html\` 본문 길이: ${page.text.length}자. 아래 문자열이 들어 있는지 검사했습니다.`);
const home = await anon.call("GET", "/", undefined, { origin: null, raw: true });
const anonPrivate = await anon.call("GET", "/api/private", undefined, { origin: null });
check(anonPrivate.status === 401, "로그인 없이 GET /api/private → 401");

// 2. 등록
section("2. 패스키 등록", "T08-C19, C20, C21, C22, C23, C24, C36");
const reg = await alice.register(aliceDevice1, alice.name, "alice 노트북 (테스트 인증기)");
check(reg.ver.status === 200, "alice 등록 성공");
const storedKey = reg.ver.data.storedCredential;
check(!JSON.stringify(reg.response).toLowerCase().includes("private"), "등록 요청 본문에 개인키 항목이 없음(id·clientDataJSON·attestationObject·transports뿐)");
check(storedKey?.publicKey?.length > 0 && storedKey.name === "alice 노트북 (테스트 인증기)", "서버에 공개키와 패스키 이름이 저장됨");
const regB = await bob.register(bobDevice, bob.name, "bob 노트북 (테스트 인증기)");
check(regB.ver.status === 200, "bob 등록 성공");
check(reg.opt.data.challenge !== regB.opt.data.challenge, `등록 질문이 요청마다 다름: ${reg.opt.data.challenge} ≠ ${regB.opt.data.challenge}`);

// 3. 등록 취소
section("3. 등록을 중간에 취소", "T08-C25");
const cancelName = `cancel-${RUN}`;
const anon2 = new Client("로그인 안 함");
const cOpt = await anon2.call("POST", "/api/register/options", { username: cancelName, passkeyName: "취소할 패스키" });
note("여기서 사용자가 패스키 창을 닫았다고 가정하고, 화면이 하는 것처럼 취소 요청을 보냅니다.");
const cancel = await anon2.call("POST", "/api/register/cancel", { challenge: cOpt.data.challenge });
check(cancel.data.removedChallenges === 1, "보관 중이던 등록 질문이 지워짐");
const again = await anon2.call("POST", "/api/register/options", { username: cancelName, passkeyName: "확인용" });
check(again.status === 200, "같은 계정 이름으로 다시 시작할 수 있음 = 계정이 저장되지 않았음");
await anon2.call("POST", "/api/register/cancel", { challenge: again.data.challenge }, { quiet: true });

// 4. 로그인 / 틀린 서명 / 재사용
section("4. 패스키로 로그인 · 틀린 서명 · 이미 쓴 질문 재사용", "T08-C27, C28, C29, C30, C31");
await alice.call("POST", "/api/logout", {});
const l1 = await alice.login(aliceDevice1);
check(l1.ver.status === 200, "올바른 서명 → 200, 세션 발급");
const ok = await alice.call("GET", "/api/private");
check(ok.status === 200 && ok.data.owner === alice.name, "로그인 뒤 GET /api/private → 200 (내 자료)");

const tamperOpt = await alice.call("POST", "/api/login/options", {}, { sid: null });
const tampered = await aliceDevice1.get(tamperOpt.data);
const sig = fromB64url(tampered.response.signature);
sig[sig.length - 1] ^= 0x01;
tampered.response.signature = b64url(sig);
note("서명의 마지막 바이트 하나를 바꿔서 보냅니다.");
const bad = await alice.call("POST", "/api/login/verify", { response: tampered }, { sid: null });
check(bad.status === 401 && bad.data.error === "signature_invalid", "틀린 서명 → 401 signature_invalid");
check(l1.opt.data.challenge !== tamperOpt.data.challenge, `로그인 질문이 요청마다 다름: ${l1.opt.data.challenge} ≠ ${tamperOpt.data.challenge}`);

note("성공했던 로그인 요청 본문을 한 글자도 바꾸지 않고 다시 보냅니다.");
const replay = await alice.call("POST", "/api/login/verify", { response: l1.response }, { sid: null });
check(replay.status === 400 && replay.data.error === "challenge_not_found", "이미 쓴 질문 재사용 → 400 challenge_not_found");

// 5. 로그아웃 뒤 같은 세션 값
section("5. 로그아웃 뒤 같은 세션 값으로 다시 요청", "T08-C32, C33, C34");
const oldSid = alice.sid;
const before = await alice.call("GET", "/api/private", undefined, { quiet: true });
check(before.status === 200, "로그아웃 전에는 같은 세션 값으로 200");
await alice.call("POST", "/api/logout", {});
const afterLogout = await alice.call("GET", "/api/private", undefined, { sid: oldSid });
check(afterLogout.status === 401, "로그아웃 뒤 같은 세션 값 → 401");
await alice.login(aliceDevice1);

// 6. 계정 사이
section("6. 다른 계정의 비공개 자료 읽기", "T08-C36, C37, C38, C39, C40");
const bobBefore = await bob.call("GET", "/api/private");
const aliceBefore = await alice.call("GET", "/api/private");
note(`거절 전 자료 건수: ${alice.name} ${aliceBefore.data.count}건, ${bob.name} ${bobBefore.data.count}건`);
const a2b = await alice.call("GET", `/api/users/${bob.name}/private`);
check(a2b.status === 403, `${alice.name} → ${bob.name} 자료 요청 → 403`);
const b2a = await bob.call("GET", `/api/users/${alice.name}/private`);
check(b2a.status === 403, `${bob.name} → ${alice.name} 자료 요청 → 403`);
const bobItemId = bobBefore.data.items[0].id;
const delOther = await alice.call("DELETE", `/api/private/${bobItemId}`);
check(delOther.status === 404, `${alice.name}가 ${bob.name}의 항목(id ${bobItemId}) 삭제 요청 → 404`);
const queryOther = await alice.call("GET", `/api/private?user=${bob.name}`);
check(queryOther.status === 200 && queryOther.data.owner === alice.name, "주소에 ?user=다른계정 → 그래도 내 자료만 돌아옴");
const bodyOther = await alice.call("POST", "/api/private", { owner: bob.name, user: bob.name, category: "메모", title: "본문에 다른 계정을 적어 보낸 항목", body: "주인은 세션으로만 정해집니다." });
check(bodyOther.status === 201 && bodyOther.data.owner === alice.name, "요청 본문에 owner/user=다른계정 → 내 자료에 저장되고 내 자료만 돌아옴");
const bobAfter = await bob.call("GET", "/api/private");
check(bobAfter.data.count === bobBefore.data.count, `거절 뒤 ${bob.name} 자료 건수 그대로: ${bobBefore.data.count} → ${bobAfter.data.count}`);
const aliceViaBob = await bob.call("GET", "/api/private", undefined, { quiet: true });
check(!JSON.stringify(aliceViaBob.data).includes(alice.name), `${bob.name}의 응답에 ${alice.name} 자료가 섞이지 않음`);

// 7. 패스키 두 개 / 삭제
section("7. 패스키 두 개 등록 · 하나 지운 뒤 로그인", "T08-C42, C43, C44, C45, C46");
const add = await alice.register(aliceDevice2, null, "alice 휴대폰 (테스트 인증기)");
check(add.ver.status === 200, "로그인한 상태에서 두 번째 패스키 등록");
const list = await alice.call("GET", "/api/credentials");
check(list.data.count === 2 && list.data.credentials.every((c) => c.name && c.createdAt), "목록에 패스키 2개, 각각 이름과 등록 날짜가 있음");
const secondId = aliceDevice2.credentials[0].id;
const renamed = await alice.call("PATCH", `/api/credentials/${secondId}`, { name: "alice 휴대폰 (이름 바꿈)" });
check(renamed.status === 200 && renamed.data.credentials.some((c) => c.name === "alice 휴대폰 (이름 바꿈)"), "내 패스키 이름 바꾸기 → 200");
const bobRename = await bob.call("PATCH", `/api/credentials/${secondId}`, { name: "남이 바꾼 이름" });
check(bobRename.status === 404, `${bob.name}가 ${alice.name}의 패스키 이름 바꾸기 → 404`);
const firstId = aliceDevice1.credentials[0].id;
const del = await alice.call("DELETE", `/api/credentials/${firstId}`);
check(del.status === 200 && del.data.count === 1, "첫 번째 패스키 삭제 → 1개 남음");
await alice.call("POST", "/api/logout", {});
const withRemaining = await alice.login(aliceDevice2);
check(withRemaining.ver.status === 200, "남은 패스키로 로그인 → 200");
const deletedOpt = await anon.call("POST", "/api/login/options", {});
const deletedResp = await aliceDevice1.get(deletedOpt.data, firstId);
const withDeleted = await anon.call("POST", "/api/login/verify", { response: deletedResp });
check(withDeleted.status === 401 && withDeleted.data.error === "unknown_credential", "지운 패스키로 로그인 → 401 unknown_credential");
const lastId = aliceDevice2.credentials[0].id;
const delLast = await alice.call("DELETE", `/api/credentials/${lastId}`);
check(delLast.status === 409, "마지막 남은 패스키 삭제 → 409 (계정이 잠기는 것을 막음)");
const bobDelAlice = await bob.call("DELETE", `/api/credentials/${lastId}`);
check(bobDelAlice.status === 404, `${bob.name}가 ${alice.name}의 패스키 삭제 요청 → 404`);

// 8. 다른 출처
section("8. 다른 출처에서 온 요청", "CSRF 방어(추가 확인)");
const evil = await alice.call("POST", "/api/private", { title: "다른 사이트에서 보낸 요청" }, { origin: "https://evil.example" });
check(evil.status === 403, "Origin이 다른 POST → 403");

// 1번 검사 마무리: 로그인 없이 받은 HTML에 비공개 내용이 없는지
const secrets = [...aliceBefore.data.items, ...bobBefore.data.items].map((i) => i.body);
check(secrets.every((s) => !page.text.includes(s) && !home.text.includes(s)), "로그인 없이 받은 / 와 /private.html 소스 어디에도 비공개 항목 내용이 없음");

const out = log.join("\n") + `\n\n---\n결과: ${failures === 0 ? "모두 통과" : `${failures}개 실패`}\n`;
mkdirSync("evidence", { recursive: true });
const file = `evidence/e2e-${RP_ID.replace(/[^a-z0-9.-]/gi, "_")}.md`;
writeFileSync(file, out);
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`} — ${file}`);
process.exit(failures ? 1 : 0);
