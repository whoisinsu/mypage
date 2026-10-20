// 비공개 영역 화면. 비공개 내용은 이 파일에도, private.html에도 없고
// 로그인한 뒤 서버(/api/*)에서만 받아옵니다.
document.addEventListener("DOMContentLoaded", () => {
  const { startRegistration, startAuthentication, browserSupportsWebAuthn } = window.SimpleWebAuthnBrowser;

  const $ = (id) => document.getElementById(id);
  const statusEl = $("status");
  const signedOut = $("signed-out");
  const signedIn = $("signed-in");
  const logEl = $("log");
  const logEntries = [];
  let lastLoginBody = null;

  const setStatus = (text, kind = "info") => {
    statusEl.textContent = text;
    statusEl.dataset.kind = kind;
  };

  const fmtDate = (ms) =>
    ms ? new Date(ms).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) : "—";

  // ───────── 요청 기록 ─────────
  // 탭을 닫기 전까지는 새로고침해도 기록이 남도록 sessionStorage에 둡니다.
  // 세션 값은 HttpOnly 쿠키에만 있어서 이 기록에는 들어가지 않습니다.
  const LOG_KEY = "mypage-request-log";
  const LOG_MAX = 200;

  function saveLog() {
    try {
      sessionStorage.setItem(LOG_KEY, JSON.stringify(logEntries));
    } catch {}
  }

  function renderLogEntry(entry) {
    const { method, path, reqBody, status, resBody } = entry;
    const li = document.createElement("li");
    li.className = status >= 400 ? "log-fail" : "log-ok";
    const head = document.createElement("p");
    head.className = "log-line";
    head.textContent = `${method} ${path} → ${status}`;
    const time = document.createElement("span");
    time.className = "log-time";
    time.textContent = new Date(entry.at).toLocaleTimeString("ko-KR");
    head.append(" ", time);
    li.append(head);
    for (const [label, data] of [["요청 본문", reqBody], ["응답 본문", resBody]]) {
      if (data === undefined) continue;
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = label;
      const pre = document.createElement("pre");
      pre.textContent = JSON.stringify(data, null, 2);
      details.append(summary, pre);
      li.append(details);
    }
    logEl.prepend(li);
  }

  function addLog(method, path, reqBody, status, resBody) {
    const entry = { at: new Date().toISOString(), method, path, reqBody, status, resBody };
    logEntries.push(entry);
    if (logEntries.length > LOG_MAX) logEntries.splice(0, logEntries.length - LOG_MAX);
    saveLog();
    renderLogEntry(entry);
  }

  try {
    const saved = JSON.parse(sessionStorage.getItem(LOG_KEY) ?? "[]");
    if (Array.isArray(saved)) {
      logEntries.push(...saved);
      saved.forEach(renderLogEntry);
    }
  } catch {}

  $("log-clear").addEventListener("click", () => {
    logEntries.length = 0;
    logEl.textContent = "";
    saveLog();
  });

  $("log-copy").addEventListener("click", async () => {
    const md = logEntries
      .map((e) => {
        let s = `### ${e.method} ${e.path} → ${e.status}\n_${e.at}_\n`;
        if (e.reqBody !== undefined) s += `\n요청 본문\n\`\`\`json\n${JSON.stringify(e.reqBody, null, 2)}\n\`\`\`\n`;
        if (e.resBody !== undefined) s += `\n응답 본문\n\`\`\`json\n${JSON.stringify(e.resBody, null, 2)}\n\`\`\`\n`;
        return s;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(md);
      setStatus("요청 기록을 Markdown으로 복사했습니다.");
    } catch {
      setStatus("복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.", "error");
    }
  });

  // ───────── 서버 호출 ─────────

  async function api(method, path, body) {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {}
    addLog(method, path, body, res.status, data);
    if (!res.ok) {
      const err = new Error(data?.message ?? `요청 실패 (${res.status})`);
      err.status = res.status;
      err.code = data?.error;
      throw err;
    }
    return data;
  }

  // ───────── 화면 그리기 ─────────

  async function refresh() {
    let session;
    try {
      session = await api("GET", "api/session");
    } catch {
      setStatus("이 주소에서는 비공개 영역을 쓸 수 없습니다. 인증 서버가 있는 주소에서 열어 주세요.", "error");
      return;
    }
    if (!session?.authenticated) {
      signedIn.hidden = true;
      signedOut.hidden = false;
      $("owner-name").textContent = "";
      $("item-list").textContent = "";
      $("passkey-list").textContent = "";
      return;
    }
    signedOut.hidden = true;
    signedIn.hidden = false;
    $("owner-name").textContent = session.user.username;
    const [privateData, creds] = await Promise.all([api("GET", "api/private"), api("GET", "api/credentials")]);
    renderItems(privateData);
    renderPasskeys(creds);
  }

  function renderItems(data) {
    $("item-count").textContent = `${data.count}개`;
    const list = $("item-list");
    list.textContent = "";
    for (const item of data.items) {
      const li = document.createElement("li");
      const cat = document.createElement("span");
      cat.className = "item-cat";
      cat.textContent = item.category;
      const title = document.createElement("strong");
      title.textContent = item.title;
      const body = document.createElement("p");
      body.textContent = item.body;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "link-btn";
      del.textContent = "지우기";
      del.addEventListener("click", async () => {
        try {
          renderItems(await api("DELETE", `api/private/${item.id}`));
        } catch (e) {
          setStatus(e.message, "error");
        }
      });
      li.append(cat, title, body, del);
      list.append(li);
    }
  }

  function renderPasskeys(data) {
    $("passkey-count").textContent = `${data.count}개`;
    const tbody = $("passkey-list");
    tbody.textContent = "";
    for (const c of data.credentials) {
      const tr = document.createElement("tr");
      const cells = [c.name, fmtDate(c.createdAt), fmtDate(c.lastUsedAt), `${c.storedIn} · ${c.deviceType === "multiDevice" ? "동기화됨" : "이 기기에만"}`];
      for (const text of cells) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.append(td);
      }
      const td = document.createElement("td");
      td.className = "passkey-actions";
      const rename = document.createElement("button");
      rename.type = "button";
      rename.className = "link-btn";
      rename.textContent = "이름 바꾸기";
      rename.addEventListener("click", async () => {
        const name = prompt("새 패스키 이름 (1~40자)", c.name);
        if (name === null || name.trim() === c.name) return;
        try {
          renderPasskeys(await api("PATCH", `api/credentials/${c.id}`, { name: name.trim() }));
          setStatus(`패스키 이름을 "${name.trim()}"(으)로 바꿨습니다.`);
        } catch (e) {
          setStatus(e.message, "error");
        }
      });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "link-btn";
      del.textContent = "지우기";
      del.disabled = data.count <= 1;
      del.title = data.count <= 1 ? "마지막 남은 패스키는 지울 수 없습니다" : "";
      del.addEventListener("click", async () => {
        if (!confirm(`"${c.name}" 패스키를 지울까요? 지운 패스키로는 더 이상 들어올 수 없습니다.`)) return;
        try {
          renderPasskeys(await api("DELETE", `api/credentials/${c.id}`));
          setStatus(`"${c.name}" 패스키를 지웠습니다. 기기에 남아 있는 그 패스키로는 더 이상 로그인되지 않습니다.`);
        } catch (e) {
          setStatus(e.message, "error");
        }
      });
      td.append(rename, del);
      tr.append(td);
      tbody.append(tr);
    }
  }

  // ───────── 등록 ─────────

  async function register(body) {
    const options = await api("POST", "api/register/options", body);
    let response;
    try {
      response = await startRegistration({ optionsJSON: options });
    } catch (e) {
      // 사용자가 창을 닫았거나 취소한 경우: 서버에 보관 중인 질문을 지우고 안내합니다.
      await api("POST", "api/register/cancel", { challenge: options.challenge }).catch(() => {});
      if (e.name === "InvalidStateError") {
        throw new Error("이 기기에는 이미 이 계정의 패스키가 있습니다. 다른 기기나 다른 비밀번호 관리자에서 등록해 보세요.");
      }
      throw new Error("패스키 등록을 취소했습니다. 서버에는 아무것도 저장되지 않았습니다.");
    }
    return api("POST", "api/register/verify", { response });
  }

  $("signup-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const form = new FormData(ev.target);
    setStatus("패스키를 만드는 중입니다…");
    try {
      const result = await register({ username: form.get("username"), passkeyName: form.get("passkeyName") });
      setStatus(`등록했습니다. 서버에는 "${result.storedCredential.name}"의 공개키만 저장되었습니다.`);
      ev.target.reset();
      await refresh();
    } catch (e) {
      setStatus(e.message, "error");
    }
  });

  $("add-passkey-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const form = new FormData(ev.target);
    setStatus("새 패스키를 만드는 중입니다…");
    try {
      const result = await register({ passkeyName: form.get("passkeyName") });
      setStatus(`"${result.storedCredential.name}" 패스키를 추가했습니다.`);
      ev.target.reset();
      await refresh();
    } catch (e) {
      setStatus(e.message, "error");
    }
  });

  // ───────── 로그인 ─────────

  function flipOneByte(b64url) {
    const bin = atob(b64url.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    bytes[bytes.length - 1] ^= 0x01;
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  $("login-btn").addEventListener("click", async () => {
    setStatus("기기에서 패스키를 골라 주세요…");
    try {
      const options = await api("POST", "api/login/options", {});
      let response;
      try {
        response = await startAuthentication({ optionsJSON: options });
      } catch {
        throw new Error("로그인을 취소했습니다.");
      }
      if ($("tamper-signature").checked) {
        response.response.signature = flipOneByte(response.response.signature);
      }
      lastLoginBody = { response };
      $("replay-btn").disabled = false;
      const result = await api("POST", "api/login/verify", lastLoginBody);
      setStatus(`"${result.passkey}" 패스키로 ${result.user.username} 계정에 들어왔습니다.`);
      await refresh();
    } catch (e) {
      setStatus(e.message, "error");
    }
  });

  $("replay-btn").addEventListener("click", async () => {
    if (!lastLoginBody) return;
    try {
      await api("POST", "api/login/verify", lastLoginBody);
      setStatus("재사용한 응답이 통과했습니다. 이러면 안 됩니다!", "error");
      await refresh();
    } catch (e) {
      setStatus(`재사용한 응답은 거절되었습니다: ${e.message}`);
    }
  });

  $("logout-btn").addEventListener("click", async () => {
    try {
      await api("POST", "api/logout", {});
      setStatus("로그아웃했습니다. 쓰던 세션 값은 서버에서 지워졌습니다.");
      await refresh();
    } catch (e) {
      setStatus(e.message, "error");
    }
  });

  $("item-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const form = new FormData(ev.target);
    try {
      renderItems(await api("POST", "api/private", Object.fromEntries(form)));
      ev.target.reset();
    } catch (e) {
      setStatus(e.message, "error");
    }
  });

  if (!browserSupportsWebAuthn()) {
    setStatus("이 브라우저는 패스키를 지원하지 않습니다.", "error");
  }
  refresh();
});
