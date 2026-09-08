// FC풉살 — 통통 튀는 2등신 캐릭터 생성기
// 이름을 넣으면 항상 같은 캐릭터가 나옵니다 (해시 기반).
//
// 그리는 순서: 그림자 → 다리/신발 → 몸통(유니폼) → 팔 → 뒷머리 → 얼굴 → 앞머리 → 표정
// 얼굴은 "머리카락 원" 위에 "살구색 원"을 덮어 만들기 때문에 표정이 항상 잘 보입니다.
(function () {
  const SKIN = ['#FFDFC4', '#FFD1AE', '#F6C9A6', '#FFE7D3'];
  const HAIR = ['#3B2A24', '#5C3A21', '#241F1E', '#7A4B2A', '#9A6B3F', '#33303A'];
  const JERSEY = ['#36C5F0', '#E01E5A', '#2EB67D', '#ECB22E', '#8E6FE0', '#FF8A5B', '#4ECDC4', '#F76D8E'];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // 얼굴 뒤에 깔리는 머리 (뒷머리 · 묶은 머리)
  function hairBack(kind, c) {
    switch (kind) {
      case 1: // 포니테일
        return `<circle cx="32" cy="32" r="21" fill="${c}"/>
                <path d="M50 26c8 1 12 8 11 16-.4 4-6 4-6.6-.4-.5-4-2-8-6-10z" fill="${c}"/>
                <circle cx="55" cy="24" r="4.5" fill="${c}"/>`;
      case 2: // 양갈래
        return `<circle cx="32" cy="32" r="21" fill="${c}"/>
                <circle cx="11" cy="40" r="7.5" fill="${c}"/><circle cx="53" cy="40" r="7.5" fill="${c}"/>`;
      case 3: // 긴 생머리
        return `<circle cx="32" cy="32" r="21" fill="${c}"/>
                <path d="M11 32c0 14 1.5 22 3 27 .7 2.4 5 2 5-1V34zM53 32c0 14-1.5 22-3 27-.7 2.4-5 2-5-1V34z" fill="${c}"/>`;
      default: // 단발
        return `<circle cx="32" cy="32" r="21" fill="${c}"/>
                <path d="M11 32c0 9 1 15 2 19 .6 2 4.6 1.7 4.6-.8V34zM53 32c0 9-1 15-2 19-.6 2-4.6 1.7-4.6-.8V34z" fill="${c}"/>`;
    }
  }

  // 얼굴 위에 얹는 앞머리
  function bangs(kind, c) {
    switch (kind) {
      case 1: // 가운데 가르마
        return `<path d="M32 15c-11 0-18 6-18.6 14.5 3-6 8-9.5 13-10.5-2 2-3 4-3.4 6 3-4.6 7.6-6.4 9-6.4s6 1.8 9 6.4c-.4-2-1.4-4-3.4-6 5 1 10 4.5 13 10.5C50 21 43 15 32 15z" fill="${c}"/>`;
      case 2: // 일자 앞머리
        return `<path d="M14 30c0-10 8-16 18-16s18 6 18 16c0-4-4-6-18-6s-18 2-18 6z" fill="${c}"/>
                <path d="M14 28c2-7 9-11 18-11s16 4 18 11c-1-9-8-14-18-14s-17 5-18 14z" fill="${c}"/>`;
      default: // 사이드 뱅
        return `<path d="M32 14c-10.5 0-18 6.5-18.4 15.6 2-7 6.5-11 11-12.2-1.6 2.4-2.2 4.8-2 7.2 3.6-5.6 10-8 15.4-7 4 .8 7.4 3.6 9.6 8.2C47.4 19.6 41.6 14 32 14z" fill="${c}"/>`;
    }
  }

  // 표정 3종
  function face(kind) {
    const eyes = kind === 2
      ? `<path d="M23 33.5c1.6-2.4 5-2.4 6.6 0M34.4 33.5c1.6-2.4 5-2.4 6.6 0"
           stroke="#3A3238" stroke-width="2.6" stroke-linecap="round" fill="none"/>`
      : `<ellipse cx="26" cy="34" rx="2.9" ry="3.2" fill="#3A3238"/>
         <ellipse cx="38" cy="34" rx="2.9" ry="3.2" fill="#3A3238"/>
         <circle cx="27.1" cy="32.8" r="1.1" fill="#fff"/><circle cx="39.1" cy="32.8" r="1.1" fill="#fff"/>`;
    const mouth = kind === 1
      ? `<ellipse cx="32" cy="42" rx="3.4" ry="3.9" fill="#D9536F"/>
         <ellipse cx="32" cy="43.4" rx="2" ry="1.8" fill="#F58AA0"/>`
      : `<path d="M28.2 41.4c1.8 2.6 5.8 2.6 7.6 0" stroke="#C2455F" stroke-width="2.4"
           stroke-linecap="round" fill="none"/>`;
    return `${eyes}${mouth}
      <ellipse cx="20.5" cy="39.5" rx="3.4" ry="2.6" fill="#FF9EB5" opacity=".5"/>
      <ellipse cx="43.5" cy="39.5" rx="3.4" ry="2.6" fill="#FF9EB5" opacity=".5"/>`;
  }

  /**
   * 캐릭터 SVG 문자열.
   * @param {string} name  선수 이름 (같은 이름 = 항상 같은 캐릭터)
   * @param {object} opts  { size, jersey, number, bounce }
   */
  function charSvg(name, opts = {}) {
    const h = hash(name || '?');
    const size = opts.size || 64;
    const skin = SKIN[h % SKIN.length];
    const hair = HAIR[(h >>> 3) % HAIR.length];
    const jersey = opts.jersey || JERSEY[(h >>> 6) % JERSEY.length];
    const backKind = (h >>> 9) % 4;
    const bangKind = (h >>> 11) % 3;
    const faceKind = (h >>> 13) % 3;
    const delay = ((h >>> 16) % 12) / 12; // 다 같이 튀지 않도록 시작을 흩뜨림

    return `<svg class="chr ${opts.bounce === false ? '' : 'chr-bounce'}" viewBox="0 0 64 90"
      width="${size}" height="${Math.round(size * 90 / 64)}" style="animation-delay:${delay}s" aria-hidden="true">
      <ellipse cx="32" cy="85.5" rx="16" ry="3.2" fill="#2B2530" opacity=".10"/>

      <rect x="24.5" y="70" width="6" height="10" rx="3" fill="${skin}"/>
      <rect x="33.5" y="70" width="6" height="10" rx="3" fill="${skin}"/>
      <ellipse cx="26" cy="82" rx="5.4" ry="3.2" fill="#fff" stroke="#E6E1EA" stroke-width="1.2"/>
      <ellipse cx="38" cy="82" rx="5.4" ry="3.2" fill="#fff" stroke="#E6E1EA" stroke-width="1.2"/>

      ${/* 머리카락은 몸통보다 먼저 그려서 유니폼을 덮지 않게 한다 */ ''}
      ${hairBack(backKind, hair)}

      <rect x="16.5" y="49" width="31" height="27" rx="13.5" fill="${jersey}"/>
      ${opts.number ? `<text x="32" y="69" text-anchor="middle" font-size="11"
        font-family="Jua, sans-serif" fill="#fff" opacity=".92">${opts.number}</text>` : ''}
      <circle cx="14.5" cy="58" r="5.6" fill="${skin}"/>
      <circle cx="49.5" cy="58" r="5.6" fill="${skin}"/>

      <circle cx="32" cy="34" r="17" fill="${skin}"/>
      ${bangs(bangKind, hair)}
      ${face(faceKind)}
    </svg>`;
  }

  window.FDChar = { charSvg, hash };
})();
