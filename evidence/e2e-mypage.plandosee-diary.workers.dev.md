# 패스키 확인 기록 (자동 테스트)

- 대상: https://mypage.plandosee-diary.workers.dev
- 실행 시각: 2026-10-20T12:23:51.178Z
- 계정: `alice-97fip`, `bob-97fip` (테스트용으로 만든 계정)
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


**[alice-97fip]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "username": "alice-97fip",
  "passkeyName": "alice 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "yy68sJ0HyouPL28DTnOd80kxypO160Nbl6NbvCmVpr8",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ",
    "name": "alice-97fip",
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


**[alice-97fip]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "rawId": "-EFp4K7kaHQmqNbiHdSzyQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoieXk2OHNKMEh5b3VQTDI4RFRuT2Q4MGt4eXBPMTYwTmJsNk5idkNtVnByOCIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViU_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UalFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEPhBaeCu5Gh0JqjW4h3Us8mlAQIDJiABIVggo1Gozg6qc6zRFmkuUe9xtIjPUPi5GLIKBc0uIr510kMiWCD5jkD1eipRa-CrWSOcAahkfe8KLl_fePJxHR7Hy1c4EA",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=aq87…(가림)…YM; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "name": "alice 노트북 (테스트 인증기)",
    "createdAt": 1792499033073,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIKNRqM4OqnOs0RZpLlHvcbSIz1D4uRiyCgXNLiK-ddJDIlgg-Y5A9XoqUWvgq1kjnAGoZH3vCi5f33jycR0ex8tXOBA",
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

**[bob-97fip]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "username": "bob-97fip",
  "passkeyName": "bob 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "Fc9ltdzoRGChsVz4Xt9kIN7uMnGMkrFywLL7FonZT5A",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "OsTlKnn6HHosBXBP9NTgmC4TNNL46Jp9hzQb-AypO18",
    "name": "bob-97fip",
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


**[bob-97fip]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "yxVMxQaXfAWkYi60wu-WUg",
    "rawId": "yxVMxQaXfAWkYi60wu-WUg",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiRmM5bHRkem9SR0Noc1Z6NFh0OWtJTjd1TW5HTWtyRnl3TEw3Rm9uWlQ1QSIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViU_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UalFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEMsVTMUGl3wFpGIutMLvllKlAQIDJiABIVggQJG9RCPTKMIoSAIdvagPFFwy0luK8gsCbW7eKmhSTm8iWCCg15UkF5Y4ByyoYh4w5IgkXUQDkrm_Ylr43cBgVd04DA",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=Y0dw…(가림)…I8; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "yxVMxQaXfAWkYi60wu-WUg",
    "name": "bob 노트북 (테스트 인증기)",
    "createdAt": 1792499033765,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIECRvUQj0yjCKEgCHb2oDxRcMtJbivILAm1u3ipoUk5vIlggoNeVJBeWOAcsqGIeMOSIJF1EA5K5v2Ja-N3AYFXdOAw",
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
- ✅ 등록 질문이 요청마다 다름: yy68sJ0HyouPL28DTnOd80kxypO160Nbl6NbvCmVpr8 ≠ Fc9ltdzoRGChsVz4Xt9kIN7uMnGMkrFywLL7FonZT5A

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
  "username": "cancel-97fip",
  "passkeyName": "취소할 패스키"
}
```

응답 본문
```json
{
  "challenge": "HyDq4D1O_e_gAFNRLquYNGPAU5mosfd3aNy0ZqoS6-w",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "-xZIphXWDk_cQ7uVpFmUmXRdDBSxKC0zsFGgluFjMgk",
    "name": "cancel-97fip",
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
  "challenge": "HyDq4D1O_e_gAFNRLquYNGPAU5mosfd3aNy0ZqoS6-w"
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
  "username": "cancel-97fip",
  "passkeyName": "확인용"
}
```

응답 본문
```json
{
  "challenge": "xUZ3cRyFaXIuo5wd36HgQaJ5MhZfz29Q7QlJI77mNkE",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "l4Kde8zwE5Dw_rhfE_N4N9_1g0v5qm8WdXjwhqQ4PjM",
    "name": "cancel-97fip",
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


**[alice-97fip]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=aq87…(가림)…YM
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


**[alice-97fip]** `POST /api/login/options` → **200**

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
  "challenge": "G0dmjA0HUX-v48SvMgXWgnTFQyilfXoIWDZd62qxEIw",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-97fip]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "rawId": "-EFp4K7kaHQmqNbiHdSzyQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiRzBkbWpBMEhVWC12NDhTdk1nWFdnblRGUXlpbGZYb0lXRFpkNjJxeEVJdyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAQ",
      "signature": "MEQCIDIFosYFDVS0AB86dj5zV55WFtG-v_AR4zW2BQVLPm4rAiB8x0WKVsxBF2NUoGSAAzAd8QfWs4_zzyvOOZ4DekuNRw",
      "userHandle": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=63KW…(가림)…OA; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-97fip"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```

- ✅ 올바른 서명 → 200, 세션 발급

**[alice-97fip]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=63KW…(가림)…OA
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-97fip",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-97fip] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792499033073
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-97fip] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792499033074
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-97fip] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792499033075
    }
  ]
}
```

- ✅ 로그인 뒤 GET /api/private → 200 (내 자료)

**[alice-97fip]** `POST /api/login/options` → **200**

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
  "challenge": "XaqzpPFFclv-txQp1EnD0Is2jrLHEcwU5PTlxJUOJTw",
  "timeout": 60000,
  "userVerification": "preferred"
}
```

서명의 마지막 바이트 하나를 바꿔서 보냅니다.


**[alice-97fip]** `POST /api/login/verify` → **401**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "rawId": "-EFp4K7kaHQmqNbiHdSzyQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiWGFxenBQRkZjbHYtdHhRcDFFbkQwSXMyanJMSEVjd1U1UFRseEpVT0pUdyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAg",
      "signature": "MEUCIQD_4QshkxuTDH3s7ZUtjmX_qWeMh1hZBub_l3aNXbhJ0AIgAdJh5GVSoyG_Tv1hf9-LPGGQaw5SG93CDvUf_cS6wsA",
      "userHandle": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ"
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
- ✅ 로그인 질문이 요청마다 다름: G0dmjA0HUX-v48SvMgXWgnTFQyilfXoIWDZd62qxEIw ≠ XaqzpPFFclv-txQp1EnD0Is2jrLHEcwU5PTlxJUOJTw
성공했던 로그인 요청 본문을 한 글자도 바꾸지 않고 다시 보냅니다.


**[alice-97fip]** `POST /api/login/verify` → **400**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "rawId": "-EFp4K7kaHQmqNbiHdSzyQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiRzBkbWpBMEhVWC12NDhTdk1nWFdnblRGUXlpbGZYb0lXRFpkNjJxeEVJdyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAQ",
      "signature": "MEQCIDIFosYFDVS0AB86dj5zV55WFtG-v_AR4zW2BQVLPm4rAiB8x0WKVsxBF2NUoGSAAzAd8QfWs4_zzyvOOZ4DekuNRw",
      "userHandle": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ"
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

**[alice-97fip]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=63KW…(가림)…OA
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


**[alice-97fip]** `GET /api/private` → **401**

```http
GET /api/private
Cookie: __Host-sid=63KW…(가림)…OA
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

**[alice-97fip]** `POST /api/login/options` → **200**

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
  "challenge": "Udb459QGZ8j35W5dCBgppk4twXttPsJMu1gTmxKyPDg",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-97fip]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "rawId": "-EFp4K7kaHQmqNbiHdSzyQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiVWRiNDU5UUdaOGozNVc1ZENCZ3BwazR0d1h0dFBzSk11MWdUbXhLeVBEZyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAw",
      "signature": "MEYCIQCZjZIFfU8vfo5qgNtmJaicvAPQTuMyGCd6qJ-MKGVNhgIhAOX3hfPiYxUQlOfgKpawBcLC8zbB_3r8dVJJAVNbuSCB",
      "userHandle": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=prEd…(가림)…6Q; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-97fip"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```


## 6. 다른 계정의 비공개 자료 읽기

관련 통과 기준: T08-C36, C37, C38, C39, C40


**[bob-97fip]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=Y0dw…(가림)…I8
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "bob-97fip",
  "count": 3,
  "items": [
    {
      "id": 4,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-97fip] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792499033765
    },
    {
      "id": 5,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-97fip] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792499033766
    },
    {
      "id": 6,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-97fip] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792499033767
    }
  ]
}
```


**[alice-97fip]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-97fip",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-97fip] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792499033073
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-97fip] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792499033074
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-97fip] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792499033075
    }
  ]
}
```

거절 전 자료 건수: alice-97fip 3건, bob-97fip 3건


**[alice-97fip]** `GET /api/users/bob-97fip/private` → **403**

```http
GET /api/users/bob-97fip/private
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ alice-97fip → bob-97fip 자료 요청 → 403

**[bob-97fip]** `GET /api/users/alice-97fip/private` → **403**

```http
GET /api/users/alice-97fip/private
Cookie: __Host-sid=Y0dw…(가림)…I8
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ bob-97fip → alice-97fip 자료 요청 → 403

**[alice-97fip]** `DELETE /api/private/4` → **404**

```http
DELETE /api/private/4
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 항목 중에 그런 것이 없습니다."
}
```

- ✅ alice-97fip가 bob-97fip의 항목(id 4) 삭제 요청 → 404

**[alice-97fip]** `GET /api/private?user=bob-97fip` → **200**

```http
GET /api/private?user=bob-97fip
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-97fip",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-97fip] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792499033073
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-97fip] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792499033074
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-97fip] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792499033075
    }
  ]
}
```

- ✅ 주소에 ?user=다른계정 → 그래도 내 자료만 돌아옴

**[alice-97fip]** `POST /api/private` → **201**

```http
POST /api/private
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "owner": "bob-97fip",
  "user": "bob-97fip",
  "category": "메모",
  "title": "본문에 다른 계정을 적어 보낸 항목",
  "body": "주인은 세션으로만 정해집니다."
}
```

응답 본문
```json
{
  "owner": "alice-97fip",
  "count": 4,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-97fip] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792499033073
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-97fip] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792499033074
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-97fip] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792499033075
    },
    {
      "id": 7,
      "category": "메모",
      "title": "본문에 다른 계정을 적어 보낸 항목",
      "body": "주인은 세션으로만 정해집니다.",
      "created_at": 1792499038698
    }
  ]
}
```

- ✅ 요청 본문에 owner/user=다른계정 → 내 자료에 저장되고 내 자료만 돌아옴

**[bob-97fip]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=Y0dw…(가림)…I8
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "bob-97fip",
  "count": 3,
  "items": [
    {
      "id": 4,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-97fip] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792499033765
    },
    {
      "id": 5,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-97fip] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792499033766
    },
    {
      "id": 6,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-97fip] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792499033767
    }
  ]
}
```

- ✅ 거절 뒤 bob-97fip 자료 건수 그대로: 3 → 3
- ✅ bob-97fip의 응답에 alice-97fip 자료가 섞이지 않음

## 7. 패스키 두 개 등록 · 하나 지운 뒤 로그인

관련 통과 기준: T08-C42, C43, C44, C45, C46


**[alice-97fip]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Cookie: __Host-sid=prEd…(가림)…6Q
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
  "challenge": "S771EuPq0heTzk0xA34uYLOez9JJgEaTsPnlN9-YPjo",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "mypage.plandosee-diary.workers.dev"
  },
  "user": {
    "id": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ",
    "name": "alice-97fip",
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
      "id": "-EFp4K7kaHQmqNbiHdSzyQ",
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


**[alice-97fip]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "jEtYOioYHRGzDFzd79P0ZQ",
    "rawId": "jEtYOioYHRGzDFzd79P0ZQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiUzc3MUV1UHEwaGVUemsweEEzNHVZTE9lejlKSmdFYVRzUG5sTjktWVBqbyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViU_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UalFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEIxLWDoqGB0Rswxc3e_T9GWlAQIDJiABIVggwRsQaxxcZ_teVJe9YWJIWgaxSrEuMuP8LYir6lYc9hUiWCChEWxiJWwqqyXdKQwR1ONlPwac6BbD0vVjfP3sL6LwbA",
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
    "id": "jEtYOioYHRGzDFzd79P0ZQ",
    "name": "alice 휴대폰 (테스트 인증기)",
    "createdAt": 1792499039615,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIMEbEGscXGf7XlSXvWFiSFoGsUqxLjLj_C2Iq-pWHPYVIlggoRFsYiVsKqsl3SkMEdTjZT8GnOgWw9L1Y3z97C-i8Gw",
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

**[alice-97fip]** `GET /api/credentials` → **200**

```http
GET /api/credentials
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-97fip",
  "count": 2,
  "credentials": [
    {
      "id": "-EFp4K7kaHQmqNbiHdSzyQ",
      "name": "alice 노트북 (테스트 인증기)",
      "createdAt": 1792499033073,
      "lastUsedAt": 1792499037543,
      "publicKey": "pQECAyYgASFYIKNRqM4OqnOs…",
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
      "id": "jEtYOioYHRGzDFzd79P0ZQ",
      "name": "alice 휴대폰 (테스트 인증기)",
      "createdAt": 1792499039615,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIMEbEGscXGf7…",
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

**[alice-97fip]** `DELETE /api/credentials/-EFp4K7kaHQmqNbiHdSzyQ` → **200**

```http
DELETE /api/credentials/-EFp4K7kaHQmqNbiHdSzyQ
Cookie: __Host-sid=prEd…(가림)…6Q
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "owner": "alice-97fip",
  "count": 1,
  "credentials": [
    {
      "id": "jEtYOioYHRGzDFzd79P0ZQ",
      "name": "alice 휴대폰 (테스트 인증기)",
      "createdAt": 1792499039615,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIMEbEGscXGf7…",
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

**[alice-97fip]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=prEd…(가림)…6Q
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


**[alice-97fip]** `POST /api/login/options` → **200**

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
  "challenge": "j2ENJuoGJZb5LSuvrJWVfND-Pf88Rm7pErBLsleJtDc",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-97fip]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: https://mypage.plandosee-diary.workers.dev
```

요청 본문
```json
{
  "response": {
    "id": "jEtYOioYHRGzDFzd79P0ZQ",
    "rawId": "jEtYOioYHRGzDFzd79P0ZQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiajJFTkp1b0dKWmI1TFN1dnJKV1ZmTkQtUGY4OFJtN3BFckJMc2xlSnREYyIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAAAQ",
      "signature": "MEUCIGgsnAqzfvldqHBOmfZE5kOUgVziSni2oYOhu6YARrR3AiEAmaJ0IvgwHnyRI3twMMQ6KqdboIxQo_FSDwbUk_V9G7k",
      "userHandle": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=c7NV…(가림)…6s; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-97fip"
  },
  "passkey": "alice 휴대폰 (테스트 인증기)"
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
  "challenge": "JneAuLJUoRtprh3OwQFkGuZfbDOi6uOUbXzt6eJouN4",
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
    "id": "-EFp4K7kaHQmqNbiHdSzyQ",
    "rawId": "-EFp4K7kaHQmqNbiHdSzyQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiSm5lQXVMSlVvUnRwcmgzT3dRRmtHdVpmYkRPaTZ1T1ViWHp0NmVKb3VONCIsIm9yaWdpbiI6Imh0dHBzOi8vbXlwYWdlLnBsYW5kb3NlZS1kaWFyeS53b3JrZXJzLmRldiIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "_EI4k4ifHRiD6Mz5tz6oE6bQQ8S-0Be8NeWl1zZ7UakFAAAABA",
      "signature": "MEUCIEOVjJ-5YyRAMZhabmfArKujlRkGOsRStdSF6Cg23DHLAiEA9RHve4R_w1ULiJVc1oO36-S-SeGz2Tqw-5_kfIMgdK0",
      "userHandle": "17Csr1AiJYJxstc1yzCXu3v7YjgSwhqlCgw2lau5TTQ"
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

**[alice-97fip]** `DELETE /api/credentials/jEtYOioYHRGzDFzd79P0ZQ` → **409**

```http
DELETE /api/credentials/jEtYOioYHRGzDFzd79P0ZQ
Cookie: __Host-sid=c7NV…(가림)…6s
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

**[bob-97fip]** `DELETE /api/credentials/jEtYOioYHRGzDFzd79P0ZQ` → **404**

```http
DELETE /api/credentials/jEtYOioYHRGzDFzd79P0ZQ
Cookie: __Host-sid=Y0dw…(가림)…I8
Origin: https://mypage.plandosee-diary.workers.dev
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 패스키 중에 그런 것이 없습니다."
}
```

- ✅ bob-97fip가 alice-97fip의 패스키 삭제 요청 → 404

## 8. 다른 출처에서 온 요청

관련 통과 기준: CSRF 방어(추가 확인)


**[alice-97fip]** `POST /api/private` → **403**

```http
POST /api/private
Cookie: __Host-sid=c7NV…(가림)…6s
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
