# FC풉살 드래프트 — 작업 가이드

여자 풋살팀 FC풉살(18명)의 하반기 내부매치 팀을 나누는 웹앱.
**선수 무기명 투표 → 코치 전용 드래프트 → 지명 순번을 지운 결과 공개 → 예측·응원 → 매치데이(12/19)**
6단계가 `draft_config.phase` 값 하나로 굴러간다.

상세 설계는 [`PLAN.md`](PLAN.md), 운영 절차는 [`docs/OPERATIONS.md`](docs/OPERATIONS.md),
선수·코치·마스터에게 보낼 카톡 안내문과 링크는 [`docs/NOTICES.md`](docs/NOTICES.md).

## 실행

빌드 도구 없음. 정적 HTML/CSS/JS라 그냥 서버만 띄우면 된다.

```bash
python3 -m http.server 8099
```

`?demo=1` 을 붙이면 **네트워크 없이** 가짜 데이터로 전 화면이 돌아간다. 디자인 작업은 여기서 하면 된다.

```
index.html?demo=1&phase=VOTE      투표 (+ #내캐릭터 커스터마이저)
index.html?demo=1&phase=REVEAL    프듀101식 발표
index.html?demo=1&phase=DRAFT     선수 대기 화면
index.html?demo=1&phase=RESULT    팀 명단
index.html?demo=1&phase=PREDICT   예측 · 승률 · 응원
index.html?demo=1&phase=MATCH     경기 결과 · 순위표 · 적중자
coach.html?demo=1&phase=DRAFT     코치 드래프트 보드 (암호 아무거나)
admin.html?demo=1&phase=VOTE      마스터 콘솔 (암호 아무거나)
```

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 선수 18명용. 슬랙식 채널(#투표 #내캐릭터 #결과발표 #드래프트 #우리팀 #예측 #응원 #경기)로 단계 전환 |
| `coach.html` | 코치 6명용 드래프트 보드 (암호 게이트) |
| `admin.html` | 마스터용 운영 콘솔 (암호 게이트) |
| `assets/config.js` | Supabase URL/공개키, 팀 컬러, 에러 메시지 |
| `assets/app.js` | API 레이어 + 데모 모드 + 공통 유틸 |
| `assets/character.js` | 캐릭터 SVG 생성 — 저장된 룩이 있으면 그걸, 없으면 이름 해시로 |
| `assets/style.css` | 디자인 시스템 전부 |
| `assets/fonts/` | Pretendard 서브셋 (직접 포함) |

## 디자인 현황

- **폰트**: `--font` = `-apple-system → Apple SD Gothic Neo → Pretendard`.
  애플 기기는 시스템 폰트, 그 외는 저장소에 넣어둔 Pretendard.
  ⚠️ 폰트를 CDN(jsDelivr·Google Fonts)에서 불러오지 말 것 — 일부 환경에서 차단돼
  맑은 고딕으로 떨어졌던 전력이 있다. 웹폰트가 필요하면 `assets/fonts/`에 직접 넣는다.
  ⚠️ 폰트뿐 아니라 **브라우저로 나가는 모든 리소스**가 저장소 안에 있어야 한다.
  축포도 같은 이유로 CDN 라이브러리를 걷어내고 `app.js` 안 캔버스 구현으로 바꿨다.
  외부 `<script src>` · `<link href>` 를 새로 추가하지 말 것.
- **컬러**: 오버진 퍼플 계열 셸 + 팀 3색 (A `#36C5F0` / B `#E01E5A` / C `#2EB67D`).
- **형태**: 라운드 크게(카드 22px, 버튼 pill), 눌리는 입체 버튼.
- **캐릭터**: 플랫 지오메트릭 축구 선수. **19가지**를 직접 고른다 —
  자세 · 키 · 머리(길이/스타일/색) · 피부색 · 표정 · 상의(무늬/색) · **등번호** ·
  하의(무늬/색) · 양말(무늬/색) · 신발색 · **액세서리(+소품색)** · **테두리** · **배경색**.
  전부 팔레트 인덱스라 jsonb 한 줄로 저장된다 (조합 약 1.1×10¹⁸).
  ⚠️ `SIZE` 를 바꾸면 **DB 쪽 `v_max` 도 같이** 바꿔야 한다 —
  `submit_look`(선수)·`coach_set_card`(코치) 두 함수에 있고, 서버가 값을 자르는 유일한 기준이다.
  키는 0~4 가 viewBox 안에 들어오고(발은 나란히, 머리 높이만 달라짐) 마지막 칸만
  프레임을 뚫는다. 인접 단계가 10% 넘게 벌어져야 작은 명단에서도 차이가 보인다.
  팔은 몸통 **앞에** 그린다 — 팔짱·박수처럼 가슴 앞으로 접는 자세에서 가려지기 때문.
  자세는 팔다리를 어깨·팔꿈치·엉덩이·무릎 네 관절에서 회전시켜 만든다 (`POSE` 표).
  리프팅·슈팅은 공을, 하트는 하트를 소품으로 함께 그린다. 새 자세를 추가하려면
  각도 4+4개와 소품 좌표만 적으면 된다.
  `charSvg(name, { size, jersey, number, bounce, look, crop })`.
  저장된 룩은 `FDChar.setLooks(map)` 으로 한 번 등록하면 이후 모든 호출에 자동 반영되므로,
  화면마다 룩을 넘겨줄 필요가 없다. 편집 미리보기는 `crop:false` 로 머리 잘림을 끈다.
  룩이 없으면 이름 해시로 만든다 — 같은 이름은 항상 같은 캐릭터.
  `TALL` 맵에 이름을 넣으면 기본 키가 커진다 (다이 = 가장 큰 칸, 머리가 프레임 위로 잘림).
- **대기장**(`loungeHtml`): 읽는 일은 위쪽 **스포트라이트**가 전담한다 (84px 캐릭터 +
  15px 각오, 3.2초마다 교대). 아래 6열 명단은 "누가 왔나"만 본다 — 각오를 18칸에
  나눠 담으면 전부 작아져 아무것도 안 읽힌다. 명단의 누구든 누르면 그 사람이
  스포트라이트에 서고 9초간 자동 교대가 멈춘다. 스포트라이트는 `crop:false` 라
  키 큰 캐릭터의 머리가 위로 넘치므로 `.stage` 위쪽 44px 을 비워둔다.
- **모션**: `.chr-bounce` — 두 박자 둠칫둠칫. 착지에서 눌리고 뜰 때 늘어나는
  스쿼시&스트레치로 리듬을 만든다. `prefers-reduced-motion` 에서는 꺼진다.

## 절대 깨면 안 되는 것

이 프로젝트의 존재 이유에 가까운 제약이라, 디자인 개편 중에도 유지해야 한다.

1. **개인 지명 순번은 어디에도 노출되지 않는다.** 공개 명단은 항상 가나다순.
2. **선수 개인 평점·랭킹을 만들지 않는다.** 집계는 팀 단위만.
3. **투표는 무기명.** `draft_vote_marks`(누가 했나)와 `draft_ballots`(뭘 골랐나)는
   연결 키가 없고, ballot에는 시각을 저장하지 않는다.
4. **드래프트 진행 상황은 코치만 본다.** 선수에게 나가는 건 진행 픽 "수"와 팀 차례뿐.
5. UI 문구에 "1순위 지명", "마지막 픽" 같은 서열 표현을 쓰지 않는다.

## 백엔드 (Supabase)

`draft_` 접두사 테이블. 프로젝트 `qjvuxwldlviknhiydoxw`.

- `draft_pledges` · `draft_looks` · `draft_coach_cards` 는 **이름 공개가 의도**라
  SELECT 정책만 열려 있다. 쓰기는 `submit_pledge` / `submit_look` / `coach_set_card` 를
  통해서만 가능하고, 팔레트 범위 밖의 값·모르는 키·숫자가 아닌 값은 서버에서 전부 버린다.
- **코치도 표를 받는다.** `draft_coach_cards`(coach_id·이름·팀·룩·각오)를 선수 투표 화면의
  팀 선택 아래에 노출한다. 암호가 든 `draft_coaches` 는 정책 없음(anon 차단)을 유지하고,
  카드 테이블에는 암호를 넣지 않는다. `coach_set_card` 는 **암호에서 코치 신원을 끌어내므로**
  남의 카드는 건드릴 수 없다 (코치 이름을 인자로 받지 않는다).
- `draft_picks` · `draft_wishes` · `draft_coaches` · `draft_ballots` 는
  **RLS 정책이 아예 없다** = anon 접근 전면 차단. 이게 요구사항 4·5의 방어선이므로
  편의를 위해 정책을 추가하지 말 것.
- 모든 쓰기는 `SECURITY DEFINER` 함수 경유. 코치 기능은 8자리 암호로 게이트.
  `coach_state / coach_pick / coach_undo / coach_wish`,
  `master_set_phase / master_set_reveal_step / master_lock_order / master_publish /
   master_set_score / master_hide_comment / master_reset`,
  `coach_set_card`,
  `submit_vote / submit_pledge / submit_look / submit_prediction / submit_comment /
   vote_tally / standings`
- 픽 확정은 `draft_config` 행을 잠그는 원자적 트랜잭션 (동시 픽 유실 방지).
- 코치 암호는 저장소에 두지 않는다. DB에만 있고 코치에게 개별 DM으로 전달.

## 지금 열려 있는 작업

**스포츠 감성으로 전면 디자인 개선.** 현재는 슬랙 구조 + 파스텔 라운드라
"스포츠"보다 "귀여운 커뮤니티" 쪽에 가깝다. 손볼 만한 지점:

- 헤더/히어로가 밋밋함 — 매치데이 카운트다운, 팀 컬러 대비를 살린 스코어보드 느낌
- 순위표·승률 바가 일반 표에 가까움 — 스포츠 중계 그래픽 톤으로
- 발표(REVEAL) 연출이 정적 — 순위 공개 시 임팩트 부족
- 팀 컬러가 카드 테두리 정도로만 쓰임 — 팀 아이덴티티를 더 강하게
- 모바일(카톡 인앱 브라우저)이 주 사용 환경이라 여기서 먼저 확인할 것

## 배포

GitHub Pages (`main` 브랜치 root). 푸시하면 1~2분 뒤 반영.

⚠️ **asset 링크에는 반드시 `?v=<해시>` 가 붙어 있어야 한다.** `tools/stamp-assets.sh`
가 CSS·JS 내용의 sha1 앞 8자리를 세 HTML 에 박아준다. Stop 훅이 커밋 직전에
자동으로 돌리므로 평소엔 신경 쓸 필요 없지만, 손으로 배포할 땐 직접 돌릴 것.
안 하면 카톡 인앱 브라우저가 옛 CSS 를 물고 있어 **HTML 만 새 버전인 상태**가 되고,
레이아웃이 통째로 깨져 보인다 (실제로 겪었다).
드래프트 진행 중에는 `main`에 바로 푸시하지 말고 확인 후 올릴 것 —
선수 18명이 실시간으로 보고 있는 화면이다.
