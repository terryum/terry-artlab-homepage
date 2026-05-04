---
doc_id: -11
type: "draft"
visibility: "private"
content_type: "memos"
slug: "260504-aws-cost-cleanup"
created_at: "2026-05-04"
source_memos: ["aws-cost-cleanup-postmortem-source.md"]
domain: "Infra & Ops"
subfields: ["aws", "cost", "lambda", "rds"]
key_concepts:
  - "AWS cleanup"
  - "EOL trigger"
  - "VPC NAT Gateway cost"
  - "Cost Explorer daily granularity"
  - "cross-account boundary cutover"
  - "snapshot retention"
tags: ["Notes", "Infra", "AWS", "Cost", "Lambda", "RDS", "Postmortem"]
taxonomy_primary: "infra/cost"
taxonomy_secondary: ["infra/serverless", "ops/cleanup"]
relations:
  - target: "260420-one-day-recovery"
    type: "extends"
    note: "하루짜리 부채 정비의 한 달 버전 — 같은 작업을 인프라 전반으로 확장"
  - target: "260420-debt-changes-hands"
    type: "related"
    note: "비개발자 창업자가 직접 정리한 부채의 또 다른 사례"
---

`#-11` · 월 $972 → $54: 한 달간의 AWS 청소 회고

## TL;DR

- 며칠 작업으로 daily run-rate $22 → $2 (월 $972 → $54, 94% 감소)
- 세 번의 청소 이벤트: ECS fleet 일괄 폐기 / Python Lambda 포팅 후 폐기 / RDS bi + dead Node 16 stack 4개 정리
- 폐기 결정 = 인프라 삭제가 아니다. 결정된 지 몇 달 지난 ELB·NAT 가 시간당 과금을 토하고 있었음
- 하루짜리 부채 정비([[260420-one-day-recovery|하루 만에 고친 SkinChat 인프라 부채]])의 한 달 후 결과임

## 절감 타임라인

| 시점     | 월 환산 | 청소 이벤트                              |
| ------ | ---- | ----------------------------------- |
| 3월 25일 | $660 | (baseline)                          |
| 4월 2일  | $105 | Agent ECS fleet 폐기                  |
| 4월 28일 | $96  | Python Lambda 스택 (skingpt-core-api) |
| 5월 3일  | $54  | RDS bi + dead Node 16 stack 4개      |

## 1. 내부 실험용 ECS cluster 일괄 폐기

가장 큰 절감은 첫 청소에서 나왔다. 회사 내부 AI agent 데모용으로 살아있던 ELB 8개와 그 뒤의 ECS service 들 — 이미 다른 플랫폼으로 옮겨졌거나 폐기 결정이 난 상태였다. 문제는 폐기 결정이 났다 ≠ AWS 에서 사라졌다였다는 것. 결정된 지 몇 달 지난 ELB·NAT Gateway 가 시간당 과금을 계속 토하고 있었다.

폐기는 위에서부터 끊어야 안전하다.

```
DNS (Route53) → ELB target group → ECS service desired=0
              → Task Definition deregister → ELB delete
              → ECR repo delete → VPC NAT/Endpoint delete
```

DNS 를 먼저 끊어 외부 트래픽을 차단하고, 그 시점에 ECS desired count 를 0 으로 내리면 task 가 graceful 하게 죽는다. ELB 는 in-flight 요청이 끝난 뒤 삭제, 마지막에 VPC 부속 정리. 시간당 과금인 NAT Gateway 가 가장 sneaky — ECS 가 다 죽어도 NAT 만 살아있으면 매일 $3-4 가 그냥 빠진다.

이 청소만 해도 ELB·EC2·NAT·OpenSearch·ECS·ECR 합쳐 월 ~$563. RDS 다른 인스턴스 다운스케일까지 더하면 월 $800+ 가 한 번에 빠졌다.

## 2. Python Lambda 를 TypeScript 로 옮기고 폐기

두 번째는 단순 폐기가 아니라 포팅 후 폐기. 직접 절감은 ~$11/월 로 작지만 엔지니어링 작업량은 가장 컸다.

- Lambda RequestResponse invoke 가 응답 전체를 버퍼링 → 첫 토큰 latency 5–10초, 채팅 UX 망가짐

스트리밍을 위해 어차피 호출 경로를 바꿔야 했다. 이왕 바꿀 거면 Python 자체를 들어내자.

### 작업 요약

- Python 코드 → TypeScript 패키지 (`packages/llm-core`) 6주 포팅
- cross-account / cross-Lambda invoke → 한 프로세스 내 함수 호출
- 스트리밍 분리: 별도 Function URL Lambda + NDJSON frame

### Cross-account boundary cutover 순서

이런 messy boundary 는 양쪽을 동시에 끊으면 라이브가 즉시 깨진다:

1. 새 endpoint 신설 (Bearer 인증, SSM SecureString)
2. 호출 측을 새 endpoint 로 전환 → 양쪽 dev/prod smoke test 통과 확인
3. 그 다음에야 구 IAM 권한 제거

한 단계라도 어겼으면 프로덕션 자동답변이 죽었을 순서.

### 비용 외 결과

- Python 의존성 trail (mecab, clova, video_match 등) 동시 제거
- 강제 EOL 업그레이드 작업량 = 0

## 3. RDS bi + dead Node 16 stack

### Dead Node 16 CFN stack 4개

같이 정리한 stack 4개 (candy-diary, skingpt-api dev/v1) 도 모두 30일 invocation 0. CFN stack 폐기는 위에서부터 풀어야 ROLLBACK_FAILED 가 안 난다:

```
API Gateway custom domain mapping
  → custom domain + Route53 alias
  → cloudformation delete-stack
```

### Snapshot 보존 — 3중 백업

분석 DB 처럼 ad-hoc 쿼리 흔적이 어딘가 남아있을 가능성이 있는 인스턴스는 final snapshot 외에 manual snapshot 2개를 추가로 둔다 (월 $1–2). 6개월 후 "그 데이터 어디 있더라" 한 번 막아주면 본전.

## 4. 검증 — Cost Explorer daily granularity

- AWS 콘솔 default = monthly. 폐기가 청구에 반영됐는지 24h 안에 보려면 daily 로 끊어야 함
- "삭제했다" 와 "더 이상 청구되지 않는다" 사이 24–48h reporting lag 존재
- service × day 매트릭스로 pivot 하면 어떤 서비스가 며칠에 떨어졌는지 한눈에 들어옴
- 그 lag 안에 가짜 성공으로 마무리하지 않으려면 다음날 한 번 더 본다

## 5. 판단 기준표

| 상황 | 행동 |
|------|------|
| 30일 invocation = 0 인 Lambda/RDS | 폐기 후보. 의심 시점에 답 나와있음 |
| EOL 알림 받음, 사용 여부 불분명 | 업그레이드보다 폐기 우선 검토 |
| Cross-account IAM 끊기 | 신규 경로 cutover 확인 → 구 권한 제거 (동시 X) |
| 폐기 직전 RDS / public endpoint | 삭제 전 SG/PubliclyAccessible 차단 한 번 더 |

## 6. 배운 것

- 폐기 결정 ≠ 인프라 삭제. ELB/NAT 는 결정된 지 몇 달 뒤에도 시간당 과금을 토할 수 있음 — 결정 직후 실제 삭제까지의 동선을 박아둘 것
- EOL 알림은 maintenance 통지가 아니라 청소 트리거. 무시하고 동일 런타임 업그레이드만 하면 dead 인프라가 EOL 알림 없는 영역으로 다시 숨는다
- VPC NAT Gateway 가 가장 sneaky. 시간당 과금이라 task 만 죽이고 NAT 를 두면 매일 $3–4 가 그냥 빠진다
- 분석 DB 폐기는 final snapshot + manual 2개 = 3중 백업. 월 $1–2 비용으로 6개월 후 "그 데이터 어디 있더라" 를 막는다
- "삭제했다" ≠ "청구 안 됨". 24–48h reporting lag 가 있으니 다음날 daily 그래프 한 번 더 보고 마무리

## 관련 포스트

- [[260420-one-day-recovery|하루 만에 고친 SkinChat 인프라 부채]] — 같은 정비를 하루 안에 7건 처리한 압축 버전
- [[260420-debt-changes-hands|개발자가 필요 없어졌다]] — 같은 부채 정비 흐름의 의미를 다룬 에세이
