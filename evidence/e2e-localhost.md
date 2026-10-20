# 패스키 확인 기록 (자동 테스트)

- 대상: http://localhost:8787
- 실행 시각: 2026-10-20T12:21:46.588Z
- 계정: `alice-eyltf`, `bob-eyltf` (테스트용으로 만든 계정)
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


**[alice-eyltf]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: http://localhost:8787
```

요청 본문
```json
{
  "username": "alice-eyltf",
  "passkeyName": "alice 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "eNDiZTtmXeV05cljcrGPGEMlF2Emrj7pa_zrXuuIlSA",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg",
    "name": "alice-eyltf",
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


**[alice-eyltf]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "rawId": "d4HoI6wBXVSumenkL8nGUQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiZU5EaVpUdG1YZVYwNWNsamNyR1BHRU1sRjJFbXJqN3BhX3pyWHV1SWxTQSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEHeB6COsAV1Urpnp5C_JxlGlAQIDJiABIVggLVSO4SwtlC7tiUSgziEZa_i_cvbp8QKHTNIYZh6OWjoiWCAusJ20I57d2zi6ZLw31l5vVucQLWuuifzYC-EFYLdIqA",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=vFs3…(가림)…Yo; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "name": "alice 노트북 (테스트 인증기)",
    "createdAt": 1792498906747,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIC1UjuEsLZQu7YlEoM4hGWv4v3L26fECh0zSGGYejlo6IlggLrCdtCOe3ds4umS8N9Zeb1bnEC1rron82AvhBWC3SKg",
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

**[bob-eyltf]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: http://localhost:8787
```

요청 본문
```json
{
  "username": "bob-eyltf",
  "passkeyName": "bob 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "2ZrjmgRui1m-whuDqBYNdvEyAUO_9OWxzDmXJTNHWxc",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "Iek4yTp4CQ5vbMNGvUllrVzTLglQmKyap9NLgfGgVi4",
    "name": "bob-eyltf",
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


**[bob-eyltf]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "ZX4cVmw4jRJEEl7OxydKkw",
    "rawId": "ZX4cVmw4jRJEEl7OxydKkw",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiMlpyam1nUnVpMW0td2h1RHFCWU5kdkV5QVVPXzlPV3h6RG1YSlROSFd4YyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEGV-HFZsOI0SRBJezscnSpOlAQIDJiABIVggfVr_dQq6zLVkwRSIovBP2WGcVOEl17HqgfLdI1VW1AEiWCDI6Z_-cGxo8_MDLB5iz6CvhX2xdZaBs6ZOlx9MV6xvDw",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=zpY3…(가림)…v8; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "ZX4cVmw4jRJEEl7OxydKkw",
    "name": "bob 노트북 (테스트 인증기)",
    "createdAt": 1792498906789,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIH1a_3UKusy1ZMEUiKLwT9lhnFThJdex6oHy3SNVVtQBIlggyOmf_nBsaPPzAyweYs-gr4V9sXWWgbOmTpcfTFesbw8",
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
- ✅ 등록 질문이 요청마다 다름: eNDiZTtmXeV05cljcrGPGEMlF2Emrj7pa_zrXuuIlSA ≠ 2ZrjmgRui1m-whuDqBYNdvEyAUO_9OWxzDmXJTNHWxc

## 3. 등록을 중간에 취소

관련 통과 기준: T08-C25


**[로그인 안 함]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: http://localhost:8787
```

요청 본문
```json
{
  "username": "cancel-eyltf",
  "passkeyName": "취소할 패스키"
}
```

응답 본문
```json
{
  "challenge": "qSxPWs_K6J-96KKmdry6W5zO8zAUeQR2u1b44xdiHLw",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "I2PYCEc6e5xoVzCKAwxxbsG6TuaQBtrD-Z0Us7bWXIo",
    "name": "cancel-eyltf",
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
Origin: http://localhost:8787
```

요청 본문
```json
{
  "challenge": "qSxPWs_K6J-96KKmdry6W5zO8zAUeQR2u1b44xdiHLw"
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
Origin: http://localhost:8787
```

요청 본문
```json
{
  "username": "cancel-eyltf",
  "passkeyName": "확인용"
}
```

응답 본문
```json
{
  "challenge": "dRIenhpSw5svyz-ziM4PlsrSAHAaaj73SpvhMDgaoCA",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "nv3U5b502Ipjz2LDiJvXOxY7UkBBR9XPEofxeO0ESMU",
    "name": "cancel-eyltf",
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


**[alice-eyltf]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=vFs3…(가림)…Yo
Origin: http://localhost:8787
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


**[alice-eyltf]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: http://localhost:8787
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "localhost",
  "challenge": "z11jZng5F1knbha41s17aubWuuCoV1LyApU57tzbc-w",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-eyltf]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "rawId": "d4HoI6wBXVSumenkL8nGUQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiejExalpuZzVGMWtuYmhhNDFzMTdhdWJXdXVDb1YxTHlBcFU1N3R6YmMtdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ",
      "signature": "MEUCIDJ7LbbZjnuQv-35XiAGpWf7DCUOzvvimDzpkU_YkJFiAiEAzZck3kA3KL4Gi8btPoKJDn1ODUHilAzd5HoN7D3cwMU",
      "userHandle": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=c7F9…(가림)…aU; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-eyltf"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```

- ✅ 올바른 서명 → 200, 세션 발급

**[alice-eyltf]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=c7F9…(가림)…aU
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-eyltf",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-eyltf] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792498906747
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-eyltf] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792498906748
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-eyltf] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792498906749
    }
  ]
}
```

- ✅ 로그인 뒤 GET /api/private → 200 (내 자료)

**[alice-eyltf]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: http://localhost:8787
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "localhost",
  "challenge": "oQXp89wXvzays3fozBE086MFCnVmuNHfur2xPLRO0xc",
  "timeout": 60000,
  "userVerification": "preferred"
}
```

서명의 마지막 바이트 하나를 바꿔서 보냅니다.


**[alice-eyltf]** `POST /api/login/verify` → **401**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "rawId": "d4HoI6wBXVSumenkL8nGUQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoib1FYcDg5d1h2emF5czNmb3pCRTA4Nk1GQ25WbXVOSGZ1cjJ4UExSTzB4YyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAg",
      "signature": "MEUCIQDj2sCPoNjZML586EsjAb-PMocZDZW41qber3usJZm7mAIgRLMhscDCyfjSN5uB4jozTrA3zRp-0_FLGc_AiKUshG4",
      "userHandle": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg"
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
- ✅ 로그인 질문이 요청마다 다름: z11jZng5F1knbha41s17aubWuuCoV1LyApU57tzbc-w ≠ oQXp89wXvzays3fozBE086MFCnVmuNHfur2xPLRO0xc
성공했던 로그인 요청 본문을 한 글자도 바꾸지 않고 다시 보냅니다.


**[alice-eyltf]** `POST /api/login/verify` → **400**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "rawId": "d4HoI6wBXVSumenkL8nGUQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiejExalpuZzVGMWtuYmhhNDFzMTdhdWJXdXVDb1YxTHlBcFU1N3R6YmMtdyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ",
      "signature": "MEUCIDJ7LbbZjnuQv-35XiAGpWf7DCUOzvvimDzpkU_YkJFiAiEAzZck3kA3KL4Gi8btPoKJDn1ODUHilAzd5HoN7D3cwMU",
      "userHandle": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg"
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

**[alice-eyltf]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=c7F9…(가림)…aU
Origin: http://localhost:8787
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


**[alice-eyltf]** `GET /api/private` → **401**

```http
GET /api/private
Cookie: __Host-sid=c7F9…(가림)…aU
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "unauthenticated",
  "message": "패스키로 로그인해야 볼 수 있습니다."
}
```

- ✅ 로그아웃 뒤 같은 세션 값 → 401

**[alice-eyltf]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: http://localhost:8787
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "localhost",
  "challenge": "mrB_i6vf5GfcGg8xax0u3Yn2KiB7I7ANo3oHvLlCTf8",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-eyltf]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "rawId": "d4HoI6wBXVSumenkL8nGUQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoibXJCX2k2dmY1R2ZjR2c4eGF4MHUzWW4yS2lCN0k3QU5vM29IdkxsQ1RmOCIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAw",
      "signature": "MEUCIQC6lrL2uzvTRV7Te5WCQxyEsQcm9P99J5AL5LGwd9vokgIgSRjYWWJQpDLZoe18a9XCBLhDt19uuRiz-yA5HoJ8mRE",
      "userHandle": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=y0os…(가림)…S4; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-eyltf"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```


## 6. 다른 계정의 비공개 자료 읽기

관련 통과 기준: T08-C36, C37, C38, C39, C40


**[bob-eyltf]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=zpY3…(가림)…v8
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "bob-eyltf",
  "count": 3,
  "items": [
    {
      "id": 4,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-eyltf] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792498906789
    },
    {
      "id": 5,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-eyltf] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792498906790
    },
    {
      "id": 6,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-eyltf] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792498906791
    }
  ]
}
```


**[alice-eyltf]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-eyltf",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-eyltf] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792498906747
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-eyltf] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792498906748
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-eyltf] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792498906749
    }
  ]
}
```

거절 전 자료 건수: alice-eyltf 3건, bob-eyltf 3건


**[alice-eyltf]** `GET /api/users/bob-eyltf/private` → **403**

```http
GET /api/users/bob-eyltf/private
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ alice-eyltf → bob-eyltf 자료 요청 → 403

**[bob-eyltf]** `GET /api/users/alice-eyltf/private` → **403**

```http
GET /api/users/alice-eyltf/private
Cookie: __Host-sid=zpY3…(가림)…v8
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ bob-eyltf → alice-eyltf 자료 요청 → 403

**[alice-eyltf]** `DELETE /api/private/4` → **404**

```http
DELETE /api/private/4
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 항목 중에 그런 것이 없습니다."
}
```

- ✅ alice-eyltf가 bob-eyltf의 항목(id 4) 삭제 요청 → 404

**[alice-eyltf]** `GET /api/private?user=bob-eyltf` → **200**

```http
GET /api/private?user=bob-eyltf
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-eyltf",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-eyltf] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792498906747
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-eyltf] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792498906748
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-eyltf] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792498906749
    }
  ]
}
```

- ✅ 주소에 ?user=다른계정 → 그래도 내 자료만 돌아옴

**[alice-eyltf]** `POST /api/private` → **201**

```http
POST /api/private
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

요청 본문
```json
{
  "owner": "bob-eyltf",
  "user": "bob-eyltf",
  "category": "메모",
  "title": "본문에 다른 계정을 적어 보낸 항목",
  "body": "주인은 세션으로만 정해집니다."
}
```

응답 본문
```json
{
  "owner": "alice-eyltf",
  "count": 4,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-eyltf] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792498906747
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-eyltf] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792498906748
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-eyltf] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792498906749
    },
    {
      "id": 7,
      "category": "메모",
      "title": "본문에 다른 계정을 적어 보낸 항목",
      "body": "주인은 세션으로만 정해집니다.",
      "created_at": 1792498907116
    }
  ]
}
```

- ✅ 요청 본문에 owner/user=다른계정 → 내 자료에 저장되고 내 자료만 돌아옴

**[bob-eyltf]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=zpY3…(가림)…v8
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "bob-eyltf",
  "count": 3,
  "items": [
    {
      "id": 4,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-eyltf] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792498906789
    },
    {
      "id": 5,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-eyltf] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792498906790
    },
    {
      "id": 6,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-eyltf] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792498906791
    }
  ]
}
```

- ✅ 거절 뒤 bob-eyltf 자료 건수 그대로: 3 → 3
- ✅ bob-eyltf의 응답에 alice-eyltf 자료가 섞이지 않음

## 7. 패스키 두 개 등록 · 하나 지운 뒤 로그인

관련 통과 기준: T08-C42, C43, C44, C45, C46


**[alice-eyltf]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
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
  "challenge": "lvtHROtYFoOuZBRdrA_kDg6ypJ3BH1dJatOiIIBWZMU",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg",
    "name": "alice-eyltf",
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
      "id": "d4HoI6wBXVSumenkL8nGUQ",
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


**[alice-eyltf]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "KMbYdhMVyoWXqNaAd2GT1w",
    "rawId": "KMbYdhMVyoWXqNaAd2GT1w",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoibHZ0SFJPdFlGb091WkJSZHJBX2tEZzZ5cEozQkgxZEphdE9pSUlCV1pNVSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAECjG2HYTFcqFl6jWgHdhk9elAQIDJiABIVggWpG8pa-GIa8w78oEKwtulhNYQQmlWjlKlF92XAiis_MiWCBNktCicpEfcdSvOKy_S8j5gLoZyxuFHsAVR9IRq6sIhw",
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
    "id": "KMbYdhMVyoWXqNaAd2GT1w",
    "name": "alice 휴대폰 (테스트 인증기)",
    "createdAt": 1792498907182,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYIFqRvKWvhiGvMO_KBCsLbpYTWEEJpVo5SpRfdlwIorPzIlggTZLQonKRH3HUrzisv0vI-YC6GcsbhR7AFUfSEaurCIc",
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

**[alice-eyltf]** `GET /api/credentials` → **200**

```http
GET /api/credentials
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-eyltf",
  "count": 2,
  "credentials": [
    {
      "id": "d4HoI6wBXVSumenkL8nGUQ",
      "name": "alice 노트북 (테스트 인증기)",
      "createdAt": 1792498906747,
      "lastUsedAt": 1792498907022,
      "publicKey": "pQECAyYgASFYIC1UjuEsLZQu…",
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
      "id": "KMbYdhMVyoWXqNaAd2GT1w",
      "name": "alice 휴대폰 (테스트 인증기)",
      "createdAt": 1792498907182,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIFqRvKWvhiGv…",
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

**[alice-eyltf]** `DELETE /api/credentials/d4HoI6wBXVSumenkL8nGUQ` → **200**

```http
DELETE /api/credentials/d4HoI6wBXVSumenkL8nGUQ
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-eyltf",
  "count": 1,
  "credentials": [
    {
      "id": "KMbYdhMVyoWXqNaAd2GT1w",
      "name": "alice 휴대폰 (테스트 인증기)",
      "createdAt": 1792498907182,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYIFqRvKWvhiGv…",
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

**[alice-eyltf]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=y0os…(가림)…S4
Origin: http://localhost:8787
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


**[alice-eyltf]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: http://localhost:8787
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "localhost",
  "challenge": "sIOO1J-LbHG4puK3vi_tO7leY8Sa269NNqEzI0dDk_M",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-eyltf]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "KMbYdhMVyoWXqNaAd2GT1w",
    "rawId": "KMbYdhMVyoWXqNaAd2GT1w",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoic0lPTzFKLUxiSEc0cHVLM3ZpX3RPN2xlWThTYTI2OU5OcUV6STBkRGtfTSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ",
      "signature": "MEUCIQDDTdHdPoZbU74Kr9dYH_vt77C0mun09kchG-cMzV7NJAIgX3G_fsf7H_14maRfvZuz0vOYyPmaBXftGrGZj7kAZV4",
      "userHandle": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=wM6U…(가림)…vw; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-eyltf"
  },
  "passkey": "alice 휴대폰 (테스트 인증기)"
}
```

- ✅ 남은 패스키로 로그인 → 200

**[로그인 안 함]** `POST /api/login/options` → **200**

```http
POST /api/login/options
Origin: http://localhost:8787
```

요청 본문
```json
{}
```

응답 본문
```json
{
  "rpId": "localhost",
  "challenge": "3BDtwQi3ZnnKdyWuErvXkNui6Rj6m5WfNrRP5cyFkH8",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[로그인 안 함]** `POST /api/login/verify` → **401**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "d4HoI6wBXVSumenkL8nGUQ",
    "rawId": "d4HoI6wBXVSumenkL8nGUQ",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiM0JEdHdRaTNabm5LZHlXdUVydlhrTnVpNlJqNm01V2ZOclJQNWN5RmtIOCIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAABA",
      "signature": "MEUCIBbjfsz7x-iAmSAmn__NCH1eDK_umZ_1f-9hqTYs0ndPAiEA0AQ0Fq6OFzHUUutZkwVOYpRcelhnF6s0WYU-XAmHk4s",
      "userHandle": "SeJikRpAPPmGYkGrrzFtD_5oz1ybtNI8QdqSxlEPadg"
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

**[alice-eyltf]** `DELETE /api/credentials/KMbYdhMVyoWXqNaAd2GT1w` → **409**

```http
DELETE /api/credentials/KMbYdhMVyoWXqNaAd2GT1w
Cookie: __Host-sid=wM6U…(가림)…vw
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "last_passkey",
  "message": "마지막 남은 패스키는 지울 수 없습니다. 다른 패스키를 먼저 등록하세요."
}
```

- ✅ 마지막 남은 패스키 삭제 → 409 (계정이 잠기는 것을 막음)

**[bob-eyltf]** `DELETE /api/credentials/KMbYdhMVyoWXqNaAd2GT1w` → **404**

```http
DELETE /api/credentials/KMbYdhMVyoWXqNaAd2GT1w
Cookie: __Host-sid=zpY3…(가림)…v8
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 패스키 중에 그런 것이 없습니다."
}
```

- ✅ bob-eyltf가 alice-eyltf의 패스키 삭제 요청 → 404

## 8. 다른 출처에서 온 요청

관련 통과 기준: CSRF 방어(추가 확인)


**[alice-eyltf]** `POST /api/private` → **403**

```http
POST /api/private
Cookie: __Host-sid=wM6U…(가림)…vw
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
