-- 계정: 비밀번호 칸이 없습니다. 이름과 패스키만으로 식별합니다.
CREATE TABLE users (
  id               TEXT PRIMARY KEY,           -- 서버가 만든 무작위 ID
  username         TEXT NOT NULL UNIQUE,
  webauthn_user_id TEXT NOT NULL UNIQUE,       -- 인증기에 넘기는 사용자 핸들(base64url)
  created_at       INTEGER NOT NULL
);

-- 패스키: 서버에는 공개키만 저장합니다. 개인키는 기기를 떠나지 않습니다.
CREATE TABLE credentials (
  id            TEXT PRIMARY KEY,              -- credential ID(base64url)
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key    TEXT NOT NULL,                 -- COSE 형식 공개키(base64url)
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT,                          -- JSON 배열
  device_type   TEXT,                          -- singleDevice | multiDevice
  backed_up     INTEGER NOT NULL DEFAULT 0,
  aaguid        TEXT,                          -- 저장한 곳(인증기 종류)을 알아보는 값
  name          TEXT NOT NULL,                 -- 사람이 알아볼 수 있는 이름
  created_at    INTEGER NOT NULL,
  last_used_at  INTEGER
);
CREATE INDEX idx_credentials_user ON credentials(user_id);

-- 일회용 질문: 확인할 때까지 서버에 보관하고, 확인하는 순간 지웁니다.
CREATE TABLE challenges (
  challenge    TEXT PRIMARY KEY,               -- base64url
  purpose      TEXT NOT NULL CHECK (purpose IN ('register', 'login')),
  user_id      TEXT,                           -- 로그인한 상태에서 패스키를 추가할 때
  username     TEXT,                           -- 새 계정을 만들 때
  webauthn_user_id TEXT,                       -- 새 계정에 줄 사용자 핸들
  passkey_name TEXT,
  expires_at   INTEGER NOT NULL
);

-- 세션: 쿠키에는 무작위 값만, 서버에는 그 값의 SHA-256 해시만 저장합니다.
CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- 비공개 자료: 만들어 넣은 내용만 넣습니다. 실제 개인정보는 넣지 않습니다.
CREATE TABLE private_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_private_items_user ON private_items(user_id);
