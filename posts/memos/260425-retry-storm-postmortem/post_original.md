---
doc_id: -6
type: "draft"
visibility: "private"
content_type: "memos"
slug: "260425-retry-storm-postmortem"
created_at: "2026-04-25"
source_memos: ["vault/From Terry/Drafts/260425-kaist-retry-storm.md"]
domain: ""
subfields: []
key_concepts: []
tags: []
taxonomy_primary: ""
taxonomy_secondary: []
relations: []
---

`#-6` · 정적 사이트가 5천만 회 두드려진 이유 — retry storm 사후 분석

## TL;DR

- 4일간 단일 IP에서 약 5천만 edge requests, 깨진 이미지 3개에 retry storm 진입
- 평균 초당 150회, 이미지 한 장당 약 1,700만 회 — 사람 트래픽 시그니처 아님
- 트리거 = 두 결함의 곱: (1) figure 경로가 옛 폴더 구조를 가리키는데 파일은 flat naming으로 옮겨져 404, (2) `<img onerror="this.src='{src}'">` 패턴이 헤드리스 환경에서 무한 재발화
- 4월 청구서가 첫 알림 — 실시간 모니터링·spend limit·트래픽 anomaly 알림 모두 없음
- 사후 조치 4층: 코드 단발화 + figure validator + Cloudflare egress 무료 이전 + DDoS/Billing 알림

## Context

| 항목 | 값 |
|---|---|
| 기간 | 4월 9~12일 (4일) |
| 출처 | 단일 IP, 일관된 UA, 동일 referrer |
| 대상 | 정적 서베이 사이트의 깨진 이미지 3개 |
| 총 요청 | ~5천만 edge requests |
| 평균 RPS | ~150 |
| 종료 | 자연 종료 (세션 timeout 추정) |
| 진단 | 호스팅 플랫폼 측 "DDoS 아님" 회신 |

분산 공격 패턴이 아니라 한 자동화 도구가 같은 페이지의 같은 이미지를 두드린 시그니처. LLM agent의 browsing tool 또는 헤드리스 크롤러 추정.

## 원인 분석

### 결함 1: figure 경로 stale

서베이가 standalone 시기에 figure를 `assets/figures/ch{N}/fig_<slug>.png` 챕터별 서브폴더에 배치. 모노레포 통합 직전 flat naming(`ch{N}_<slug>_fig{N}.png`)으로 표준 변경. 파일은 옮겼는데 옛 경로를 가진 standalone 빌드의 HTML이 그대로 deploy되어 모든 figure 요청이 404.

일반화: 정적 자원의 경로 마이그레이션은 빌드 단계 figure-existence 검증이 없으면 stale URL이 production까지 도달한다.

### 결함 2: onerror 자기 루프

```python
# build script
onerror="this.src='{src}'"
```

dark-mode 이미지 fallback 의도. dark/light 둘 다 깨진 상황에서 일반 브라우저는 동일 src 재발화를 자체 가드하지만 헤드리스 Chromium 또는 일부 LLM agent의 browser tool은 가드가 약하거나 없음. 결과: 첫 fail 후 onerror가 같은 깨진 src를 무한 재요청.

일반화: `onerror`로 src를 재할당하는 패턴은 첫 실패 시 `this.onerror=null`로 핸들러를 끄지 않으면 헤드리스 환경에서 자기 루프가 된다.

### 외부 자동화의 retry policy

도구가 페이지를 헤드리스로 열고 이미지 fetch — 모두 404. 종료 조건 없는 retry가 4일간 루프. 의도와 무관한 "막힌 줄 모르는 자동화" 패턴.

일반화: LLM agent의 browsing tool / 헤드리스 크롤러는 종료 조건 없는 retry를 흔히 한다. 자산을 공개하는 쪽이 계량기 앞에서 끊는 책임을 진다.

## 사후 조치 (4층)

### 1층 — 코드

- onerror 단발화: `this.onerror=null;this.src='{src}'` — 첫 fail 후 재발화 차단, 이미지당 최대 2 requests
- validator 강화: 본문 참조 figure가 디스크에 존재하는지 file-existence check + 옛 서브폴더 패턴 등장 시 빌드 fail
- PR validate를 GitHub Actions로 자동화 — 깨진 경로의 main 도달 자체 차단

### 2층 — 호스팅 (egress 무료 플랫폼으로 이전)

- 요청당 과금 → unmetered egress 플랫폼으로 이전. 동일 사고 재발 시 청구서 변동 0.
- Rate Limiting Rule: 같은 IP가 `/assets/`에 10초당 100회 초과 시 차단
- Bot Fight Mode + AI Bot Block: 알려진 LLM 크롤러 UA(GPTBot/ClaudeBot/PerplexityBot 등) 자동 challenge/차단

### 3층 — 인지 채널

- DDoS L7 알림: 트래픽 anomaly 발생 시 메일
- Billing 임계값 알림: $10 단위 임계 도달 시 메일
- 청구서가 아닌 이메일이 첫 알림이 되도록

### 4층 — 정체 추적 (선택)

- 해당 IP에만 OTP 룰 활성화: 재방문 시 이메일 입력 → 코드 진입. 다른 사용자 영향 0.

## 판단 기준표 — "정적 사이트도 안전하지 않다"

| 상황 | 권장 |
|---|---|
| 호스팅이 edge request로 과금 | 봇 트래픽이 그대로 청구된다는 전제로 운영 (spend limit 필수) |
| 호스팅이 unmetered egress | 사고 시 금전 손실 0, 단 트래픽 이상 알림은 별도 셋업 |
| 자산 경로 마이그레이션 | 빌드 단계 file-existence 검증 룰 의무화 — 옛 경로 deploy 차단 |
| 이미지 fallback에 onerror 사용 | 첫 fail 후 `this.onerror=null` 강제, 헤드리스 환경에서 동작 검증 |
| 결제 수단 등록한 클라우드 서비스 | spend limit + billing alert + anomaly 알림 셋 모두 셋업, 청구서를 인지 채널로 쓰지 않을 것 |

## 막판 함정

- onerror src 재할당은 일반 브라우저에서 동작해도 헤드리스에서 무한 루프가 된다. 반드시 동일 환경에서 fail 시나리오 테스트.
- 정적 자원 마이그레이션 후 옛 build artifact가 살아있는지 검증 없이는 deploy 자체가 stale 경로를 publish할 수 있다.
- 클라우드 호스팅의 결제 수단 등록은 한도 자동화가 없으면 무방비 상태와 동일하다. spend limit·daily threshold·anomaly 알림 어느 하나라도 없으면 청구서가 첫 신호다.
- LLM agent의 browsing tool은 retry policy가 종료 조건 없이 도는 경우가 흔하다. 의도와 무관한 "막힌 줄 모르는 자동화"가 비용 폭주의 일상적 경로다.

## ROI

| 투입 | 산출 |
|---|---|
| 코드 1줄 (`this.onerror=null`) + validator 룰 1개 + 호스팅 이전 1회 + 알림 4건 셋업 | 동일 사고 재발 시 금전 손실 0, 1분 내 차단, 청구 주기 30일이 아닌 이메일 즉시 인지 |

방어막의 강도가 아니라 방어막의 존재 자체가 변화. 이전엔 0층이었다.

## 관련

- [[260419-vercel-quiet-bill]] — 같은 사건의 비용 구조 측면
- [[260420-one-day-recovery]] — 묵힌 인프라 부채 한 세션 정비 사례
