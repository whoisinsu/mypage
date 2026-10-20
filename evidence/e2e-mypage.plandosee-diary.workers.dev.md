# 패스키 확인 기록 (자동 테스트)

- 대상: https://mypage.plandosee-diary.workers.dev
- 실행 시각: 2026-10-20T15:49:34.602Z
- 계정: `alice-tvnj5`, `bob-tvnj5` (테스트용으로 만든 계정)
- 인증기: 이 스크립트 안의 소프트웨어 인증기(P-256 키를 메모리에서 만들고, 개인키는 내보낼 수 없게 생성)
- 세션 쿠키 값은 앞 4자와 뒤 2자만 남기고 가렸습니다.


## 1. 로그인 없이 비공개 자료 열기

관련 통과 기준: T08-C15, C16, C17, C18


**[로그인 안 함]** `GET /private.html` → **307**

```http
GET /private.html
```

받은 `private.html` 본문 길이: 0자. 아래 문자열이 들어 있는지 검사했습니다.


**[로그인 안 함]** `GET /` → **200**

```http
GET /
```


**[로그인 안 함]** `GET /api/private` → **401**

```http
GET /api/private
```

응답 본문
```json
{
  "error": "unauthenticated",
  "message": "패스키로 로그인해야 볼 수 있습니다."
}
```

- ✅ 로그인 없이 GET /api/private → 401

## 2. 패스키 등록

관련 통과 기준: T08-C19, C20, C21, C22, C23, C24, C36


**[alice-tvnj5]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "username": "alice-tvnj5",
  "passkeyName": "alice 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "pddWFYFGmFhCN7WNVsFI7KbszIdK_mBi48Vt7xwi2Xo",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk",
    "name": "alice-tvnj5",
    "displayName": ""
  },
  "pubKeyCredParams": [
    {
      "alg": -8,
      "type": "public-key"
    },
    {
      "alg": -7,
      "type": "public-key"
    },
    {
      "alg": -257,
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred",
    "requireResidentKey": true
  },
  "extensions": {
    "credProps": true
  },
  "hints": []
}
```


**[alice-tvnj5]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "rawId": "f2DT-UyIGYo8rgafHBDrVw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoicGRkV0ZZRkdtRmhDTjdXTlZzRkk3S2JzeklkS19tQmk0OFZ0N3h3aTJYbyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViU_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UalFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEH9g0_lMiBmKPK4GnxwQ61elAQIDJiABIVggWu7_WNFgZiQtcP2Bbm5ecbl2Z2ij2mVngQOMNorWrKYiWCB-0sBlOMBn7rpPGZb97NmoVTeqLKRp2GFYC62zze8aeA",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=qGO6…(가림)…es; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "name": "alice 노트북 (테스트 인증기)",
    "createdAt": 1792511376618,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIFru_1jRYGYkLXD9gW5uXnG5dmdoo9plZ4EDjDaK1qymIlggftLAZTjAZ-66TxmW_ezZqFU3qiykadhhWAuts83vGng",
    "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
    "counter": 0,
    "transports": [
      "internal"
    ],
    "deviceType": "singleDevice",
    "backedUp": false,
    "aaguid": "00000000-0000-0000-0000-000000000000",
    "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
  }
}
```

- ✅ alice 등록 성공
- ✅ 등록 요청 본문에 개인키 항목이 없음(id·clientDataJSON·attestationObject·transports뿐)
- ✅ 서버에 공개키와 패스키 이름이 저장됨

**[bob-tvnj5]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "username": "bob-tvnj5",
  "passkeyName": "bob 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "2jWXkkuMPtop8fc26K_y7efhoc31HWHLLY8oUdoLGnk",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "Ud3NKdTnmgKKp8M_RuhRB2AXl7LaS9l_SV-wcGRd2rk",
    "name": "bob-tvnj5",
    "displayName": ""
  },
  "pubKeyCredParams": [
    {
      "alg": -8,
      "type": "public-key"
    },
    {
      "alg": -7,
      "type": "public-key"
    },
    {
      "alg": -257,
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred",
    "requireResidentKey": true
  },
  "extensions": {
    "credProps": true
  },
  "hints": []
}
```


**[bob-tvnj5]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "_R162Qt1Ii_cG_4T1-R-wQ",
    "rawId": "_R162Qt1Ii_cG_4T1-R-wQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiMmpXWGtrdU1QdG9wOGZjMjZLX3k3ZWZob2MzMUhXSExMWThvVWRvTEduayIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViU_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UalFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEP0detkLdSIv3Bv-E9fkfsGlAQIDJiABIVggt0cjowQ1MiQDRqiumjSYv8Bful-fpC33i-PoQ6a9GjQiWCBHCL7JeT1WXVi1WK0nb0Afv02qLpK69PW_awfyeDsrPQ",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=_lJQ…(가림)…dM; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "_R162Qt1Ii_cG_4T1-R-wQ",
    "name": "bob 노트북 (테스트 인증기)",
    "createdAt": 1792511377561,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYILdHI6MENTIkA0aorpo0mL_AX7pfn6Qt94vj6EOmvRo0IlggRwi-yXk9Vl1YtVitJ29AH79Nqi6SuvT1v2sH8ng7Kz0",
    "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
    "counter": 0,
    "transports": [
      "internal"
    ],
    "deviceType": "singleDevice",
    "backedUp": false,
    "aaguid": "00000000-0000-0000-0000-000000000000",
    "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
  }
}
```

- ✅ bob 등록 성공
- ✅ 등록 질문이 요청마다 다름: pddWFYFGmFhCN7WNVsFI7KbszIdK_mBi48Vt7xwi2Xo ≠ 2jWXkkuMPtop8fc26K_y7efhoc31HWHLLY8oUdoLGnk

## 3. 등록을 중간에 취소

관련 통과 기준: T08-C25


**[로그인 안 함]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "username": "cancel-tvnj5",
  "passkeyName": "취소할 패스키"
}
```

응답 본문
```json
{
  "challenge": "nLnCqP0ImBGnrYfDlcppQg7-9oQDF_L8mJCCCnmuBHc",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "0ptlZ6ZQWOV10xyE5LXQAy9fD0EgwJUFG6x0sbgxGu4",
    "name": "cancel-tvnj5",
    "displayName": ""
  },
  "pubKeyCredParams": [
    {
      "alg": -8,
      "type": "public-key"
    },
    {
      "alg": -7,
      "type": "public-key"
    },
    {
      "alg": -257,
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred",
    "requireResidentKey": true
  },
  "extensions": {
    "credProps": true
  },
  "hints": []
}
```

여기서 사용자가 패스키 창을 닫았다고 가정하고, 화면이 하는 것처럼 취소 요청을 보냅니다.


**[로그인 안 함]** `POST /api/register/cancel` → **200**

```http
POST /api/register/cancel
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "challenge": "nLnCqP0ImBGnrYfDlcppQg7-9oQDF_L8mJCCCnmuBHc"
}
```

응답 본문
```json
{
  "cancelled": true,
  "removedChallenges": 1
}
```

- ✅ 보관 중이던 등록 질문이 지워짐

**[로그인 안 함]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "username": "cancel-tvnj5",
  "passkeyName": "확인용"
}
```

응답 본문
```json
{
  "challenge": "M5SYUls7zUajzZobETEr-TFCzp6BTrJwGZXH6VzlGI8",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "42zCowjwwpUwMMQeYCCarEHhgHygQB9bzKjoUFNv7nA",
    "name": "cancel-tvnj5",
    "displayName": ""
  },
  "pubKeyCredParams": [
    {
      "alg": -8,
      "type": "public-key"
    },
    {
      "alg": -7,
      "type": "public-key"
    },
    {
      "alg": -257,
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred",
    "requireResidentKey": true
  },
  "extensions": {
    "credProps": true
  },
  "hints": []
}
```

- ✅ 같은 계정 이름으로 다시 시작할 수 있음 = 계정이 저장되지 않았음

## 4. 패스키로 로그인 · 틀린 서명 · 이미 쓴 질문 재사용

관련 통과 기준: T08-C27, C28, C29, C30, C31


**[alice-tvnj5]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=qGO6…(가림)…es
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 헤더: `Set-Cookie: __Host-sid=; Path=/…(가림)…/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

응답 본문
```json
{
  "loggedOut": true
}
```


**[alice-tvnj5]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "mypage.plandosee-diary.workers.dev",
  "challenge": "tUCkHQJU6zAhyLQib0lRsk0ltk3jr8YPN4S6StZ81MY",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-tvnj5]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "rawId": "f2DT-UyIGYo8rgafHBDrVw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoidFVDa0hRSlU2ekFoeUxRaWIwbFJzazBsdGszanI4WVBONFM2U3RaODFNWSIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAQ",
      "signature": "MEUCIQCGrqq5jKVqpykm5_eIsedumWTTjbxkY5E2NLIJbze_PQIgK_-nHLddV_2svN4Gd7H2yl4Cv-fodH4qb0Y3wRTBHLA",
      "userHandle": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=g-Zg…(가림)…Ig; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-tvnj5"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```

- ✅ 올바른 서명 → 200, 세션 발급

**[alice-tvnj5]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=g-Zg…(가림)…Ig
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 3,
  "items": [
    {
      "id": 11,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-tvnj5] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511376618
    },
    {
      "id": 12,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-tvnj5] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511376619
    },
    {
      "id": 13,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-tvnj5] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511376620
    }
  ]
}
```

- ✅ 로그인 뒤 GET /api/private → 200 (내 자료)

**[alice-tvnj5]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "mypage.plandosee-diary.workers.dev",
  "challenge": "U1rFJVNcD9V8GSLWBZfGfZqAXdsg-MedPbG3FaxST3Q",
  "timeout": 60000,
  "userVerification": "preferred"
}
```

서명의 마지막 바이트 하나를 바꿔서 보냅니다.


**[alice-tvnj5]** `POST /api/login/verify` → **401**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "rawId": "f2DT-UyIGYo8rgafHBDrVw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiVTFyRkpWTmNEOVY4R1NMV0JaZkdmWnFBWGRzZy1NZWRQYkczRmF4U1QzUSIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAg",
      "signature": "MEUCIDEFsCBCNVu_-OQPgpKUnJFrksyX0UH7Tftxpq0aBXTHAiEAkwOoKAP2-t357nxx6sk46F8-w9wkGZHXEpJQ0cHBdQw",
      "userHandle": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk"
    },
    "clientExtensionResults": {}
  }
}
```

응답 본문
```json
{
  "error": "signature_invalid",
  "message": "서명 확인에 실패했습니다."
}
```

- ✅ 틀린 서명 → 401 signature_invalid
- ✅ 로그인 질문이 요청마다 다름: tUCkHQJU6zAhyLQib0lRsk0ltk3jr8YPN4S6StZ81MY ≠ U1rFJVNcD9V8GSLWBZfGfZqAXdsg-MedPbG3FaxST3Q
성공했던 로그인 요청 본문을 한 글자도 바꾸지 않고 다시 보냅니다.


**[alice-tvnj5]** `POST /api/login/verify` → **400**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "rawId": "f2DT-UyIGYo8rgafHBDrVw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoidFVDa0hRSlU2ekFoeUxRaWIwbFJzazBsdGszanI4WVBONFM2U3RaODFNWSIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAQ",
      "signature": "MEUCIQCGrqq5jKVqpykm5_eIsedumWTTjbxkY5E2NLIJbze_PQIgK_-nHLddV_2svN4Gd7H2yl4Cv-fodH4qb0Y3wRTBHLA",
      "userHandle": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk"
    },
    "clientExtensionResults": {}
  }
}
```

응답 본문
```json
{
  "error": "challenge_not_found",
  "message": "서버가 보관 중인 질문이 아닙니다. 이미 쓴 질문이거나 만료되었습니다."
}
```

- ✅ 이미 쓴 질문 재사용 → 400 challenge_not_found

## 5. 로그아웃 뒤 같은 세션 값으로 다시 요청

관련 통과 기준: T08-C32, C33, C34

- ✅ 로그아웃 전에는 같은 세션 값으로 200

**[alice-tvnj5]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=g-Zg…(가림)…Ig
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 헤더: `Set-Cookie: __Host-sid=; Path=/…(가림)…/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

응답 본문
```json
{
  "loggedOut": true
}
```


**[alice-tvnj5]** `GET /api/private` → **401**

```http
GET /api/private
Cookie: __Host-sid=g-Zg…(가림)…Ig
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "unauthenticated",
  "message": "패스키로 로그인해야 볼 수 있습니다."
}
```

- ✅ 로그아웃 뒤 같은 세션 값 → 401

**[alice-tvnj5]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "mypage.plandosee-diary.workers.dev",
  "challenge": "tT06MDthyTUXmFC8qDZ0JPHpbt8cYkQASbvoqvhLpEo",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-tvnj5]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "rawId": "f2DT-UyIGYo8rgafHBDrVw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoidFQwNk1EdGh5VFVYbUZDOHFEWjBKUEhwYnQ4Y1lrUUFTYnZvcXZoTHBFbyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAw",
      "signature": "MEYCIQDvaCnsp_z16YNk5VzKqParEgRR5aoBTkmpsOt7C0br8gIhAJMrN55JeqFQ5fNqZaatoP0BwRtt_-MCp4YYjIkEq1fl",
      "userHandle": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=IxUX…(가림)…bA; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-tvnj5"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```


## 6. 다른 계정의 비공개 자료 읽기

관련 통과 기준: T08-C36, C37, C38, C39, C40


**[bob-tvnj5]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=_lJQ…(가림)…dM
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "bob-tvnj5",
  "count": 3,
  "items": [
    {
      "id": 14,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-tvnj5] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511377561
    },
    {
      "id": 15,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-tvnj5] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511377562
    },
    {
      "id": 16,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-tvnj5] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511377563
    }
  ]
}
```


**[alice-tvnj5]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 3,
  "items": [
    {
      "id": 11,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-tvnj5] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511376618
    },
    {
      "id": 12,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-tvnj5] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511376619
    },
    {
      "id": 13,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-tvnj5] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511376620
    }
  ]
}
```

거절 전 자료 건수: alice-tvnj5 3건, bob-tvnj5 3건


**[alice-tvnj5]** `GET /api/users/bob-tvnj5/private` → **403**

```http
GET /api/users/bob-tvnj5/private
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ alice-tvnj5 → bob-tvnj5 자료 요청 → 403

**[bob-tvnj5]** `GET /api/users/alice-tvnj5/private` → **403**

```http
GET /api/users/alice-tvnj5/private
Cookie: __Host-sid=_lJQ…(가림)…dM
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ bob-tvnj5 → alice-tvnj5 자료 요청 → 403

**[alice-tvnj5]** `DELETE /api/private/14` → **404**

```http
DELETE /api/private/14
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 항목 중에 그런 것이 없습니다."
}
```

- ✅ alice-tvnj5가 bob-tvnj5의 항목(id 14) 삭제 요청 → 404

**[alice-tvnj5]** `GET /api/private?user=bob-tvnj5` → **200**

```http
GET /api/private?user=bob-tvnj5
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 3,
  "items": [
    {
      "id": 11,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-tvnj5] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511376618
    },
    {
      "id": 12,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-tvnj5] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511376619
    },
    {
      "id": 13,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-tvnj5] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511376620
    }
  ]
}
```

- ✅ 주소에 ?user=다른계정 → 그래도 내 자료만 돌아옴

**[alice-tvnj5]** `POST /api/private` → **201**

```http
POST /api/private
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "owner": "bob-tvnj5",
  "user": "bob-tvnj5",
  "category": "메모",
  "title": "본문에 다른 계정을 적어 보낸 항목",
  "body": "주인은 세션으로만 정해집니다."
}
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 4,
  "items": [
    {
      "id": 11,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-tvnj5] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511376618
    },
    {
      "id": 12,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-tvnj5] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511376619
    },
    {
      "id": 13,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-tvnj5] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511376620
    },
    {
      "id": 17,
      "category": "메모",
      "title": "본문에 다른 계정을 적어 보낸 항목",
      "body": "주인은 세션으로만 정해집니다.",
      "created_at": 1792511383453
    }
  ]
}
```

- ✅ 요청 본문에 owner/user=다른계정 → 내 자료에 저장되고 내 자료만 돌아옴

**[bob-tvnj5]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=_lJQ…(가림)…dM
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "bob-tvnj5",
  "count": 3,
  "items": [
    {
      "id": 14,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-tvnj5] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511377561
    },
    {
      "id": 15,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-tvnj5] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511377562
    },
    {
      "id": 16,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-tvnj5] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511377563
    }
  ]
}
```

- ✅ 거절 뒤 bob-tvnj5 자료 건수 그대로: 3 → 3
- ✅ bob-tvnj5의 응답에 alice-tvnj5 자료가 섞이지 않음

## 7. 패스키 두 개 등록 · 하나 지운 뒤 로그인

관련 통과 기준: T08-C42, C43, C44, C45, C46


**[alice-tvnj5]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "passkeyName": "alice 휴대폰 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "tUpAGHzssuFfloCzZoemvRcQ-nELGy-AByTleF7sQ0w",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk",
    "name": "alice-tvnj5",
    "displayName": ""
  },
  "pubKeyCredParams": [
    {
      "alg": -8,
      "type": "public-key"
    },
    {
      "alg": -7,
      "type": "public-key"
    },
    {
      "alg": -257,
      "type": "public-key"
    }
  ],
  "timeout": 60000,
  "attestation": "none",
  "excludeCredentials": [
    {
      "id": "f2DT-UyIGYo8rgafHBDrVw",
      "transports": [
        "internal"
      ],
      "type": "public-key"
    }
  ],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred",
    "requireResidentKey": true
  },
  "extensions": {
    "credProps": true
  },
  "hints": []
}
```


**[alice-tvnj5]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "z3ybz-rHPhiUWdg1NU9Puw",
    "rawId": "z3ybz-rHPhiUWdg1NU9Puw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoidFVwQUdIenNzdUZmbG9DelpvZW12UmNRLW5FTEd5LUFCeVRsZUY3c1EwdyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViU_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UalFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEM98m8_qxz4YlFnYNTVPT7ulAQIDJiABIVggQo3xRRLgnbDUqwXbxUfWiQanWf9u6m5dDYyUdlDUboYiWCBLjoSCm7lU0X1Wk9vOP8dDCudyuIwKeN_ulFQ3rx49Jg",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "z3ybz-rHPhiUWdg1NU9Puw",
    "name": "alice 휴대폰 (테스트 인증기)",
    "createdAt": 1792511384740,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIEKN8UUS4J2w1KsF28VH1okGp1n_bupuXQ2MlHZQ1G6GIlggS46Egpu5VNF9VpPbzj_HQwrncriMCnjf7pRUN68ePSY",
    "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
    "counter": 0,
    "transports": [
      "internal"
    ],
    "deviceType": "singleDevice",
    "backedUp": false,
    "aaguid": "00000000-0000-0000-0000-000000000000",
    "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
  }
}
```

- ✅ 로그인한 상태에서 두 번째 패스키 등록

**[alice-tvnj5]** `GET /api/credentials` → **200**

```http
GET /api/credentials
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 2,
  "credentials": [
    {
      "id": "f2DT-UyIGYo8rgafHBDrVw",
      "name": "alice 노트북 (테스트 인증기)",
      "createdAt": 1792511376618,
      "lastUsedAt": 1792511381850,
      "publicKey": "pQECAyYgASFYIFru_1jRYGYk…",
      "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
      "counter": 3,
      "transports": [
        "internal"
      ],
      "deviceType": "singleDevice",
      "backedUp": false,
      "aaguid": "00000000-0000-0000-0000-000000000000",
      "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
    },
    {
      "id": "z3ybz-rHPhiUWdg1NU9Puw",
      "name": "alice 휴대폰 (테스트 인증기)",
      "createdAt": 1792511384740,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIEKN8UUS4J2w…",
      "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
      "counter": 0,
      "transports": [
        "internal"
      ],
      "deviceType": "singleDevice",
      "backedUp": false,
      "aaguid": "00000000-0000-0000-0000-000000000000",
      "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
    }
  ]
}
```

- ✅ 목록에 패스키 2개, 각각 이름과 등록 날짜가 있음

**[alice-tvnj5]** `PATCH /api/credentials/z3ybz-rHPhiUWdg1NU9Puw` → **200**

```http
PATCH /api/credentials/z3ybz-rHPhiUWdg1NU9Puw
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "name": "alice 휴대폰 (이름 바꿈)"
}
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 2,
  "credentials": [
    {
      "id": "f2DT-UyIGYo8rgafHBDrVw",
      "name": "alice 노트북 (테스트 인증기)",
      "createdAt": 1792511376618,
      "lastUsedAt": 1792511381850,
      "publicKey": "pQECAyYgASFYIFru_1jRYGYk…",
      "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
      "counter": 3,
      "transports": [
        "internal"
      ],
      "deviceType": "singleDevice",
      "backedUp": false,
      "aaguid": "00000000-0000-0000-0000-000000000000",
      "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
    },
    {
      "id": "z3ybz-rHPhiUWdg1NU9Puw",
      "name": "alice 휴대폰 (이름 바꿈)",
      "createdAt": 1792511384740,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIEKN8UUS4J2w…",
      "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
      "counter": 0,
      "transports": [
        "internal"
      ],
      "deviceType": "singleDevice",
      "backedUp": false,
      "aaguid": "00000000-0000-0000-0000-000000000000",
      "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
    }
  ]
}
```

- ✅ 내 패스키 이름 바꾸기 → 200

**[bob-tvnj5]** `PATCH /api/credentials/z3ybz-rHPhiUWdg1NU9Puw` → **404**

```http
PATCH /api/credentials/z3ybz-rHPhiUWdg1NU9Puw
Cookie: __Host-sid=_lJQ…(가림)…dM
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "name": "남이 바꾼 이름"
}
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 패스키 중에 그런 것이 없습니다."
}
```

- ✅ bob-tvnj5가 alice-tvnj5의 패스키 이름 바꾸기 → 404

**[alice-tvnj5]** `DELETE /api/credentials/f2DT-UyIGYo8rgafHBDrVw` → **200**

```http
DELETE /api/credentials/f2DT-UyIGYo8rgafHBDrVw
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-tvnj5",
  "count": 1,
  "credentials": [
    {
      "id": "z3ybz-rHPhiUWdg1NU9Puw",
      "name": "alice 휴대폰 (이름 바꿈)",
      "createdAt": 1792511384740,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIEKN8UUS4J2w…",
      "publicKeyFormat": "COSE_Key (base64url) — 서명을 확인하는 데만 쓰는 공개키",
      "counter": 0,
      "transports": [
        "internal"
      ],
      "deviceType": "singleDevice",
      "backedUp": false,
      "aaguid": "00000000-0000-0000-0000-000000000000",
      "storedIn": "알 수 없음(보안 키 또는 정보 비공개)"
    }
  ]
}
```

- ✅ 첫 번째 패스키 삭제 → 1개 남음

**[alice-tvnj5]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=IxUX…(가림)…bA
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 헤더: `Set-Cookie: __Host-sid=; Path=/…(가림)…/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

응답 본문
```json
{
  "loggedOut": true
}
```


**[alice-tvnj5]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "mypage.plandosee-diary.workers.dev",
  "challenge": "9uTLGtrjQqm9lZIL9ayjM8r4uOfG4GZjKDMb6lqowXk",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-tvnj5]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "z3ybz-rHPhiUWdg1NU9Puw",
    "rawId": "z3ybz-rHPhiUWdg1NU9Puw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiOXVUTEd0cmpRcW05bFpJTDlheWpNOHI0dU9mRzRHWmpLRE1iNmxxb3dYayIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAQ",
      "signature": "MEUCIHpWSCLaSPZZUxGj9Zo2XGJJfOwQMI16nQrk6Uu59L-GAiEAiE6Y-zfjXU5l2XX8ITnNxdXWjtSIhZ2mddLZ6XyFtFc",
      "userHandle": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=JMh0…(가림)…b0; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-tvnj5"
  },
  "passkey": "alice 휴대폰 (이름 바꿈)"
}
```

- ✅ 남은 패스키로 로그인 → 200

**[로그인 안 함]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "mypage.plandosee-diary.workers.dev",
  "challenge": "4SeV9yMwYGgjnnJFlvkWsZPXurZ9lY3tWWWE03ZGHbM",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[로그인 안 함]** `POST /api/login/verify` → **401**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "f2DT-UyIGYo8rgafHBDrVw",
    "rawId": "f2DT-UyIGYo8rgafHBDrVw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiNFNlVjl5TXdZR2dqbm5KRmx2a1dzWlBYdXJaOWxZM3RXV1dFMDNaR0hiTSIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAABA",
      "signature": "MEUCIH0OGnLj9PcTNOpJTOqA1uH-z23HUdUzc2lluPoCcM4fAiEAy2nylaMGOpHX5JDesmA2W6mGthF6cXA50xkpGAfRpH8",
      "userHandle": "L_S6KrXuzTWJRtsPk3GRnSf0j64Dd8w7fFNppzq_tHk"
    },
    "clientExtensionResults": {}
  }
}
```

응답 본문
```json
{
  "error": "unknown_credential",
  "message": "등록되어 있지 않거나 지워진 패스키입니다."
}
```

- ✅ 지운 패스키로 로그인 → 401 unknown_credential

**[alice-tvnj5]** `DELETE /api/credentials/z3ybz-rHPhiUWdg1NU9Puw` → **409**

```http
DELETE /api/credentials/z3ybz-rHPhiUWdg1NU9Puw
Cookie: __Host-sid=JMh0…(가림)…b0
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "last_passkey",
  "message": "마지막 남은 패스키는 지울 수 없습니다. 다른 패스키를 먼저 등록하세요."
}
```

- ✅ 마지막 남은 패스키 삭제 → 409 (계정이 잠기는 것을 막음)

**[bob-tvnj5]** `DELETE /api/credentials/z3ybz-rHPhiUWdg1NU9Puw` → **404**

```http
DELETE /api/credentials/z3ybz-rHPhiUWdg1NU9Puw
Cookie: __Host-sid=_lJQ…(가림)…dM
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 패스키 중에 그런 것이 없습니다."
}
```

- ✅ bob-tvnj5가 alice-tvnj5의 패스키 삭제 요청 → 404

## 8. 다른 출처에서 온 요청

관련 통과 기준: CSRF 방어(추가 확인)


**[alice-tvnj5]** `POST /api/private` → **403**

```http
POST /api/private
Cookie: __Host-sid=JMh0…(가림)…b0
Origin: https://evil.example
```

요청 본문
```json
{
  "title": "다른 사이트에서 보낸 요청"
}
```

응답 본문
```json
{
  "error": "bad_origin",
  "message": "다른 출처에서 온 요청은 받지 않습니다."
}
```

- ✅ Origin이 다른 POST → 403
- ✅ 로그인 없이 받은 / 와 /private.html 소스 어디에도 비공개 항목 내용이 없음

---
결과: 모두 통과
