# PRD: Paper DB & Graph Memory Refactor

- 문서명: `PRD_paper_db_refactor.md`
- 작성 목적: Claude Code가 현재의 논문 포스팅 구조를 **정적 블로그 중심 구조**에서 **AI scientist를 위한 paper graph memory system**으로 리팩터링하도록 지시하기 위한 제품 요구사항 문서
- 문서 상태: Draft v2
- 우선순위: Highest
- 대상 저장소: 현재 운영 중인 논문 포스팅/블로그 레포지토리 전체
- 핵심 문장: **이 프로젝트의 목적은 논문을 “게시”하는 것이 아니라, 논문·메모·가설·관계를 장기적으로 축적하여 AI가 스스로 연구를 이어갈 수 있는 외부 두뇌(external research memory)를 구축하는 것이다.**

---

## 1. 배경

현재 시스템은 대체로 다음과 같은 흐름에 가깝다.

1. 논문을 읽는다.
2. 요약을 작성한다.
3. MD/MDX 파일로 포스팅한다.
4. GitHub에 푸시하고 Vercel이 배포한다.

이 구조는 **사람이 읽는 블로그**를 운영하기에는 적절하지만, 아래 목적에는 불충분하다.

- AI agent가 다수의 논문을 장기적으로 기억하기
- 논문들 사이의 구조적 관계를 파악하기
- 사용자의 메모와 가설을 논문들과 함께 축적하기
- 필요 시 원문으로 다시 돌아가 근거를 확인하기
- 서로 다른 논문들 사이의 빈틈, 충돌, 연결 가능성, 새로운 연구 주제를 도출하기
- 장기적으로 AI scientist가 새로운 논문 초안을 쓰도록 만들기

즉 현재 구조는 **publishing layer** 에는 적합하지만, **research memory layer** 로는 부족하다.

특히 현재 구조의 한계는 다음과 같다.

- 논문이 파일 단위로만 존재하고, 기계가 재조합하기 좋은 구조화가 약하다.
- 논문 간 관계가 암묵적으로만 존재하고, graph 형태로 보존되지 않는다.
- 사용자의 메모와 통찰이 논문 구조와 분리되어 축적된다.
- 원문 PDF, chunk, claim, entity, note, hypothesis, citation relation 등이 분리된 계층으로 존재하지 않는다.
- 새 논문이 들어올 때마다 전체 지식 그래프를 갱신하는 개념이 없다.

---

## 2. 제품 비전

이 시스템은 단순한 블로그 CMS가 아니라, 아래와 같은 연구 메모리 OS여야 한다.

> 논문이 추가될 때마다 원문, 구조화 메타데이터, chunk, claim, entity, note, hypothesis, graph relation이 함께 축적되고,
> AI는 이를 바탕으로 관련 논문을 다시 읽고, 관계를 재구성하고, 빈틈을 찾아내며, 새로운 연구 아이디어와 논문 초안까지 생성할 수 있어야 한다.

핵심은 **paper graph를 처음부터 1급 시민(first-class citizen)** 으로 취급하는 것이다.

또한 public-facing Papers 영역은 더 이상 단순한 포스트 목록이 아니라, 이 graph/ontology를 바탕으로 **taxonomy-driven research wiki** 처럼 탐색 가능한 구조여야 한다. 사용자는 개별 paper를 읽는 것뿐 아니라, 상위 분야 → 하위 분야 → 관련 paper 묶음을 따라가며 연구 지형을 탐색할 수 있어야 한다.

---

## 3. 목표

### 3.1 반드시 달성해야 하는 목표

1. 현재의 MD/MDX 중심 논문 포스팅 구조를 **DB + graph 중심 구조**로 리팩터링한다.
2. 논문 원문, 요약, 구조화 메타데이터, chunk, entity, claim, note, hypothesis를 별도 계층으로 저장한다.
3. 논문 간 관계를 명시적 graph로 저장한다.
4. 새 논문이 들어올 때마다 graph에 node/edge를 추가하고, 전체 graph의 재조정 가능성을 평가한다.
5. 논문이 기존 카테고리와 멀리 떨어진 새로운 대주제일 경우, `/post` 흐름 중 “새 상위 카테고리 또는 분리 여부”를 질문한다.
6. 기존에 포스팅된 논문들을 초기 데이터셋으로 삼아 graph를 생성한다.
7. 기존의 public post URL/사이트 동작은 최대한 깨지지 않게 유지한다.
8. 사람을 위한 블로그 결과물은 유지하되, **source of truth는 더 이상 md 파일이 아니라 DB/graph** 가 되도록 바꾼다.
9. Papers 영역의 기존 자유 해시태그 기반 분류를 **taxonomy 기반 분류 체계** 로 승격한다.
10. Papers 영역에 taxonomy를 따라 탐색 가능한 **wiki-style navigation / explorer UI** 를 도입한다.
11. taxonomy 변경이 post tagging뿐 아니라, 메뉴 구조와 category landing page에도 반영될 수 있게 한다.
12. AI가 taxonomy 재조정 제안을 만들고, 사용자는 이를 수동 승인/수정할 수 있어야 한다.

### 3.2 장기 목표

1. AI agent가 논문들 간의 유사성뿐 아니라 **인용·확장·대조·한계 보완·같은 데이터셋/방법론 공유** 등의 관계를 활용하도록 한다.
2. 사용자의 메모와 아이디어가 단순 일기형 텍스트가 아니라, graph에 연결 가능한 연구 단위로 축적되도록 한다.
3. 향후 “새로운 논문 쓰기”, “연구 gap 찾기”, “관련 연구 지도 그리기”, “연구 계획 생성” 기능의 기반을 만든다.
4. 장기적으로 Papers 영역이 단순 chronological feed가 아니라, 분야별·방법별·신체부위별 탐색이 가능한 연구 위키처럼 진화할 수 있게 한다.

---

## 4. 하지 않을 것

1. 이번 리팩터링에서 완전 자동 ontology 정답 시스템을 만들 필요는 없다.
2. 모든 논문 관계를 100% 정확하게 자동 생성할 필요는 없다.
3. 처음부터 거대한 multi-tenant SaaS로 만들 필요는 없다.
4. 논문 작성 agent 전체를 이번 단계에서 완성할 필요는 없다.
5. 그래프 시각화 UI를 완벽하게 만들 필요는 없다. 단, 최소한의 graph inspection/debugging 수단은 필요하다.
6. 이번 단계에서 모든 taxonomy 재조정을 완전 자동화할 필요는 없다. 다만, 초기 taxonomy 제안·수동 수정·메뉴 반영이 가능한 수준은 반드시 필요하다.

---

## 5. 핵심 설계 원칙

### 원칙 1. Publishing과 Memory를 분리한다.
- `GitHub + Vercel`은 계속 public publishing layer로 사용할 수 있다.
- 그러나 논문 지식의 source of truth는 DB/graph로 옮긴다.

### 원칙 2. 논문은 파일이 아니라 구조적 객체다.
- 하나의 논문은 단순 md 파일이 아니라,
  - 원문 PDF
  - 메타데이터
  - section tree
  - chunks
  - claims
  - entities
  - notes
  - hypotheses
  - graph edges
  로 구성된 복합 객체여야 한다.

### 원칙 3. Graph는 부가 기능이 아니라 핵심 저장 구조다.
- 논문 간 관계를 단순 검색 결과나 embedding similarity에만 의존하지 않는다.
- graph를 명시적으로 저장하고 갱신한다.

### 원칙 4. Taxonomy는 태그가 아니라 정보 구조다.
- 지금의 hashtag는 display-only 장식이 아니라, ontology/graph에 연결된 taxonomy의 public projection이어야 한다.
- 즉 프론트엔드의 메뉴, category page, breadcrumb, wiki sidebar는 DB/graph의 taxonomy를 반영해야 한다.
- Papers 영역의 탐색 경험은 개별 post 나열이 아니라, taxonomy tree를 따라 들어가는 방식으로 설계한다.

### 원칙 5. 자동 생성 + 사람 검토의 혼합 구조로 간다.
- Claude Code/AI는 node/edge 후보, 카테고리 후보, ontology mapping 후보를 생성한다.
- 사용자는 중요한 분기점에서 승인/수정할 수 있어야 한다.

### 원칙 6. 모든 지식에는 provenance가 있어야 한다.
- 어떤 요약이 어떤 chunk에서 나왔는지
- 어떤 claim이 어떤 문단과 페이지를 근거로 하는지
- 어떤 hypothesis가 어떤 논문 조합에서 나왔는지
- 어떤 edge가 자동 생성인지 수동 확정인지
를 추적 가능해야 한다.

---

## 6. 권장 아키텍처

Claude Code는 현재 레포를 분석한 뒤, 아래 방향으로 리팩터링할 것.

### 6.1 계층 구조

#### A. Object Storage Layer
- 역할: 원문 PDF, figure image, generated assets, parser outputs 저장
- 권장: Cloudflare R2, AWS S3, GitHub
- 요구사항:
  - 논문 원문 PDF 저장
  - parser intermediate JSON 저장 가능
  - cover image / figure crops 저장 가능
  - 파일 경로와 버전 추적 가능

#### B. Relational Memory Layer
- 역할: 구조화 메타데이터, post 상태, sections, chunks, notes, hypotheses, jobs 저장
- 권장: Supabase Postgres
- 요구사항:
  - SQL 기반 정규화 스키마
  - JSONB 허용
  - pgvector 사용 가능
  - row-level security는 향후 고려 가능하되, 현재는 단일 사용자 운영 기준으로 단순화 가능

#### C. Vector Retrieval Layer
- 역할: 관련 논문/chunk/메모/claim 탐색
- 권장: Supabase pgvector
- 요구사항:
  - paper_chunks embedding 저장
  - notes / hypotheses embedding 저장
  - hybrid search 가능한 구조 고려

#### D. Graph Layer
- 역할: paper graph, ontology graph, note graph 저장
- 권장: Neo4j를 1순위로 검토
- 대안: Postgres edge table로 시작 후 별도 graph DB로 분리 가능하나,
  본 프로젝트는 **처음부터 graph를 1급 시민으로 둘 것**이므로, 가능하면 실제 graph DB를 도입할 것
- 요구사항:
  - node/edge/property 저장
  - relation confidence 저장
  - provenance 저장
  - community/topic cluster 저장
  - 재분류/rebalancing 지원

#### E. Publishing Layer
- 역할: public website, human-readable post page
- 권장: Next.js + Vercel 유지
- 요구사항:
  - 기존 public post 경험 유지
  - DB/graph 기반으로 post page를 생성하거나 정적 export 가능
  - 가능하다면 mdx는 최종 출력물 또는 캐시 산출물로 취급
  - Papers landing / taxonomy landing / category page / breadcrumb / wiki sidebar를 DB/graph 기반으로 렌더링 가능해야 함
  - 동일 paper가 taxonomy tree, 검색, related graph 등 여러 진입점에서 재사용 가능해야 함
  - tag는 자유 문자열이 아니라 taxonomy export 또는 taxonomy-derived label로 취급

---

## 7. 기술 방향에 대한 명시적 결정

Claude Code는 다음 방향을 기본안으로 채택하라.

1. **GitHub의 md/mdx는 source of truth가 아니다.**
2. **Supabase가 구조화 연구 메모리의 중심 저장소다.**
3. **Graph DB(권장: Neo4j)를 별도 도입하여 paper graph를 관리한다.**
4. **R2/S3는 원문 및 파일 자산 저장소로 사용한다.**
5. **Vercel은 프론트엔드/출판 레이어로 유지한다.**
6. **기존 포스트들은 초기 migration 대상이며, graph의 seed dataset으로 사용한다.**
7. **Papers 프론트엔드는 taxonomy-driven explorer를 기본 탐색 방식으로 채택한다.**
8. **현재의 자유 hashtag 시스템은 taxonomy-backed label 시스템으로 단계적으로 대체한다.**

---

## 8. Graph 중심 데이터 모델 요구사항

### 8.1 필수 node 타입

아래 node 타입을 최소 요구사항으로 정의한다.

- `Paper`
- `PaperVersion`
- `Section`
- `Chunk`
- `Claim`
- `Entity`
- `Method`
- `Dataset`
- `Task`
- `Metric`
- `Concept`
- `Author`
- `Venue`
- `Note`
- `Hypothesis`
- `TopicCluster`
- `ResearchQuestion`
- `TaxonomyNode`

`Entity`는 범용 추상 타입으로 남겨두되, `Method/Dataset/Task/Metric/Concept`는 명시적 타입으로 분화 가능해야 한다.

### 8.2 필수 edge 타입

아래 edge는 최소한 지원되어야 한다.

#### Paper 간 관계
- `CITES`
- `EXTENDS`
- `COMPARES_WITH`
- `CONTRADICTS`
- `SUPPORTS`
- `USES_DATASET`
- `USES_METHOD`
- `ADDRESSES_TASK`
- `REPORTS_METRIC`
- `SIMILAR_TO`
- `FOLLOWS_UP_ON`
- `IDENTIFIES_LIMITATION_OF`
- `FILLS_GAP_OF`

#### Paper 내부 구조 관계
- `HAS_VERSION`
- `HAS_SECTION`
- `HAS_CHUNK`
- `HAS_CLAIM`
- `MENTIONS_ENTITY`

#### 사용자 메모/가설 관계
- `NOTE_ON`
- `QUESTIONING`
- `INSPIRED_BY`
- `DERIVED_FROM`
- `LINKS_TO`
- `SUGGESTS_EXPERIMENT`
- `RELATES_TO`

#### 분류/군집 관계
- `BELONGS_TO_TOPIC`
- `NEAR_TOPIC`
- `POSSIBLE_NEW_TOPIC`
- `HAS_PARENT_TAXONOMY`
- `HAS_CHILD_TAXONOMY`
- `PRIMARY_TAXONOMY`
- `SECONDARY_TAXONOMY`
- `SUGGESTED_TAXONOMY_CHANGE`

### 8.3 edge 속성 요구사항

모든 edge는 가능한 한 아래 속성을 가진다.

- `confidence`
- `source` (`auto`, `manual`, `imported`, `inferred`)
- `evidence_type` (`citation`, `embedding`, `shared_entity`, `user_note`, `llm_extraction`, etc.)
- `evidence_ref`
- `created_at`
- `updated_at`
- `status` (`proposed`, `accepted`, `rejected`, `needs_review`)

---

## 9. Relational DB 스키마 요구사항

Claude Code는 현재 레포 구조를 확인한 뒤, 최소한 아래 SQL 테이블 또는 동등 개념을 설계/구현하라.

### 핵심 테이블
- `papers`
- `paper_versions`
- `paper_files`
- `paper_sections`
- `paper_chunks`
- `paper_claims`
- `paper_entities`
- `paper_entity_links`
- `paper_relations`
- `notes`
- `note_links`
- `hypotheses`
- `hypothesis_links`
- `research_questions`
- `topic_clusters`
- `topic_memberships`
- `taxonomy_nodes`
- `taxonomy_edges`
- `paper_taxonomy_links`
- `taxonomy_change_suggestions`
- `taxonomy_navigation_snapshots`
- `ingestion_jobs`
- `graph_update_jobs`
- `post_exports`

### 각 레코드에 필요한 공통 속성 예시
- stable id
- created_at / updated_at
- source provenance
- parser version
- extractor version
- embedding version
- review status

### paper_chunks 요구사항
`paper_chunks`는 단순 chunk text만 있으면 안 된다. 최소한 아래를 포함하라.

- `paper_id`
- `section_id`
- `chunk_index`
- `page_start`
- `page_end`
- `char_start`
- `char_end`
- `text`
- `summary_local`
- `embedding`
- `citation_context`
- `parser_version`

### notes 요구사항
`notes`는 긴 자유 텍스트만 저장하지 말고, note type을 지원해야 한다.

예:
- `observation`
- `question`
- `critique`
- `hypothesis`
- `experiment_idea`
- `connection`
- `todo`

---

## 10. Ontology 및 Topic Cluster 요구사항

이 시스템은 처음부터 ontology/graph를 중요한 구조로 간주한다.

### 10.1 Ontology 목적
- 논문이 어떤 분야/방법/문제/평가축에 속하는지 정리
- 같은 개념의 서로 다른 표기법을 정규화
- 그래프 탐색과 추론의 질 향상

### 10.2 최소 ontology 축
아래 축은 최소 지원 대상이다.

- `Domain` (예: robotics, VLA, tactile sensing, microbiome, foundation model)
- `Task`
- `Method`
- `Data Type`
- `Sensor/Modality`
- `Dataset`
- `Evaluation Metric`
- `Application`
- `Problem Type`

### 10.3 초기 public taxonomy 초안

public Papers 영역에서 노출될 초기 taxonomy는 아래를 기본안으로 삼는다. Claude Code는 이를 하드코딩된 최종 정답으로 취급하지 말고, **초기 seed taxonomy + 재조정 가능한 정보 구조** 로 구현하라.

#### 최상위
- `Robotics`
- `AI`
- `Etc.`

#### Robotics 하위 기본안
- `Brain`
- `Arm`
- `Hand`
- `Leg`
- `Etc.`

예:
- manipulator motion planning은 기본적으로 `Robotics > Arm` 쪽에 배치하는 것을 우선안으로 한다.
- tactile grasping은 `Robotics > Hand`를 1차 후보로 두되, 필요 시 `Arm`과의 복수 연결도 허용한다.
- whole-body locomotion은 `Robotics > Leg`를 1차 후보로 둘 수 있다.

#### AI 하위 기본안
- `LLM`
- `Agent`
- `RL`
- `Etc.`

위 구조는 시작점일 뿐이며, 이후 논문 축적에 따라 새로운 하위 분류가 추가될 수 있어야 한다.

### 10.4 Topic Cluster와 Taxonomy의 관계
- topic cluster는 graph 기반의 동적 군집이다.
- taxonomy는 public navigation과 editorial organization을 위한 반구조적 트리다.
- 두 구조는 동일할 수도 있지만, 반드시 같을 필요는 없다.
- 즉 어떤 paper는 cluster 상으로는 A/B의 bridge이지만, public taxonomy 상으로는 `Robotics > Arm`에 놓일 수 있다.

### 10.5 taxonomy membership 원칙
- 각 paper는 하나 이상의 taxonomy node에 속할 수 있어야 한다.
- 단, public UI와 breadcrumb를 위해 `primary_taxonomy_node`는 하나 가져야 한다.
- `secondary_taxonomy_nodes`는 related placement, cross-link, “also in” 영역에 사용 가능해야 한다.
- 현재의 hashtag는 이 taxonomy membership으로부터 파생되거나 보조적으로 export되는 구조여야 한다. 해시태그를 taxonomy와 무관한 자유 입력 문자열로만 두지 말 것.

### 10.6 Topic Cluster
- 논문 그래프를 바탕으로 topic cluster를 형성한다.
- cluster는 고정 taxonomy가 아니라, 점진적으로 재조정 가능한 구조로 둔다.
- 각 paper는 하나 이상의 cluster에 속할 수 있어야 한다.
- 단, `primary_topic_cluster`는 하나 지정할 수 있다.

### 10.7 새로운 큰 주제의 등장
새 논문이 현재 graph와 ontology에 잘 붙지 않을 경우, `/post` 흐름 중 아래와 같은 질문을 하도록 한다.

예시 질문:
- “이 논문은 기존 상위 주제들과 거리가 큽니다. 새 상위 topic cluster로 분리할까요?”
- “기존 `VLA / tactile / robotics` cluster에 약하게만 연결됩니다. 새로운 대주제 카테고리 후보를 생성할까요?”
- “현재 ontology에 없는 개념 축이 보입니다. 새 concept group을 추가할까요?”

이때 Claude Code는 단순 질문만 하지 말고 아래를 함께 제시해야 한다.

- 왜 기존 cluster와 멀다고 판단했는지
- 가장 가까운 기존 cluster 후보 3개
- 새 cluster 이름 후보 3개
- 분리했을 때의 장단점

### 10.8 taxonomy 재조정 제안 및 수동 편집
- taxonomy는 시간이 지나며 수동으로 재조정할 수 있어야 한다.
- Claude Code/AI는 `taxonomy_change_suggestions` 또는 동등한 md/json artifact에 아래 정보를 남길 수 있어야 한다.
  - 최근 추가된 paper들이 기존 분류와 충돌하는 사례
  - split/merge가 필요해 보이는 taxonomy node
  - menu 변화가 필요해 보이는 제안
  - 기존 tag를 taxonomy로 승격해야 하는 제안
- 사용자는 이 제안을 검토한 뒤 수동 승인/수정할 수 있어야 하며, 승인 결과는 메뉴 구조와 category page에 반영되어야 한다.
- 주기적으로 posting들의 tagging을 재검토하면서 Papers 메뉴 구조도 함께 재설계할 수 있는 운영 흐름을 고려하라.

---

## 11. Ingestion 파이프라인 요구사항

새 논문 추가 시 아래 단계가 실행되어야 한다.

### 11.1 입력
입력은 최소 다음을 지원해야 한다.

- arXiv URL
- DOI URL
- PDF 파일 업로드
- 이미 작성된 기존 mdx 포스트 가져오기
- 수동 metadata 입력

### 11.2 처리 단계
1. 원문 확보
2. 파일 저장 (R2/S3)
3. 메타데이터 추출
4. PDF 파싱
5. section tree 추출
6. chunk 분할
7. claim/entity extraction
8. embedding 생성
9. 기존 graph와 연결 후보 탐색
10. topic cluster 소속 추정
11. taxonomy node 소속 추정 (`primary` / `secondary`)
12. novelty / outlier 판단
13. 사용자 메모 연결 또는 새 메모 생성 유도
14. public post 초안 생성
15. Papers wiki navigation 반영용 category/page metadata 생성
16. graph update job 생성
17. 필요 시 graph rebalancing job 생성

### 11.3 Provenance
각 단계 산출물에는 provenance를 저장해야 한다.
예:
- 어떤 parser 버전이 사용되었는가
- 어떤 LLM prompt/template이 사용되었는가
- 어느 원문 페이지에서 어떤 claim이 추출되었는가

---

## 12. Graph 업데이트 및 재조정 로직

이 PRD에서 가장 중요한 요구사항 중 하나다.

### 12.1 기본 원칙
새 논문 추가는 단순 insert가 아니라, **graph 전체를 다시 읽는 사건(event)** 이어야 한다.

즉 새 paper node를 넣는 것만으로 끝나면 안 되고, 아래를 함께 수행해야 한다.

- 기존 paper들과의 relation candidate 생성
- 기존 topic cluster에의 적합도 평가
- ontology 확장 필요성 평가
- graph 전체의 community 변화 가능성 평가

### 12.2 edge 후보 생성 기준
아래 신호를 종합하여 edge 후보를 생성하라.

- explicit citation
- title/abstract similarity
- chunk embedding similarity
- shared method/dataset/task/entity
- contradiction/support extraction from claims
- user notes and hypotheses linkage
- temporal follow-up relation

### 12.3 rebalancing 개념
새 논문이 추가될 때마다 전체 graph를 완전히 다시 학습할 필요는 없으나, 다음 경우에는 rebalancing job을 실행해야 한다.

- 새 paper가 기존 cluster 어디에도 충분히 강하게 속하지 않음
- 새 paper가 여러 cluster 사이 bridge node로 보임
- 특정 cluster 내부 밀도가 급격히 변함
- ontology에 없는 새 개념군이 반복 등장함
- 최근 N개의 논문이 특정 새 주제로 몰림

### 12.4 rebalancing 시 해야 할 일
- topic cluster 재계산 또는 보정
- bridge paper 식별
- outlier paper 식별
- 새 상위 category 후보 제안
- 기존 category split/merge 후보 제안
- review queue 생성
- Papers 메뉴 및 wiki sidebar에 반영될 navigation change 후보 생성

### 12.5 사용자 상호작용
rebalancing 결과는 자동 반영 가능하되, 아래 항목은 기본적으로 review queue로 올려라.

- 새 상위 cluster 생성
- 기존 cluster split/merge
- 주요 ontology 축 변경
- low-confidence but high-impact relation 추가

---

## 13. `/post` 명령어 및 UX 리팩터링 요구사항

현재 논문 포스팅 workflow가 Claude Code 내부의 `/post` 명령 또는 이와 유사한 자동화 흐름을 통해 이뤄진다고 가정한다.

Claude Code는 `/post` 흐름을 다음처럼 바꿔야 한다.

### 13.1 `/post` 목표
- 단순 블로그 포스트 생성기가 아니라
- **새 논문을 연구 메모리 graph에 편입시키는 ingestion command** 가 되어야 한다.

### 13.2 `/post` 최소 단계
1. 논문 입력 확인
2. 기존 paper graph와의 연결 후보 분석
3. topic cluster 배치 결과 제시
4. taxonomy 배치 결과 제시 (`primary/secondary`, breadcrumb 후보 포함)
5. novelty/outlier 여부 판단
6. 필요 시 “새 대주제 분리 여부” 질문
7. taxonomy/tag/menu 재조정 제안이 있을 경우 함께 표시
8. 사용자의 메모/관심사 연결 제안
9. public-facing summary/post 초안 생성
10. graph update / rebalancing 결과 요약

### 13.3 새 주제 감지 시 질문 UX
예시:

> 이 논문은 기존 그래프의 주된 축들과 연결되지만, 동시에 별도의 대주제로 성장할 가능성이 있습니다.
> 가장 가까운 기존 cluster: `VLA`, `multimodal robotics`, `tactile planning`
> 그러나 novelty score와 bridge score가 높아 새 상위 카테고리 분리가 유의미할 수 있습니다.
> 
> 선택지:
> 1. 기존 cluster 하위 주제로 편입
> 2. 새 상위 topic cluster 생성
> 3. 보류하고 review queue에 추가

### 13.4 `/post` 출력물
`/post`는 최소 아래 산출물을 만들어야 한다.

- 논문 레코드 생성/업데이트
- file 저장
- chunk 저장
- graph node/edge 생성
- topic cluster membership 저장
- public post draft 생성
- review 항목 생성
- taxonomy membership 및 category metadata 저장
- navigation change suggestion 생성 (필요 시)

---

## 14. 기존 데이터 마이그레이션 요구사항

현재 올라간 논문 포스트들이 초기 graph의 seed dataset이다.

Claude Code는 기존 레포를 분석해 아래 migration을 설계/구현해야 한다.

### 14.1 기존 포스트로부터 추출할 정보
- title
- summary
- tags
- source_url / arxiv_id / doi
- cover
- post date
- 본문 섹션 구조
- 본문 내 언급된 related papers
- 기존 수동 메모/해설

### 14.2 migration 목표
- 기존 md/mdx 포스트를 papers 레코드로 변환
- 가능하면 원문 PDF를 다시 수집/연결
- 요약 본문을 section/chunk 수준으로 분해
- tags를 ontology/taxonomy 후보로 매핑
- 기존 포스트들끼리의 relation candidate 생성
- 초기 topic cluster 생성
- 초기 taxonomy tree 및 category landing pages 생성

### 14.3 migration 시 주의사항
- 기존 public URL은 유지할 것
- slug 변경 최소화
- frontmatter 호환성 최대한 유지
- mdx를 완전히 버리기보다, public export 또는 cache artifact로 남길 수 있다

---

## 15. Claude Code 구현 지침

Claude Code는 아래 방식으로 진행할 것.

### 15.1 레포 분석 우선
먼저 현재 레포에서 아래를 파악하라.

- 포스트 저장 위치
- frontmatter 구조
- 논문 post 생성 흐름
- `/post` 명령 또는 관련 스크립트 구조
- 현재 metadata schema
- 현재 Vercel/Next.js page generation 방식
- Supabase 사용 여부 및 범위

### 15.2 설계 후 구현
바로 코드부터 쓰지 말고 아래 순서를 따를 것.

1. 현재 구조 분석
2. 목표 아키텍처와의 차이 분석
3. migration strategy 제안
4. DB schema 초안 작성
5. graph schema 초안 작성
6. ingestion pipeline 설계
7. `/post` UX 변경안 설계
8. 구현 단계별 TODO 생성
9. 이후 코드 구현

### 15.3 단계별 PR/커밋 전략
리팩터링은 한 번에 큰 덩어리로 하지 말고 아래 단위로 나눌 것.

1. schema introduction
2. migration utilities
3. ingestion pipeline
4. graph updater
5. `/post` UX update
6. public post rendering refactor
7. admin/debug tools
8. tests and docs

---

## 15A. 프론트엔드 / 정보구조 요구사항

이 프로젝트는 백엔드 refactor만으로 끝나면 안 된다. public Papers 영역은 taxonomy와 graph를 실제 탐색 경험으로 노출하는 **research wiki-style interface** 로 진화해야 한다.

### 15A.1 Papers landing page
Papers landing page는 단순 최신순 리스트가 아니라 아래를 포함해야 한다.

- 상위 taxonomy (`Robotics / AI / Etc.`) 진입점
- 선택된 taxonomy 기준의 paper count
- 최근 추가된 papers
- 많이 연결된 papers / 대표 papers / bridge papers 같은 큐레이션 영역
- 검색창 + taxonomy filter + sort
- “모든 Papers 보기”와 “taxonomy로 탐색하기”를 동시에 지원하는 구조

### 15A.2 wiki-style navigation
Papers 내부에는 최소한 다음과 같은 wiki-style navigation이 있어야 한다.

- 좌측 또는 상단의 taxonomy tree/sidebar
- 현재 위치를 보여주는 breadcrumb  
  예: `Papers > Robotics > Arm`
- 현재 category의 자식 노드 / 형제 노드 / 관련 노드 링크
- category landing page에서 해당 node에 속한 paper list와 related clusters 노출

### 15A.3 taxonomy category page
각 taxonomy node는 public page 또는 동등한 route를 가질 수 있어야 한다.

예:
- `/papers/robotics`
- `/papers/robotics/arm`
- `/papers/ai/llm`

각 page는 최소 아래를 가져야 한다.

- category 소개문 (자동 생성 초안 + 수동 수정 가능)
- 대표 paper list
- 최신 paper list
- related subcategories
- related concepts / methods / datasets
- 필요 시 “이 분류는 재조정 중” 또는 “새 분류 제안 있음” 같은 admin-only 상태 표시

### 15A.4 tag 노출 원칙
- 현재처럼 paper마다 자유 hashtag를 임의로 다는 구조를 기본으로 두지 말 것
- public에서 보이는 tag/label은 taxonomy, concept, method, dataset 등 구조화된 메타데이터에서 파생되어야 한다
- 즉 tag는 decoration이 아니라, 클릭 가능한 탐색 entry point여야 한다

### 15A.5 category assignment UX
각 paper page에는 최소 아래가 보여야 한다.

- primary taxonomy
- secondary taxonomy 또는 “also related to”
- related papers
- 이 paper가 속한 topic cluster / nearby concepts
- admin일 경우 taxonomy 수정 버튼 또는 review 상태 표시

### 15A.6 menu evolution
taxonomy가 바뀌면 public Papers 내부 메뉴도 바뀔 수 있어야 한다.

예:
- 특정 하위 주제가 충분히 커지면 sidebar에 독립 노드로 승격
- 거의 사용되지 않는 category는 접거나 merge 후보로 표시
- 반복적으로 bridge 역할을 하는 주제는 별도 cross-cutting menu 후보로 제안

Claude Code는 menu가 완전히 하드코딩된 상수가 아니라, taxonomy state에서 파생될 수 있는 구조를 우선 검토하라.

### 15A.7 home 화면 연동
home 또는 index 화면에서도 Papers 영역은 아래 둘을 분리해서 보여줄 수 있어야 한다.

- Latest Papers
- Browse Papers by Taxonomy

즉 단순 latest feed와 structure-based navigation을 함께 제공할 것.

## 16. 최소 관리자/디버그 도구 요구사항

초기 버전이라도 아래 기능은 필요하다.

- 특정 논문의 graph neighbors 보기
- relation candidate 승인/거절
- topic cluster 멤버 보기
- outlier papers 보기
- rebalancing 제안 보기
- note/hypothesis가 어떤 paper/chunk와 연결되어 있는지 보기
- taxonomy tree 보기 및 수동 편집
- taxonomy change suggestion 승인/거절
- 특정 taxonomy node에 속한 papers와 cross-links 보기
- Papers sidebar/menu preview 보기

완벽한 그래프 시각화는 나중에 해도 되지만, 최소한 텍스트/테이블 기반 inspection 툴은 필요하다.

---

## 17. 성능 및 운영 요구사항

### 17.1 처리 방식
- 업로드 직후 오래 걸리는 파이프라인은 동기 HTTP 요청 안에 모두 넣지 말 것
- ingestion과 graph update는 job/queue 기반 비동기 처리 가능하도록 설계할 것

### 17.2 재처리 가능성
다음은 재실행 가능해야 한다.
- parser 재실행
- embedding 재생성
- claim/entity 재추출
- graph relation 재생성
- topic rebalancing

### 17.3 버전 관리
아래는 버전 필드를 갖도록 하라.
- parser
- extractor prompt
- summary generator
- embedding model
- graph builder
- ontology mapper

---

## 18. 테스트 요구사항

Claude Code는 최소 아래 테스트를 포함해야 한다.

### 18.1 migration test
- 기존 mdx 포스트가 DB 레코드로 잘 변환되는지
- slug / URL 호환이 유지되는지

### 18.2 ingestion test
- 새 PDF 또는 arXiv URL 입력 시 paper/chunk/graph가 생성되는지

### 18.3 graph test
- citation 기반 relation이 생성되는지
- shared dataset/method 기반 relation candidate가 생성되는지
- outlier paper에 대해 새 topic cluster 질문 조건이 트리거되는지

### 18.4 retrieval test
- 관련 논문 검색 시 paper/chunk/note/hypothesis가 함께 탐색되는지

### 18.5 provenance test
- claim/edge/note가 근거 source를 추적할 수 있는지

---

## 19. 수용 기준 (Acceptance Criteria)

아래를 만족하면 1차 리팩터링 성공으로 본다.

1. 기존 포스트들이 DB와 graph에 migration 된다.
2. 새 논문 추가 시 paper/chunk/entity/claim/note/topic/graph relation이 함께 생성된다.
3. `/post` 명령이 단순 md 생성이 아니라 graph ingestion command로 동작한다.
4. 새 논문이 기존 cluster와 멀 경우, 새 주제 분리 질문이 나온다.
5. 기존 public site는 계속 동작한다.
6. AI가 특정 논문과 관련된
   - 가까운 논문
   - 관련 메모
   - 관련 가설
   - 비슷한 task/method/dataset
   - 잠재적 gap
   를 조회할 수 있는 기반 데이터가 준비된다.
7. Graph rebalancing job 또는 이에 준하는 평가 로직이 존재한다.
8. Papers 영역에서 taxonomy tree / breadcrumb / category landing 기반 탐색이 가능하다.
9. 기존 자유 hashtag 대신 taxonomy-backed label 체계가 동작한다.
10. taxonomy 재조정 제안이 review queue 또는 동등한 방식으로 관리된다.

---

## 20. Claude Code에게 기대하는 최종 산출물

Claude Code는 이 PRD를 바탕으로 최소 아래 결과를 만들어야 한다.

1. 현재 레포 분석 문서
2. 변경 아키텍처 제안서
3. SQL schema / migration files
4. Graph schema 설계 및 초기 구현
5. ingestion pipeline 코드
6. `/post` 리팩터링 코드
7. 기존 mdx migration 스크립트
8. 관리자/디버그용 inspection 도구
9. 테스트 코드
10. 운영 문서 및 README 업데이트

---

## 21. 최종 제품 정의

이 프로젝트의 최종 목표는 아래와 같다.

> 논문 포스팅 시스템을,
> 사람에게 읽히는 정적 글 저장소에서,
> AI가 논문·메모·가설·관계를 장기적으로 축적하고 재조합하며 새로운 연구 통찰을 생성할 수 있는
> **graph-native external research memory** 로 전환한다.

다시 말해:

- 블로그는 결과물이다.
- DB는 기억의 본체다.
- Graph는 연구 추론의 골격이다.
- 논문 추가는 글 하나 늘어나는 사건이 아니라, 연구 우주의 위상이 바뀌는 사건이어야 한다.
- Papers 프론트엔드는 단순 블로그 목록이 아니라, 연구 지형을 따라 들어갈 수 있는 taxonomy-driven wiki여야 한다.

