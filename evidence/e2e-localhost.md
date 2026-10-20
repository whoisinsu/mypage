# 패스키 확인 기록 (자동 테스트)

- 대상: http://localhost:8787
- 실행 시각: 2026-10-20T15:48:51.421Z
- 계정: `alice-ulki9`, `bob-ulki9` (테스트용으로 만든 계정)
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


**[alice-ulki9]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: http://localhost:8787
```

요청 본문
```json
{
  "username": "alice-ulki9",
  "passkeyName": "alice 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "ory4Vy_3vEFhz0_UzKz_uWhyP7l-naM23iX2dX_bmzw",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY",
    "name": "alice-ulki9",
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


**[alice-ulki9]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "rawId": "XcuVkyUOU6qDrdJG4omEGA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoib3J5NFZ5XzN2RUZoejBfVXpLel91V2h5UDdsLW5hTTIzaVgyZFhfYm16dyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEF3LlZMlDlOqg63SRuKJhBilAQIDJiABIVggJWqEP1djLO9fKWThzWZw0tJ72w3mo-0wLRHFsXaz-NsiWCADrhvl1FnG2kZw5sJEs5qY5OYZJ41w7YW9ymQuyM_Ipg",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=ngN5…(가림)…b0; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "name": "alice 노트북 (테스트 인증기)",
    "createdAt": 1792511331569,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYICVqhD9XYyzvXylk4c1mcNLSe9sN5qPtMC0RxbF2s_jbIlggA64b5dRZxtpGcObCRLOamOTmGSeNcO2FvcpkLsjPyKY",
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

**[bob-ulki9]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Origin: http://localhost:8787
```

요청 본문
```json
{
  "username": "bob-ulki9",
  "passkeyName": "bob 노트북 (테스트 인증기)"
}
```

응답 본문
```json
{
  "challenge": "aWOviYKp3veQ_HxviTOMQhdl3gRCmGO6Sv8kx6G5S7w",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "AFmcZ8TA1ijD3szvfTEyR32FQ8g2BbmA3FCixZ5r1Dw",
    "name": "bob-ulki9",
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


**[bob-ulki9]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "uRwfmiwBVhgvIGGr3GPRRg",
    "rawId": "uRwfmiwBVhgvIGGr3GPRRg",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiYVdPdmlZS3AzdmVRX0h4dmlUT01RaGRsM2dSQ21HTzZTdjhreDZHNVM3dyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAELkcH5osAVYYLyBhq9xj0UalAQIDJiABIVggtDznIYY_xY34as5YG9PbWHcEQUVv7scG7yWTU_G5rDoiWCA4LRcqsEe6zbyCO5T07sHpyA3EwVUhNuLMKbmuJ5esOg",
      "transports": [
        "internal"
      ]
    },
    "clientExtensionResults": {},
    "authenticatorAttachment": "platform"
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=Fph8…(가림)…EI; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "storedCredential": {
    "id": "uRwfmiwBVhgvIGGr3GPRRg",
    "name": "bob 노트북 (테스트 인증기)",
    "createdAt": 1792511331599,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYILQ85yGGP8WN-GrOWBvT21h3BEFFb-7HBu8lk1Pxuaw6IlggOC0XKrBHus28gjuU9O7B6cgNxMFVITbizCm5rieXrDo",
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
- ✅ 등록 질문이 요청마다 다름: ory4Vy_3vEFhz0_UzKz_uWhyP7l-naM23iX2dX_bmzw ≠ aWOviYKp3veQ_HxviTOMQhdl3gRCmGO6Sv8kx6G5S7w

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
  "username": "cancel-ulki9",
  "passkeyName": "취소할 패스키"
}
```

응답 본문
```json
{
  "challenge": "gTc5TNxVV4UNkGj9UL3HxZFr7yvHmLk0loZZTTxu1z0",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "QxDVMV6ki6_jbKmFLpt9uQw7G-h73JN4SNGO0-JdU9U",
    "name": "cancel-ulki9",
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
  "challenge": "gTc5TNxVV4UNkGj9UL3HxZFr7yvHmLk0loZZTTxu1z0"
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
  "username": "cancel-ulki9",
  "passkeyName": "확인용"
}
```

응답 본문
```json
{
  "challenge": "ntfvTCavg6I4_ddA2RYP00YWbPP23Onqr-gCaMfmYqQ",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "qXDnCtLHJjF4MGAyd-wepcvlEhty6_5tuTvhE82QuLU",
    "name": "cancel-ulki9",
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


**[alice-ulki9]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=ngN5…(가림)…b0
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


**[alice-ulki9]** `POST /api/login/options` → **200**

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
  "challenge": "VZWCifLX7GMnfMHbKuH5BXRkK8liYhXvabNDpqWnrpE",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-ulki9]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "rawId": "XcuVkyUOU6qDrdJG4omEGA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiVlpXQ2lmTFg3R01uZk1IYkt1SDVCWFJrSzhsaVloWHZhYk5EcHFXbnJwRSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ",
      "signature": "MEQCIG_ULnH9h493ZDsuNmkZMtZzEGJth_m8jE34Io0y5X--AiAnB7iVhWzcXeOQjiSnSGr6kji3VGYxLsQ5OibUtStDNg",
      "userHandle": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=hSZV…(가림)…C4; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-ulki9"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```

- ✅ 올바른 서명 → 200, 세션 발급

**[alice-ulki9]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=hSZV…(가림)…C4
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-ulki9",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-ulki9] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511331569
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-ulki9] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511331570
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-ulki9] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511331571
    }
  ]
}
```

- ✅ 로그인 뒤 GET /api/private → 200 (내 자료)

**[alice-ulki9]** `POST /api/login/options` → **200**

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
  "challenge": "Dhb37n3cZfw6UMFjoqpHuBCZv5jWHMrcdRTwqmz_zEs",
  "timeout": 60000,
  "userVerification": "preferred"
}
```

서명의 마지막 바이트 하나를 바꿔서 보냅니다.


**[alice-ulki9]** `POST /api/login/verify` → **401**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "rawId": "XcuVkyUOU6qDrdJG4omEGA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiRGhiMzduM2NaZnc2VU1Gam9xcEh1QkNadjVqV0hNcmNkUlR3cW16X3pFcyIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAg",
      "signature": "MEUCIQCt7IfoLtgTe7DkOn4Xa5IVIH9XOGcqK2HB_CwtXqTi3wIgFYZ7Ngmx7nPtbxVRHEmATFw5Qcy3UhEUXarJr2cXd_I",
      "userHandle": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY"
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
- ✅ 로그인 질문이 요청마다 다름: VZWCifLX7GMnfMHbKuH5BXRkK8liYhXvabNDpqWnrpE ≠ Dhb37n3cZfw6UMFjoqpHuBCZv5jWHMrcdRTwqmz_zEs
성공했던 로그인 요청 본문을 한 글자도 바꾸지 않고 다시 보냅니다.


**[alice-ulki9]** `POST /api/login/verify` → **400**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "rawId": "XcuVkyUOU6qDrdJG4omEGA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiVlpXQ2lmTFg3R01uZk1IYkt1SDVCWFJrSzhsaVloWHZhYk5EcHFXbnJwRSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ",
      "signature": "MEQCIG_ULnH9h493ZDsuNmkZMtZzEGJth_m8jE34Io0y5X--AiAnB7iVhWzcXeOQjiSnSGr6kji3VGYxLsQ5OibUtStDNg",
      "userHandle": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY"
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

**[alice-ulki9]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=hSZV…(가림)…C4
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


**[alice-ulki9]** `GET /api/private` → **401**

```http
GET /api/private
Cookie: __Host-sid=hSZV…(가림)…C4
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

**[alice-ulki9]** `POST /api/login/options` → **200**

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
  "challenge": "19Aa9QSVmJ6806a-1I_i_2r6SE-YLYXr6CRZ36ZOhE8",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-ulki9]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "rawId": "XcuVkyUOU6qDrdJG4omEGA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiMTlBYTlRU1ZtSjY4MDZhLTFJX2lfMnI2U0UtWUxZWHI2Q1JaMzZaT2hFOCIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAw",
      "signature": "MEUCIQCcI-OQ_wrrpD7aV2cev7mmBY-tLKzfstY2usnP_eZ55QIgTUBH1vt7J9-G9Om28GX_uURMVNgebynd5RgP-VSjV7Q",
      "userHandle": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=pXQ7…(가림)…QQ; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-ulki9"
  },
  "passkey": "alice 노트북 (테스트 인증기)"
}
```


## 6. 다른 계정의 비공개 자료 읽기

관련 통과 기준: T08-C36, C37, C38, C39, C40


**[bob-ulki9]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=Fph8…(가림)…EI
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "bob-ulki9",
  "count": 3,
  "items": [
    {
      "id": 4,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-ulki9] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511331599
    },
    {
      "id": 5,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-ulki9] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511331600
    },
    {
      "id": 6,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-ulki9] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511331601
    }
  ]
}
```


**[alice-ulki9]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-ulki9",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-ulki9] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511331569
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-ulki9] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511331570
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-ulki9] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511331571
    }
  ]
}
```

거절 전 자료 건수: alice-ulki9 3건, bob-ulki9 3건


**[alice-ulki9]** `GET /api/users/bob-ulki9/private` → **403**

```http
GET /api/users/bob-ulki9/private
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ alice-ulki9 → bob-ulki9 자료 요청 → 403

**[bob-ulki9]** `GET /api/users/alice-ulki9/private` → **403**

```http
GET /api/users/alice-ulki9/private
Cookie: __Host-sid=Fph8…(가림)…EI
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "forbidden",
  "message": "다른 계정의 비공개 자료는 읽을 수 없습니다."
}
```

- ✅ bob-ulki9 → alice-ulki9 자료 요청 → 403

**[alice-ulki9]** `DELETE /api/private/4` → **404**

```http
DELETE /api/private/4
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 항목 중에 그런 것이 없습니다."
}
```

- ✅ alice-ulki9가 bob-ulki9의 항목(id 4) 삭제 요청 → 404

**[alice-ulki9]** `GET /api/private?user=bob-ulki9` → **200**

```http
GET /api/private?user=bob-ulki9
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-ulki9",
  "count": 3,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-ulki9] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511331569
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-ulki9] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511331570
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-ulki9] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511331571
    }
  ]
}
```

- ✅ 주소에 ?user=다른계정 → 그래도 내 자료만 돌아옴

**[alice-ulki9]** `POST /api/private` → **201**

```http
POST /api/private
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

요청 본문
```json
{
  "owner": "bob-ulki9",
  "user": "bob-ulki9",
  "category": "메모",
  "title": "본문에 다른 계정을 적어 보낸 항목",
  "body": "주인은 세션으로만 정해집니다."
}
```

응답 본문
```json
{
  "owner": "alice-ulki9",
  "count": 4,
  "items": [
    {
      "id": 1,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[alice-ulki9] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511331569
    },
    {
      "id": 2,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[alice-ulki9] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511331570
    },
    {
      "id": 3,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[alice-ulki9] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511331571
    },
    {
      "id": 7,
      "category": "메모",
      "title": "본문에 다른 계정을 적어 보낸 항목",
      "body": "주인은 세션으로만 정해집니다.",
      "created_at": 1792511331957
    }
  ]
}
```

- ✅ 요청 본문에 owner/user=다른계정 → 내 자료에 저장되고 내 자료만 돌아옴

**[bob-ulki9]** `GET /api/private` → **200**

```http
GET /api/private
Cookie: __Host-sid=Fph8…(가림)…EI
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "bob-ulki9",
  "count": 3,
  "items": [
    {
      "id": 4,
      "category": "프로젝트 메모",
      "title": "준비 중인 프로젝트 (예시)",
      "body": "[bob-ulki9] 스터디 일정을 알려주는 디스코드 봇. 다음 단계: 알림 시간 설정 기능 만들기.",
      "created_at": 1792511331599
    },
    {
      "id": 5,
      "category": "지원 목록",
      "title": "지원하려는 곳 (예시)",
      "body": "[bob-ulki9] 가상의 회사 A — 보안 엔지니어 인턴(11월 마감) / 가상의 회사 B — 네트워크 운영(상시).",
      "created_at": 1792511331600
    },
    {
      "id": 6,
      "category": "회고",
      "title": "이번 주 회고 (예시)",
      "body": "[bob-ulki9] 패스키 과제를 하면서 공개키와 일회용 질문이 비밀번호 자리를 어떻게 대신하는지 정리했다.",
      "created_at": 1792511331601
    }
  ]
}
```

- ✅ 거절 뒤 bob-ulki9 자료 건수 그대로: 3 → 3
- ✅ bob-ulki9의 응답에 alice-ulki9 자료가 섞이지 않음

## 7. 패스키 두 개 등록 · 하나 지운 뒤 로그인

관련 통과 기준: T08-C42, C43, C44, C45, C46


**[alice-ulki9]** `POST /api/register/options` → **200**

```http
POST /api/register/options
Cookie: __Host-sid=pXQ7…(가림)…QQ
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
  "challenge": "Lgo-NILQGRypK5FUaj3SpSQFC5GQIYsMtnZwtZdeBOI",
  "rp": {
    "name": "류인수 소개 페이지",
    "id": "localhost"
  },
  "user": {
    "id": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY",
    "name": "alice-ulki9",
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
      "id": "XcuVkyUOU6qDrdJG4omEGA",
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


**[alice-ulki9]** `POST /api/register/verify` → **200**

```http
POST /api/register/verify
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "Y25KgntSPuYhcZzgYUSSmA",
    "rawId": "Y25KgntSPuYhcZzgYUSSmA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiTGdvLU5JTFFHUnlwSzVGVWFqM1NwU1FGQzVHUUlZc010blp3dFpkZUJPSSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NFAAAAAAAAAAAAAAAAAAAAAAAAAAAAEGNuSoJ7Uj7mIXGc4GFEkpilAQIDJiABIVggtYjeZO8m6Ucyu92wmOXPQR_elXkL9He1vMC4GmgZcmEiWCBaRAHdV9c5ZLPj8knM18ow4f36XY3svlV_oRk7v32PFQ",
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
    "id": "Y25KgntSPuYhcZzgYUSSmA",
    "name": "alice 휴대폰 (테스트 인증기)",
    "createdAt": 1792511332022,
    "lastUsedAt": null,
    "publicKey": "pQECAyYgASFYILWI3mTvJulHMrvdsJjlz0Ef3pV5C_R3tbzAuBpoGXJhIlggWkQB3VfXOWSz4_JJzNfKMOH9-l2N7L5Vf6EZO799jxU",
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

**[alice-ulki9]** `GET /api/credentials` → **200**

```http
GET /api/credentials
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-ulki9",
  "count": 2,
  "credentials": [
    {
      "id": "XcuVkyUOU6qDrdJG4omEGA",
      "name": "alice 노트북 (테스트 인증기)",
      "createdAt": 1792511331569,
      "lastUsedAt": 1792511331855,
      "publicKey": "pQECAyYgASFYICVqhD9XYyzv…",
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
      "id": "Y25KgntSPuYhcZzgYUSSmA",
      "name": "alice 휴대폰 (테스트 인증기)",
      "createdAt": 1792511332022,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYILWI3mTvJulH…",
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

**[alice-ulki9]** `PATCH /api/credentials/Y25KgntSPuYhcZzgYUSSmA` → **200**

```http
PATCH /api/credentials/Y25KgntSPuYhcZzgYUSSmA
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
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
  "owner": "alice-ulki9",
  "count": 2,
  "credentials": [
    {
      "id": "XcuVkyUOU6qDrdJG4omEGA",
      "name": "alice 노트북 (테스트 인증기)",
      "createdAt": 1792511331569,
      "lastUsedAt": 1792511331855,
      "publicKey": "pQECAyYgASFYICVqhD9XYyzv…",
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
      "id": "Y25KgntSPuYhcZzgYUSSmA",
      "name": "alice 휴대폰 (이름 바꿈)",
      "createdAt": 1792511332022,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYILWI3mTvJulH…",
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

**[bob-ulki9]** `PATCH /api/credentials/Y25KgntSPuYhcZzgYUSSmA` → **404**

```http
PATCH /api/credentials/Y25KgntSPuYhcZzgYUSSmA
Cookie: __Host-sid=Fph8…(가림)…EI
Origin: http://localhost:8787
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

- ✅ bob-ulki9가 alice-ulki9의 패스키 이름 바꾸기 → 404

**[alice-ulki9]** `DELETE /api/credentials/XcuVkyUOU6qDrdJG4omEGA` → **200**

```http
DELETE /api/credentials/XcuVkyUOU6qDrdJG4omEGA
Cookie: __Host-sid=pXQ7…(가림)…QQ
Origin: http://localhost:8787
```

응답 본문
```json
{
  "owner": "alice-ulki9",
  "count": 1,
  "credentials": [
    {
      "id": "Y25KgntSPuYhcZzgYUSSmA",
      "name": "alice 휴대폰 (이름 바꿈)",
      "createdAt": 1792511332022,
      "lastUsedAt": null,
      "publicKey": "pQECAyYgASFYILWI3mTvJulH…",
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

**[alice-ulki9]** `POST /api/logout` → **200**

```http
POST /api/logout
Cookie: __Host-sid=pXQ7…(가림)…QQ
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


**[alice-ulki9]** `POST /api/login/options` → **200**

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
  "challenge": "nGRwbUFLsFYe0Uwkzn53zNxVog1Rz1hrT7-fQoX6o7Q",
  "timeout": 60000,
  "userVerification": "preferred"
}
```


**[alice-ulki9]** `POST /api/login/verify` → **200**

```http
POST /api/login/verify
Origin: http://localhost:8787
```

요청 본문
```json
{
  "response": {
    "id": "Y25KgntSPuYhcZzgYUSSmA",
    "rawId": "Y25KgntSPuYhcZzgYUSSmA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoibkdSd2JVRkxzRlllMFV3a3puNTN6TnhWb2cxUnoxaHJUNy1mUW9YNm83USIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAAAQ",
      "signature": "MEUCIQCucVEWHPxhUWMbAZLQBtbbCrU2zTa77zqizrb0RyLs8AIgdASyypjmMcn5QqSK1Fw2iHEsfZNnw_x0i63_xT94YxI",
      "userHandle": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY"
    },
    "clientExtensionResults": {}
  }
}
```

응답 헤더: `Set-Cookie: __Host-sid=x7QN…(가림)…1A; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=7200`

응답 본문
```json
{
  "verified": true,
  "user": {
    "username": "alice-ulki9"
  },
  "passkey": "alice 휴대폰 (이름 바꿈)"
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
  "challenge": "sY-wBORq-wx7HR4aw052BFPKueDvIoRoZrfeegQCBb4",
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
    "id": "XcuVkyUOU6qDrdJG4omEGA",
    "rawId": "XcuVkyUOU6qDrdJG4omEGA",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoic1ktd0JPUnEtd3g3SFI0YXcwNTJCRlBLdWVEdklvUm9acmZlZWdRQ0JiNCIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODc4NyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
      "authenticatorData": "SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MFAAAABA",
      "signature": "MEYCIQD1-3HKhRZVIpESUV-UVdLxxHKSrBDQHlAmnS70NKpO_wIhAOKl3bsJW2vta8XzxX4a1nJdsqBC0SrKgzylRR647o8g",
      "userHandle": "Nv7LctGRlEcWi86nErjjify85Q6Hb2iElw8Oda1b9XY"
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

**[alice-ulki9]** `DELETE /api/credentials/Y25KgntSPuYhcZzgYUSSmA` → **409**

```http
DELETE /api/credentials/Y25KgntSPuYhcZzgYUSSmA
Cookie: __Host-sid=x7QN…(가림)…1A
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

**[bob-ulki9]** `DELETE /api/credentials/Y25KgntSPuYhcZzgYUSSmA` → **404**

```http
DELETE /api/credentials/Y25KgntSPuYhcZzgYUSSmA
Cookie: __Host-sid=Fph8…(가림)…EI
Origin: http://localhost:8787
```

응답 본문
```json
{
  "error": "not_found",
  "message": "내 패스키 중에 그런 것이 없습니다."
}
```

- ✅ bob-ulki9가 alice-ulki9의 패스키 삭제 요청 → 404

## 8. 다른 출처에서 온 요청

관련 통과 기준: CSRF 방어(추가 확인)


**[alice-ulki9]** `POST /api/private` → **403**

```http
POST /api/private
Cookie: __Host-sid=x7QN…(가림)…1A
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
