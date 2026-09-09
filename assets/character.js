// FC풉살 — 플랫 지오메트릭 축구 캐릭터 생성기
// 2014 월드컵 "GOL!" 포스터 톤: 외곽선 없는 납작한 색면, 절제된 점 눈,
// 유니폼(무늬·소매·카라) · 반바지 · 양말 · 축구화까지 색 블록으로 구성.
//
// 캐릭터는 두 가지 방법으로 결정된다.
//   1) 저장된 커스텀 룩이 있으면 그걸 쓴다 (setLooks 로 등록)
//   2) 없으면 이름 해시로 만든다 — 같은 이름은 항상 같은 캐릭터
//
// 룩 객체는 전부 팔레트 인덱스라 jsonb 한 줄로 저장된다.
//   h 키 · hl 머리길이 · hs 머리스타일 · hc 머리색 · sk 피부색 · fa 표정
//   ts 상의스타일 · tc 상의색 · bs 하의스타일 · bc 하의색
//   ss 양말스타일 · sc 양말색 · bo 신발색
(function () {
  // ── 팔레트 ────────────────────────────────────────────
  const SKIN = ['#F7C9A3', '#EFB68B', '#E2A57C', '#D89B6C', '#B4784B', '#8A5433', '#6B4226', '#5E3620'];
  const HAIR = ['#2B2119', '#42301F', '#6B4A2A', '#141414', '#8C6239', '#C68642', '#E8D5A8',
                '#B0446B', '#4A6FA5', '#E98FB8', '#5BC0A8', '#9B7FD4'];
  const KIT = ['#2D7DD2', '#E0333F', '#22A06B', '#F2B705', '#7A4FCF', '#EE7B30',
               '#12A5C6', '#E24A8B', '#1F2B4D', '#ECEDEF', '#8C2F39', '#3DD6B0'];
  const BOTTOM = ['#1F2B4D', '#E9EBEE', '#2B2B2B', '#2D7DD2', '#E0333F', '#22A06B',
                  '#F2B705', '#7A4FCF', '#EE7B30', '#E24A8B', '#8C2F39', '#3DD6B0'];
  const SOCK = ['#E9EBEE', '#1F2B4D', '#2B2B2B', '#2D7DD2', '#E0333F', '#22A06B',
                '#F2B705', '#7A4FCF', '#EE7B30', '#E24A8B', '#8C2F39', '#3DD6B0'];
  const BOOT = ['#E4E6E9', '#1F1F1F', '#F2B705', '#E0333F', '#22A06B', '#EE7B30',
                '#2D7DD2', '#E24A8B', '#7A4FCF', '#12A5C6'];
  const BAND = ['#F2B705', '#E24A8B', '#ECEDEF', '#22A06B'];
  const ACC = ['#E0333F', '#F2B705', '#2D7DD2', '#E24A8B', '#22A06B', '#7A4FCF'];
  // 배경 — 0번은 "없음". 캐릭터가 묻히지 않게 전부 옅은 톤으로만 둔다.
  const BG = ['transparent', '#FDE8EF', '#E4F1FB', '#E6F7EF', '#FDF3DC', '#EFE8FB',
              '#FDEADF', '#E5F6F8', '#F1EDE6', '#E9EDF3', '#FBE9F4', '#EDF5DE'];
  // 테두리 — [색, 굵기]. 0번은 없음 (지금까지의 납작한 색면 그대로)
  const OUTLINE = [null, ['#241F1E', 1.3], ['#FFFFFF', 1.6], ['#241F1E', 2.2], ['#4A154B', 1.5]];

  // 키 — 바닥을 기준으로 한 확대 배율.
  // 0~4 는 viewBox 안에 들어오고 (발은 나란히, 머리 높이만 달라진다),
  // 마지막 칸만 프레임을 뚫고 나가 머리가 잘린다 — 일부러 남겨둔 장난 칸.
  // 인접 단계가 10% 넘게 벌어져야 작은 명단에서도 차이가 보인다.
  const HEIGHT = [0.68, 0.78, 0.88, 0.98, 1.08, 1.32];
  const CROP_AT = 1.15;

  // 머리 길이별 옆머리가 내려오는 지점 (얼굴 아래 = 유니폼 위로 흘러내림)
  const HAIR_LEN = [17, 25, 35, 50, 64];

  // 자세 — 팔다리를 어깨·팔꿈치·엉덩이·무릎에서 돌려 만든다 (양수 = 시계방향).
  // arms: [왼어깨, 왼팔꿈치, 오른어깨, 오른팔꿈치]
  // legs: [왼엉덩이, 왼무릎, 오른엉덩이, 오른무릎]
  // ball / heart: [x, y, r] — 있으면 소품을 그린다
  const POSE = [
    { arms: [0, 0, 0, 0],         legs: [0, 0, 0, 0] },                            // 기본
    { arms: [34, 8, -34, -8],     legs: [4, 0, -35, 62],   ball: [52, 79, 6.5] },  // 리프팅 — 무릎 위에 공
    { arms: [52, 14, -26, -34],   legs: [16, -6, -44, -16], ball: [56, 104, 6] },  // 슈팅 — 뻗은 발 끝에 공
    { arms: [152, -14, -152, 14], legs: [7, 0, -9, 0] },                           // 세리머니 — 두 팔 V
    { arms: [55, 40, -20, -75],   legs: [28, 8, -32, 48] },                        // 달리기 — 팔을 엇갈리게
    { arms: [185, 47, -185, -47], legs: [0, 0, 0, 0], heart: [32, 12, 7.5] },      // 하트 — 머리 위에서 손이 모인다
    { arms: [25, -115, -25, 115], legs: [0, 0, 0, 0] },                            // 박수 — 가슴 앞에서 손이 모인다
    { arms: [150, -18, -18, -8],  legs: [5, 0, -7, 0] },                           // 인사
    { arms: [128, 30, -128, -30], legs: [6, 0, -8, 0],  ball: [32, -4, 7] },       // 헤딩 — 머리 위로 뜬 공
    { arms: [88, 6, -88, -6],     legs: [24, 0, -24, 0] },                         // 수비 — 팔다리를 넓게
    { arms: [172, 0, -172, 0],    legs: [0, 0, 0, 0] },                            // 만세
    { arms: [26, -97, -13, 97],   legs: [0, 0, 0, 0] },                            // 팔짱 — 두 팔뚝이 가슴 앞에서 포개진다
  ];

  const LABEL = {
    h: ['아주 작게', '작게', '보통', '조금 크게', '크게', '머리 밖으로!'],
    hl: ['짧게', '단발', '어깨', '길게', '아주 길게'],
    hs: ['기본', '포니테일', '똥머리', '곱슬', '헤어밴드', '앞머리', '양갈래', '반묶음', '땋기', '뾰족'],
    fa: ['기본', '웃음', '윙크', '신남', '진지', '뿌듯', '메롱', '하트눈', '놀람', '새침'],
    ts: ['무지', '세로줄', '가로줄', '사선', '반반', '물방울', '어깨라인', '가슴밴드'],
    bs: ['무지', '옆줄', '밑단', '두줄', '옆+밑단'],
    ss: ['무지', '윗단', '줄무늬', '두줄', '발목'],
    po: ['기본', '리프팅', '슈팅', '세리머니', '달리기', '하트', '박수', '인사', '헤딩', '수비', '만세', '팔짱'],
    ac: ['없음', '헤어핀', '안경', '선글라스', '리본', '주장완장', '목도리', '모자'],
    ol: ['없음', '진하게', '하얗게', '굵게', '보라'],
    nu: ['없음', ...Array.from({ length: 30 }, (_, i) => String(i + 1))],
  };

  const PALETTE = { hc: HAIR, sk: SKIN, tc: KIT, bc: BOTTOM, sc: SOCK, bo: BOOT, ah: ACC, bg: BG };
  const SIZE = {
    h: 6, hl: 5, hs: 10, hc: 12, sk: 8, fa: 10,
    ts: 8, tc: 12, bs: 5, bc: 12, ss: 5, sc: 12, bo: 10,
    po: 12, ac: 8, ah: 6, bg: 12, ol: 5, nu: 31,
  };
  const KEYS = Object.keys(SIZE);

  // 키가 커서 프레임을 뚫고 나가는 선수 — 커스텀 룩이 없을 때만 적용된다
  const TALL = { '다이': 5 };

  let LOOKS = {};
  let SEQ = 0;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // 이름만으로 만드는 기본 캐릭터. 부호 없는 시프트(>>>)를 써야 한다 —
  // >> 를 쓰면 해시가 2^31 을 넘을 때 인덱스가 음수가 되고 색이 검게 죽는다.
  function fromHash(name) {
    const h = hash(name || '?');
    return {
      h: TALL[name] != null ? TALL[name] : 1 + (h >>> 27) % 4,
      hl: (h >>> 4) % SIZE.hl,
      hs: (h >>> 9) % SIZE.hs,
      hc: (h >>> 3) % SIZE.hc,
      sk: h % SIZE.sk,
      fa: (h >>> 24) % SIZE.fa,
      ts: (h >>> 12) % SIZE.ts,
      tc: (h >>> 6) % SIZE.tc,
      bs: (h >>> 15) % SIZE.bs,
      bc: (h >>> 17) % SIZE.bc,
      ss: (h >>> 20) % SIZE.ss,
      sc: (h >>> 23) % SIZE.sc,
      bo: (h >>> 18) % SIZE.bo,
      po: 0, // 자세는 해시로 흩뜨리지 않는다 — 고르기 전에는 모두 차렷
      ac: 0, // 액세서리도 마찬가지 — 직접 고르는 재미로 남겨둔다
      ah: (h >>> 26) % SIZE.ah,
      bg: 0, // 배경·테두리·등번호는 기본 없음 — 고르는 사람만 티가 나게
      ol: 0,
      nu: 0,
    };
  }

  // 저장된 값이 팔레트 밖으로 나가지 않게 자른다 (DB에 뭐가 들었든 안전하게)
  function normalize(look, base) {
    const out = Object.assign({}, base);
    if (!look || typeof look !== 'object') return out;
    KEYS.forEach((k) => {
      const v = Number(look[k]);
      if (Number.isInteger(v) && v >= 0 && v < SIZE[k]) out[k] = v;
    });
    return out;
  }

  function lookFor(name, override) {
    const base = fromHash(name);
    if (override) return normalize(override, base);
    if (LOOKS[name]) return normalize(LOOKS[name], base);
    return base;
  }

  // 밝은 유니폼 위에는 진한 무늬를, 진한 유니폼 위에는 흰 무늬를 얹는다
  function trimFor(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165 ? '#1F2B4D' : '#E9EBEE';
  }

  // ── 머리 ──────────────────────────────────────────────
  // 길이(옆머리가 내려오는 깊이)와 스타일(얹는 장식)을 따로 조합한다.
  function hairHtml(len, style, color, band) {
    const bottom = HAIR_LEN[len];
    const cap = `<rect x="19.5" y="2.5" width="25" height="12.5" rx="6" fill="${color}"/>`;
    const sideH = Math.max(bottom - 9, 0);
    const side = sideH > 0
      ? `<rect x="19" y="9" width="4.5" height="${sideH}" rx="2" fill="${color}"/>
         <rect x="40.5" y="9" width="4.5" height="${sideH}" rx="2" fill="${color}"/>`
      : '';

    let extra = '';
    switch (style) {
      case 1: // 포니테일 — 뒤로 묶어 옆으로 흘린다
        extra = `<circle cx="47.5" cy="17" r="5" fill="${color}"/>
                 <rect x="45.5" y="17" width="4.5" height="15" rx="2.25" fill="${color}"/>`;
        break;
      case 2: // 똥머리 — viewBox 위로 잘리지 않게 살짝 내려 그린다
        extra = `<circle cx="32" cy="3.5" r="6" fill="${color}"/>`;
        break;
      case 3: // 곱슬 볼륨 — 캡을 키워 덮는다
        return `<rect x="16.5" y="0" width="31" height="21" rx="10.5" fill="${color}"/>${side}`;
      case 4: // 헤어밴드
        extra = `<rect x="19.5" y="10.5" width="25" height="3.8" fill="${band}"/>`;
        break;
      case 5: // 앞머리(뱅) — 이마를 덮는다
        extra = `<rect x="20" y="6" width="24" height="7" rx="3" fill="${color}"/>`;
        break;
      case 6: // 양갈래 — 양쪽에 하나씩 묶어 내린다
        extra = `<circle cx="16" cy="18" r="4.6" fill="${color}"/>
                 <rect x="13.6" y="18" width="4.8" height="15" rx="2.4" fill="${color}"/>
                 <circle cx="48" cy="18" r="4.6" fill="${color}"/>
                 <rect x="45.6" y="18" width="4.8" height="15" rx="2.4" fill="${color}"/>`;
        break;
      case 7: // 반묶음 — 정수리에 작은 번, 나머지는 흘린다
        extra = `<circle cx="32" cy="1.5" r="4.4" fill="${color}"/>
                 <rect x="24" y="0" width="16" height="6" rx="3" fill="${color}"/>`;
        break;
      case 8: // 땋기 — 뒤로 한 갈래, 마디를 넣는다
        extra = `<rect x="45.5" y="14" width="5" height="20" rx="2.5" fill="${color}"/>
                 <circle cx="48" cy="20" r="3.1" fill="${color}"/>
                 <circle cx="48" cy="27" r="2.7" fill="${color}"/>
                 <circle cx="48" cy="33.5" r="2.3" fill="${color}"/>`;
        break;
      case 9: // 뾰족 — 위로 솟은 짧은 머리
        extra = `<path d="M20 6 l4 -6 3.5 5 4.5 -7 4.5 7 3.5 -5 4 6 z" fill="${color}"/>`;
        break;
      default:
        break;
    }
    return `${cap}${side}${extra}`;
  }

  // ── 표정 ──────────────────────────────────────────────
  function faceHtml(kind, skin) {
    const ink = '#241F1E';
    const eyeL = 27.5, eyeR = 36.5, eyeY = 21;
    const dot = (x) => `<circle cx="${x}" cy="${eyeY}" r="1.9" fill="${ink}"/>`;
    const arc = (x) => `<path d="M${x - 2.6} ${eyeY + 1} q2.6 -3.4 5.2 0" stroke="${ink}" stroke-width="1.7"
                          fill="none" stroke-linecap="round"/>`;
    const line = (x) => `<rect x="${x - 2.4}" y="${eyeY - .8}" width="4.8" height="1.7" rx=".85" fill="${ink}"/>`;
    const caret = (x) => `<path d="M${x - 2.6} ${eyeY + 1.4} l2.6 -3 2.6 3" stroke="${ink}" stroke-width="1.7"
                            fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const smile = `<path d="M29.4 26.2 q2.6 2.6 5.2 0" stroke="${ink}" stroke-width="1.5"
                     fill="none" stroke-linecap="round"/>`;
    const openMouth = `<ellipse cx="32" cy="26.4" rx="3" ry="2.6" fill="${ink}"/>`;
    const flat = `<rect x="29.6" y="26" width="4.8" height="1.6" rx=".8" fill="${ink}"/>`;

    switch (kind) {
      case 1: return arc(eyeL) + arc(eyeR) + smile;                 // 웃음
      case 2: return dot(eyeL) + line(eyeR) + smile;                // 윙크
      case 3: return dot(eyeL) + dot(eyeR) + openMouth;             // 신남
      case 4: return line(eyeL) + line(eyeR) + flat;                // 진지
      case 5: return caret(eyeL) + caret(eyeR) + smile;             // 뿌듯
      case 6: // 메롱 — 혀를 내민다
        return arc(eyeL) + arc(eyeR) +
          `<path d="M29.4 25.8 q2.6 2.2 5.2 0" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
           <path d="M30.6 26.6 q1.4 3.4 2.8 0 z" fill="#E8607F"/>`;
      case 7: // 하트눈
        return heartEye(eyeL) + heartEye(eyeR) + smile;
      case 8: // 놀람 — 눈을 크게, 입을 동그랗게
        return `<circle cx="${eyeL}" cy="${eyeY}" r="2.7" fill="#fff"/>
                <circle cx="${eyeL}" cy="${eyeY}" r="1.5" fill="${ink}"/>
                <circle cx="${eyeR}" cy="${eyeY}" r="2.7" fill="#fff"/>
                <circle cx="${eyeR}" cy="${eyeY}" r="1.5" fill="${ink}"/>
                <ellipse cx="32" cy="26.6" rx="2.1" ry="2.5" fill="${ink}"/>`;
      case 9: // 새침 — 눈을 살짝 내리깔고 입은 작게
        return `<path d="M${eyeL - 2.6} ${eyeY - 1} q2.6 3 5.2 0" stroke="${ink}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
                <path d="M${eyeR - 2.6} ${eyeY - 1} q2.6 3 5.2 0" stroke="${ink}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
                <rect x="30.4" y="26.2" width="3.2" height="1.5" rx=".75" fill="${ink}"/>`;
      default: return dot(eyeL) + dot(eyeR);                        // 기본
    }
  }

  // 하트 눈 — 작은 하트 하나
  function heartEye(x) {
    const y = 20.4, r = 1.5;
    return `<path d="M${x} ${y + r * 1.9}
      C${x - r * 2.1} ${y + r * .3} ${x - r * 1.05} ${y - r * 1.25} ${x} ${y + r * .18}
      C${x + r * 1.05} ${y - r * 1.25} ${x + r * 2.1} ${y + r * .3} ${x} ${y + r * 1.9} z" fill="#E8455F"/>`;
  }

  // ── 상의 무늬 (저지 영역으로 클리핑) ──────────────────
  function topPattern(kind, trim, uid) {
    const inner = {
      1: `<rect x="21" y="37" width="4.5" height="32" fill="${trim}"/>
          <rect x="29.8" y="37" width="4.5" height="32" fill="${trim}"/>
          <rect x="38.5" y="37" width="4.5" height="32" fill="${trim}"/>`,
      2: `<rect x="17" y="48" width="30" height="8.5" fill="${trim}"/>`,
      3: `<rect x="27" y="21" width="10" height="64" transform="rotate(-34 32 53)" fill="${trim}"/>`,
      4: `<rect x="32" y="37" width="15" height="32" fill="${trim}"/>`,
      5: [0, 1, 2].map((r) => [0, 1, 2].map((c) =>
            `<circle cx="${22 + c * 10}" cy="${43 + r * 10}" r="2.6" fill="${trim}"/>`).join('')).join(''),
      6: `<rect x="17" y="37" width="30" height="5.5" fill="${trim}"/>
          <rect x="17" y="44.5" width="30" height="2.4" fill="${trim}"/>`,
      7: `<rect x="17" y="52" width="30" height="10" fill="${trim}"/>
          <rect x="17" y="64" width="30" height="2.6" fill="${trim}"/>`,
    }[kind];
    return inner ? `<g clip-path="url(#${uid})">${inner}</g>` : '';
  }

  // ── 하의 무늬 (다리 한쪽씩 — 자세에 따라 다리가 따로 돌기 때문) ──
  function bottomPattern(kind, trim, isL) {
    const side = `<rect x="${isL ? 17 : 43.6}" y="66" width="3.4" height="17" fill="${trim}"/>`;
    const hem = `<rect x="${isL ? 17 : 33}" y="78.5" width="14" height="4.5" fill="${trim}"/>`;
    if (kind === 1) return side;
    if (kind === 2) return hem;
    if (kind === 3) { // 두 줄
      return `<rect x="${isL ? 17 : 42.2}" y="66" width="2.4" height="17" fill="${trim}"/>
              <rect x="${isL ? 20.4 : 45.6}" y="66" width="2.4" height="17" fill="${trim}"/>`;
    }
    if (kind === 4) return side + hem;
    return '';
  }

  // ── 양말 무늬 (마찬가지로 한쪽씩) ─────────────────────
  function sockPattern(kind, trim, isL) {
    const x = isL ? 20 : 35.5;
    if (kind === 1) return `<rect x="${x}" y="94" width="8.5" height="4.5" fill="${trim}"/>`;
    if (kind === 2) {
      return [0, 5, 10].map((d) => `<rect x="${x}" y="${95.5 + d}" width="8.5" height="2.4" fill="${trim}"/>`).join('');
    }
    if (kind === 3) { // 두 줄
      return `<rect x="${x}" y="95.5" width="8.5" height="2.6" fill="${trim}"/>
              <rect x="${x}" y="100" width="8.5" height="2.6" fill="${trim}"/>`;
    }
    if (kind === 4) return `<rect x="${x}" y="104.5" width="8.5" height="4.5" fill="${trim}"/>`; // 발목
    return '';
  }

  // ── 손 사이에 띄우는 하트 ─────────────────────────────
  function heartHtml(h) {
    if (!h) return '';
    const [x, y, r] = h;
    return `<path d="M${x} ${y + r * .95}
      C${x - r * 1.35} ${y + r * .1} ${x - r * .95} ${y - r * .85} ${x} ${y - r * .18}
      C${x + r * .95} ${y - r * .85} ${x + r * 1.35} ${y + r * .1} ${x} ${y + r * .95} Z"
      fill="#E24A8B"/>`;
  }

  // ── 액세서리 ──────────────────────────────────────────
  // 머리·얼굴 위에 얹는 소품. 얼굴(x21~43, y4~31) 기준.
  function accHtml(kind, color, skin) {
    switch (kind) {
      case 1: // 헤어핀 — 옆머리에 사선으로
        return `<rect x="39" y="7" width="8" height="2.8" rx="1.4" transform="rotate(-18 43 8.4)" fill="${color}"/>`;
      case 2: // 안경
        return `<g fill="none" stroke="${color}" stroke-width="1.5">
          <rect x="23.5" y="17.5" width="8.5" height="7.5" rx="2.4"/>
          <rect x="32" y="17.5" width="8.5" height="7.5" rx="2.4"/>
          <path d="M32 21.2 h0" stroke-linecap="round" stroke-width="1.8"/>
          <path d="M21.4 19.4 h2.1M40.5 19.4 h2.1" stroke-linecap="round"/></g>`;
      case 3: // 선글라스
        return `<g fill="${color}">
          <rect x="23" y="17.5" width="9" height="7.5" rx="2.4"/>
          <rect x="32" y="17.5" width="9" height="7.5" rx="2.4"/>
          <rect x="30.6" y="19.4" width="2.8" height="1.6"/>
          <rect x="21.2" y="18.4" width="2.4" height="1.6" rx=".8"/>
          <rect x="40.4" y="18.4" width="2.4" height="1.6" rx=".8"/></g>`;
      case 4: // 리본 — 정수리 옆
        return `<g fill="${color}">
          <path d="M41 4.5 l6 -3.2 v6.4 z"/><path d="M41 4.5 l-6 -3.2 v6.4 z"/>
          <circle cx="41" cy="4.5" r="1.9"/></g>`;
      case 5: // 주장 완장 — 왼팔에
        return `<rect x="10.6" y="41" width="7.3" height="5.2" rx="1.4" fill="${color}"/>`;
      case 6: // 목도리
        return `<g fill="${color}">
          <rect x="24" y="29" width="16" height="5.4" rx="2.4"/>
          <rect x="36.5" y="32" width="4.6" height="11" rx="2.2"/></g>`;
      case 7: // 모자(캡) — 챙까지
        return `<g fill="${color}">
          <path d="M19.6 9.5 a12.4 12.4 0 0 1 24.8 0 z"/>
          <rect x="18.5" y="8.6" width="27" height="3.2" rx="1.6"/>
          <rect x="43" y="8.6" width="8.5" height="3" rx="1.5"/></g>`;
      default: return '';
    }
  }

  // ── 축구공 ────────────────────────────────────────────
  function ballHtml(b) {
    if (!b) return '';
    const [x, y, r] = b;
    return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="#1F2B4D" stroke-width="1.3"/>
      <path d="M${x} ${y - r * .52} l${r * .5} ${r * .38} l-${r * .19} ${r * .6} h-${r * .62} l-${r * .19} -${r * .6} z"
        fill="#1F2B4D"/></g>`;
  }

  /**
   * 캐릭터 SVG 문자열.
   * @param {string} name  선수 이름 (같은 이름 = 항상 같은 캐릭터)
   * @param {object} opts  { size, jersey, number, bounce, look, crop }
   *   look 을 직접 넘기면 저장된 룩·해시를 무시한다 (커스터마이저 미리보기용)
   *   crop:false 면 키가 커도 머리를 자르지 않는다 — 편집 중에는 얼굴이 보여야 한다
   */
  function charSvg(name, opts = {}) {
    const L = lookFor(name, opts.look);
    const size = opts.size || 48;
    const uid = 'fdk' + (++SEQ).toString(36);

    const skin = SKIN[L.sk];
    const hairC = HAIR[L.hc];
    const kit = opts.jersey || KIT[L.tc];
    const trim = trimFor(kit);
    const bottom = BOTTOM[L.bc];
    const bottomTrim = trimFor(bottom);
    const socks = SOCK[L.sc];
    const sockTrim = trimFor(socks);
    const boot = BOOT[L.bo];
    const band = BAND[hash(name || '?') % BAND.length];

    const tall = HEIGHT[L.h];
    const delay = ((hash(name || '?') >>> 25) % 12) / 12; // 다 같이 튀지 않도록 시작을 흩뜨림
    // 바닥(32,120)을 축으로 확대 → 발은 제자리, 머리만 위아래로 움직인다
    const scaled = tall !== 1;
    const open = scaled ? `<g transform="translate(32,120) scale(${tall}) translate(-32,-120)">` : '';
    const close = scaled ? '</g>' : '';
    const crop = (tall > CROP_AT && opts.crop !== false) ? 'chr-crop ' : '';

    const P = POSE[L.po] || POSE[0];

    // 팔 — 어깨에서 한 번, 팔꿈치에서 한 번 더 돈다 (중첩 회전 = 관절).
    // 소매를 나중에 그려 팔뚝 위쪽을 덮는다.
    const arm = (isL) => {
      const px = isL ? 14.25 : 49.75;
      const sa = isL ? P.arms[0] : P.arms[2];
      const ea = isL ? P.arms[1] : P.arms[3];
      return `<g transform="rotate(${sa} ${px} 41)">
        <g transform="rotate(${ea} ${px} 53)">
          <rect x="${isL ? 11.5 : 47}" y="50" width="5.5" height="18" rx="2.75" fill="${skin}"/>
        </g>
        <rect x="${isL ? 11 : 46.5}" y="37" width="6.5" height="15" rx="3" fill="${kit}"/>
      </g>`;
    };

    // 다리 — 엉덩이·무릎 두 관절. 반바지를 나중에 그려 허벅지 위쪽을 덮는다.
    const leg = (isL) => {
      const hx = isL ? 24 : 40;
      const kx = isL ? 24.25 : 39.75;
      const ha = isL ? P.legs[0] : P.legs[2];
      const ka = isL ? P.legs[1] : P.legs[3];
      const x = isL ? 20 : 35.5;
      return `<g transform="rotate(${ha} ${hx} 70)">
        <g transform="rotate(${ka} ${kx} 91)">
          <rect x="${x}" y="81" width="8.5" height="15" fill="${skin}"/>
          <rect x="${x}" y="94" width="8.5" height="15" rx="1.5" fill="${socks}"/>
          ${sockPattern(L.ss, sockTrim, isL)}
          <rect x="${isL ? 17 : 34}" y="108" width="13" height="6.5" rx="3" fill="${boot}"/>
        </g>
        <rect x="${isL ? 17 : 33}" y="66" width="14" height="17" rx="2.5" fill="${bottom}"/>
        ${bottomPattern(L.bs, bottomTrim, isL)}
      </g>`;
    };

    // 등번호 — 룩에서 고른 값(1~30). opts.number 로 바깥에서 덮어쓸 수 있다.
    const number = opts.number != null ? opts.number : (L.nu ? String(L.nu) : '');

    // 테두리는 몸통 전체를 감싼 <g> 의 stroke 로 준다 — SVG 는 stroke 를
    // 자식에게 물려주므로 도형마다 일일이 붙일 필요가 없다.
    // 얼굴 선(눈·입)과 소품은 자기 stroke 를 따로 쓰므로 이 그룹 밖에 둔다.
    const ol = OUTLINE[L.ol];
    const strokeOpen = ol ? `<g stroke="${ol[0]}" stroke-width="${ol[1]}" stroke-linejoin="round">` : '';
    const strokeClose = ol ? '</g>' : '';

    // 배경은 키 확대(open/close) 밖에 둔다 — 키가 커도 배경은 그대로여야 한다
    const bg = BG[L.bg] && BG[L.bg] !== 'transparent'
      ? `<rect x="0" y="0" width="64" height="120" rx="11" fill="${BG[L.bg]}"/>` : '';

    return `<svg class="chr ${crop}${opts.bounce === false ? '' : 'chr-bounce'}" viewBox="0 0 64 120"
      width="${size}" height="${Math.round(size * 120 / 64)}" style="animation-delay:${delay}s" aria-hidden="true">
      <defs><clipPath id="${uid}"><rect x="17" y="37" width="30" height="32" rx="3.5"/></clipPath></defs>
      ${bg}
      ${open}
      ${strokeOpen}
      ${leg(true)}${leg(false)}

      ${/* 목 · 유니폼 */ ''}
      <rect x="28.5" y="30" width="7" height="8" fill="${skin}"/>
      <rect x="17" y="37" width="30" height="32" rx="3.5" fill="${kit}"/>
      ${topPattern(L.ts, trim, uid)}
      <rect x="28" y="37" width="8" height="3.5" rx="1.5" fill="${trim}"/>

      ${/* 팔은 몸통 뒤가 아니라 앞에 그린다 — 팔짱·박수처럼 가슴 앞으로
           접는 자세에서 팔뚝이 유니폼에 가려지면 자세가 안 읽힌다 */ ''}
      ${arm(true)}${arm(false)}

      ${/* 얼굴 · 머리 */ ''}
      <rect x="21" y="4" width="22" height="27" rx="6" fill="${skin}"/>
      ${hairHtml(L.hl, L.hs, hairC, band)}
      ${strokeClose}

      ${number ? `<text x="32" y="59" text-anchor="middle" font-size="11"
        font-family="-apple-system, Pretendard, sans-serif" font-weight="700" fill="${trim}">${number}</text>` : ''}
      ${faceHtml(L.fa, skin)}
      ${accHtml(L.ac, ACC[L.ah], skin)}
      ${ballHtml(P.ball)}${heartHtml(P.heart)}
      ${close}
    </svg>`;
  }

  // 저장된 룩 등록 — 이후 모든 charSvg 호출에 자동 반영된다
  function setLooks(map) { LOOKS = map || {}; }
  function getLook(name) { return lookFor(name); }
  function randomLook() {
    const out = {};
    KEYS.forEach((k) => { out[k] = Math.floor(Math.random() * SIZE[k]); });
    return out;
  }

  window.FDChar = {
    charSvg, hash, setLooks, getLook, randomLook,
    fromHash, normalize, KEYS, SIZE, LABEL, PALETTE, HEIGHT,
  };
})();
