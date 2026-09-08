// FC풉살 — 플랫 지오메트릭 축구 캐릭터 생성기
// 2014 월드컵 "GOL!" 포스터 톤: 외곽선 없는 납작한 색면, 절제된 점 눈,
// 유니폼(줄무늬·소매·카라) · 반바지 · 양말 · 축구화까지 색 블록으로 구성.
// 이름을 넣으면 항상 같은 캐릭터가 나옵니다 (해시 기반).
(function () {
  const SKIN = ['#F7C9A3', '#EFB68B', '#D89B6C', '#B4784B', '#8A5433', '#5E3620'];
  const HAIR = ['#2B2119', '#42301F', '#6B4A2A', '#141414', '#8C6239', '#C68642', '#3E2A2A'];
  const KIT = ['#2D7DD2', '#E0333F', '#22A06B', '#F2B705', '#7A4FCF', '#EE7B30', '#12A5C6', '#E24A8B'];
  const SHORTS = ['#E9EBEE', '#1F2B4D', '#2B2B2B'];
  const BOOT = ['#E4E6E9', '#1F1F1F', '#F2B705', '#E0333F', '#22A06B', '#EE7B30'];
  const BAND = ['#F2B705', '#E24A8B', '#ECEDEF', '#22A06B'];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // 밝은 유니폼 위에는 진한 무늬를, 진한 유니폼 위에는 흰 무늬를 얹는다
  function trimFor(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165 ? '#1F2B4D' : '#E9EBEE';
  }

  // 머리 모양 6종 — 얼굴(x20~44, y8~36) 기준
  function hair(kind, c, bandColor) {
    const cap = `<rect x="19.5" y="2.5" width="25" height="12.5" rx="6" fill="${c}"/>`;
    switch (kind) {
      case 1: // 포니테일
        return `${cap}<rect x="19.5" y="9" width="4" height="12" fill="${c}"/>
                <rect x="40.5" y="9" width="4" height="12" fill="${c}"/>
                <circle cx="47.5" cy="17" r="5" fill="${c}"/>
                <rect x="45.5" y="17" width="4.5" height="14" rx="2.25" fill="${c}"/>`;
      case 2: // 긴 생머리
        return `${cap}<rect x="18.5" y="9" width="4.5" height="26" rx="2" fill="${c}"/>
                <rect x="41" y="9" width="4.5" height="26" rx="2" fill="${c}"/>`;
      case 3: // 번(똥머리)
        return `<circle cx="32" cy="2" r="5.5" fill="${c}"/>${cap}
                <rect x="19.5" y="9" width="4" height="9" fill="${c}"/>
                <rect x="40.5" y="9" width="4" height="9" fill="${c}"/>`;
      case 4: // 곱슬 볼륨
        return `<rect x="16.5" y="0" width="31" height="21" rx="10.5" fill="${c}"/>
                <rect x="19" y="9" width="4.5" height="13" rx="2" fill="${c}"/>
                <rect x="40.5" y="9" width="4.5" height="13" rx="2" fill="${c}"/>`;
      case 5: // 헤어밴드
        return `${cap}<rect x="19.5" y="9" width="4" height="11" fill="${c}"/>
                <rect x="40.5" y="9" width="4" height="11" fill="${c}"/>
                <rect x="19.5" y="10.5" width="25" height="3.8" fill="${bandColor}"/>`;
      default: // 단발
        return `${cap}<rect x="19.5" y="9" width="4" height="15" rx="1.5" fill="${c}"/>
                <rect x="40.5" y="9" width="4" height="15" rx="1.5" fill="${c}"/>`;
    }
  }

  // 유니폼 무늬 5종 (저지 영역으로 클리핑)
  function kitPattern(kind, trim, uid) {
    const inner = {
      1: `<rect x="21" y="37" width="4.5" height="32" fill="${trim}"/>
          <rect x="29.8" y="37" width="4.5" height="32" fill="${trim}"/>
          <rect x="38.5" y="37" width="4.5" height="32" fill="${trim}"/>`,
      2: `<rect x="17" y="48" width="30" height="8.5" fill="${trim}"/>`,
      3: `<rect x="8" y="37" width="8.5" height="48" transform="rotate(-32 32 53)" fill="${trim}"/>`,
      4: `<rect x="32" y="37" width="15" height="32" fill="${trim}"/>`,
    }[kind];
    if (!inner) return '';
    return `<g clip-path="url(#${uid})">${inner}</g>`;
  }

  /**
   * 캐릭터 SVG 문자열.
   * @param {string} name  선수 이름 (같은 이름 = 항상 같은 캐릭터)
   * @param {object} opts  { size, jersey, number, bounce }
   */
  function charSvg(name, opts = {}) {
    const h = hash(name || '?');
    const size = opts.size || 48;
    const uid = 'fdk' + h.toString(36);

    const skin = SKIN[h % SKIN.length];
    const hairC = HAIR[(h >>> 3) % HAIR.length];
    const kit = opts.jersey || KIT[(h >>> 6) % KIT.length];
    const trim = trimFor(kit);
    const hairKind = (h >>> 9) % 6;
    const patKind = (h >>> 12) % 5;
    const shorts = SHORTS[(h >>> 15) % SHORTS.length];
    const boot = BOOT[(h >>> 18) % BOOT.length];
    const band = BAND[(h >>> 21) % BAND.length];
    const socks = ((h >>> 23) % 2) ? kit : trim;
    const delay = ((h >>> 25) % 12) / 12; // 다 같이 튀지 않도록 시작을 흩뜨림

    return `<svg class="chr ${opts.bounce === false ? '' : 'chr-bounce'}" viewBox="0 0 64 120"
      width="${size}" height="${Math.round(size * 120 / 64)}" style="animation-delay:${delay}s" aria-hidden="true">
      <defs><clipPath id="${uid}"><rect x="17" y="37" width="30" height="32" rx="3.5"/></clipPath></defs>

      ${/* 다리 · 양말 · 축구화 */ ''}
      <rect x="20" y="81" width="8.5" height="15" fill="${skin}"/>
      <rect x="35.5" y="81" width="8.5" height="15" fill="${skin}"/>
      <rect x="20" y="94" width="8.5" height="15" rx="1.5" fill="${socks}"/>
      <rect x="35.5" y="94" width="8.5" height="15" rx="1.5" fill="${socks}"/>
      <rect x="17" y="108" width="13" height="6.5" rx="3" fill="${boot}"/>
      <rect x="34" y="108" width="13" height="6.5" rx="3" fill="${boot}"/>

      ${/* 반바지 — 가운데를 띄워 두 다리를 만든다 */ ''}
      <rect x="17" y="66" width="14" height="17" rx="2.5" fill="${shorts}"/>
      <rect x="33" y="66" width="14" height="17" rx="2.5" fill="${shorts}"/>

      ${/* 팔 · 소매 */ ''}
      <rect x="11.5" y="50" width="5.5" height="18" rx="2.75" fill="${skin}"/>
      <rect x="47" y="50" width="5.5" height="18" rx="2.75" fill="${skin}"/>
      <rect x="11" y="37" width="6.5" height="15" rx="3" fill="${kit}"/>
      <rect x="46.5" y="37" width="6.5" height="15" rx="3" fill="${kit}"/>

      ${/* 목 · 유니폼 */ ''}
      <rect x="28.5" y="30" width="7" height="8" fill="${skin}"/>
      <rect x="17" y="37" width="30" height="32" rx="3.5" fill="${kit}"/>
      ${kitPattern(patKind, trim, uid)}
      <rect x="28" y="37" width="8" height="3.5" rx="1.5" fill="${trim}"/>
      ${opts.number ? `<text x="32" y="59" text-anchor="middle" font-size="11"
        font-family="Jua, sans-serif" fill="${trim}">${opts.number}</text>` : ''}

      ${/* 얼굴 */ ''}
      <rect x="21" y="4" width="22" height="27" rx="6" fill="${skin}"/>
      ${hair(hairKind, hairC, band)}
      <circle cx="27.5" cy="21.5" r="1.9" fill="#241F1E"/>
      <circle cx="36.5" cy="21.5" r="1.9" fill="#241F1E"/>
    </svg>`;
  }

  window.FDChar = { charSvg, hash };
})();
