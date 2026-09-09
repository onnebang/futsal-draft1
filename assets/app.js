// FC풉살 드래프트 — 공통 유틸 & API 레이어
(function () {
  const C = window.FD;
  const DEMO = new URLSearchParams(location.search).has('demo');

  // ── 저장소 (카톡 인앱 브라우저에서 막힐 수 있어 항상 try/catch) ──
  const store = {
    get(k) { try { return localStorage.getItem('fd_' + k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem('fd_' + k, v); } catch { /* 무시 */ } },
    del(k) { try { localStorage.removeItem('fd_' + k); } catch { /* 무시 */ } },
  };

  // ── HTTP ──────────────────────────────────────────────
  async function rest(path, opts = {}) {
    const res = await fetch(C.SUPABASE_URL + '/rest/v1/' + path, {
      ...opts,
      headers: {
        apikey: C.SUPABASE_KEY,
        Authorization: 'Bearer ' + C.SUPABASE_KEY,
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.status === 204 ? null : res.json();
  }

  async function rpc(fn, args) {
    const res = await fetch(C.SUPABASE_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: {
        apikey: C.SUPABASE_KEY,
        Authorization: 'Bearer ' + C.SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args || {}),
    });
    const text = await res.text();
    if (!res.ok) {
      let code = text;
      try { code = JSON.parse(text).message || text; } catch { /* 원문 사용 */ }
      const key = Object.keys(C.ERROR_MESSAGE).find((k) => code.includes(k));
      const err = new Error(key ? C.ERROR_MESSAGE[key] : '문제가 생겼어요. 잠시 후 다시 시도해주세요.');
      err.code = key || 'UNKNOWN';
      err.raw = code;
      throw err;
    }
    return text ? JSON.parse(text) : null;
  }

  // ── 데모 모드: 네트워크 없이 전체 흐름을 리허설 ──────────
  // ?demo=1&phase=RESULT 처럼 단계를 지정해 미리 볼 수 있습니다.
  const demoPhase = new URLSearchParams(location.search).get('phase') || 'VOTE';
  const demo = {
    config: {
      phase: demoPhase,
      reveal_step: demoPhase === 'REVEAL' ? 3 : 0,
      draft_order: null, // 아래에서 데모 득표 집계로 계산 (실제와 동일하게 득표순)
      progress_cursor: { DRAFT: 7, RESULT: 18, PREDICT: 18, MATCH: 18 }[demoPhase] || 0,
    },
    teams: [
      { code: 'A', name: '민호경표팀', coaches: '민호 · 경표', color: '#36C5F0', sort: 1 },
      { code: 'B', name: '원배원언팀', coaches: '원배 · 원언', color: '#E01E5A', sort: 2 },
      { code: 'C', name: '경목준하팀', coaches: '경목 · 준하', color: '#2EB67D', sort: 3 },
    ],
    players: ['가은', '나영', '다이', '민지', '서윤', '선민', '수연', '은재', '이지',
      '지혜', '해수', '혜린', '혜선', '혜은', '혜진', '화인', '효린', '호원'],
    marks: ['나영', '해수', '가은', '혜린', '민지'],
    pledges: {
      해수: '이번엔 진짜 잘할 수 있어요!',
      가은: '뽑아주세요 열심히 뛸게요 💪',
      나영: '어느 팀이든 최선을 다할게요',
      혜린: '체력 하나는 자신 있습니다 🔥',
      효린: '골 넣고 세리머니 준비했어요',
      호원: '어시스트 담당하겠습니다!',
    },
    looks: {
      해수: { h: 1, hl: 3, hs: 1, hc: 6, sk: 0, fa: 1, ts: 1, tc: 7, bs: 1, bc: 1, ss: 2, sc: 0, bo: 3 },
      가은: { h: 3, hl: 0, hs: 3, hc: 0, sk: 2, fa: 5, ts: 4, tc: 2, bs: 0, bc: 0, ss: 1, sc: 5, bo: 1 },
      혜린: { h: 2, hl: 2, hs: 4, hc: 7, sk: 1, fa: 3, ts: 2, tc: 4, bs: 2, bc: 2, ss: 0, sc: 6, bo: 2 },
    },
    ballots: [['A', 'C'], ['A', 'B'], ['B', 'A'], ['C', 'A'], ['A', 'C']],
    rosters: ['RESULT', 'PREDICT', 'MATCH'].includes(demoPhase) ? [
      { team: 'A', members: ['가은', '나영', '민지', '해수', '혜린', '효린'], power: 2.1 },
      { team: 'B', members: ['다이', '서윤', '선민', '수연', '혜선', '호원'], power: 2.0 },
      { team: 'C', members: ['은재', '이지', '지혜', '혜은', '혜진', '화인'], power: 1.9 },
    ] : [],
    comments: ['RESULT', 'PREDICT', 'MATCH'].includes(demoPhase) ? [
      { id: 'c1', team: 'A', nickname: '풉살고양이', body: '올해는 우승 각이다 🔥', created_at: new Date(Date.now() - 3.6e6).toISOString() },
      { id: 'c2', team: 'A', nickname: '골키퍼', body: '수비만 잘하면 됩니다!', created_at: new Date(Date.now() - 7.2e6).toISOString() },
    ] : [],
    predictions: ['PREDICT', 'MATCH'].includes(demoPhase) ? [
      { rank1: 'A', rank2: 'B', rank3: 'C', nickname: '풉살러1' },
      { rank1: 'A', rank2: 'C', rank3: 'B', nickname: '풉살러2' },
      { rank1: 'B', rank2: 'A', rank3: 'C', nickname: '풉살러3' },
    ] : [],
    predictMarks: [],
    matches: demoPhase === 'MATCH'
      ? [{ id: 1, home: 'A', away: 'B', home_score: 3, away_score: 1 },
         { id: 2, home: 'B', away: 'C', home_score: 2, away_score: 2 },
         { id: 3, home: 'C', away: 'A', home_score: 0, away_score: 1 }]
      : [{ id: 1, home: 'A', away: 'B', home_score: null, away_score: null },
         { id: 2, home: 'B', away: 'C', home_score: null, away_score: null },
         { id: 3, home: 'C', away: 'A', home_score: null, away_score: null }],

    // 코치 보드 리허설용 상태
    coachState() {
      const picks = ['해수', '다이', '은재', '이지', '서윤', '가은', '나영'].map((p, i) => ({
        seq: i, team: snakeTeam(['A', 'B', 'C'], i), player: p, by: 'demo',
      })).slice(0, this.config.progress_cursor);
      const asMaster = /admin/.test(location.pathname);
      return {
        coach: asMaster
          ? { id: 'master', name: '마스터', team: null, is_master: true }
          : { id: 'mh', name: '민호', team: 'A', is_master: false },
        phase: this.config.phase,
        reveal_step: this.config.reveal_step,
        draft_order: this.config.draft_order,
        cursor: this.config.progress_cursor,
        picks,
        wishes: [
          { coach: 'kp', coach_name: '경표', team: 'A', player: '혜린', kind: 'super' },
          { coach: 'wb', coach_name: '원배', team: 'B', player: '혜린', kind: 'normal' },
          { coach: 'gm', coach_name: '경목', team: 'C', player: '효린', kind: 'normal' },
        ],
        pledges: this.pledges,
        players: this.players,
        vote_count: this.marks.length,
      };
    },
  };

  function demoTally() {
    return demo.teams.map((t) => {
      const first = demo.ballots.filter((b) => b[0] === t.code).length;
      const second = demo.ballots.filter((b) => b[1] === t.code).length;
      return { code: t.code, first, second, score: first * 3 + second };
    });
  }

  function demoStandings() {
    const row = {};
    demo.teams.forEach((t) => { row[t.code] = { code: t.code, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0 }; });
    demo.matches.filter((m) => m.home_score != null).forEach((m) => {
      [[m.home, m.home_score, m.away_score], [m.away, m.away_score, m.home_score]].forEach(([c, gf, ga]) => {
        const r = row[c];
        r.played++; r.gf += gf; r.ga += ga;
        if (gf > ga) r.win++; else if (gf === ga) r.draw++; else r.loss++;
      });
    });
    return Object.values(row)
      .map((r) => ({ ...r, gd: r.gf - r.ga, pts: r.win * 3 + r.draw }))
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  if (DEMO && demoPhase !== 'VOTE') {
    demo.config.draft_order = demoTally()
      .sort((a, b) => b.score - a.score || b.first - a.first)
      .map((t) => t.code);
  }

  // ── 공개 API (선수용) ─────────────────────────────────
  const api = {
    DEMO,

    async config() {
      if (DEMO) return { ...demo.config };
      const rows = await rest('draft_config?select=*&id=eq.1');
      return rows[0];
    },

    async teams() {
      if (DEMO) return demo.teams.slice();
      return rest('draft_teams?select=*&order=sort');
    },

    async players() {
      if (DEMO) return demo.players.slice();
      const rows = await rest('draft_players?select=name');
      return rows.map((r) => r.name).sort((a, b) => a.localeCompare(b, 'ko'));
    },

    async voteMarks() {
      if (DEMO) return demo.marks.slice();
      const rows = await rest('draft_vote_marks?select=player_name');
      return rows.map((r) => r.player_name);
    },

    async pledges() {
      if (DEMO) return { ...demo.pledges };
      const rows = await rest('draft_pledges?select=player_name,body');
      return Object.fromEntries(rows.map((r) => [r.player_name, r.body]));
    },

    async submitVote(name, first, second) {
      if (DEMO) {
        if (demo.marks.includes(name)) { const e = new Error(C.ERROR_MESSAGE.ALREADY_VOTED); e.code = 'ALREADY_VOTED'; throw e; }
        demo.marks.push(name); demo.ballots.push([first, second || null]);
        return { ok: true };
      }
      return rpc('submit_vote', { p_name: name, p_first: first, p_second: second || null });
    },

    async submitPledge(name, body) {
      if (DEMO) { demo.pledges[name] = body; return { ok: true }; }
      return rpc('submit_pledge', { p_name: name, p_body: body });
    },

    async looks() {
      if (DEMO) return { ...demo.looks };
      const rows = await rest('draft_looks?select=player_name,look');
      return Object.fromEntries(rows.map((r) => [r.player_name, r.look]));
    },

    async submitLook(name, look) {
      if (DEMO) { demo.looks[name] = look; return { ok: true }; }
      return rpc('submit_look', { p_name: name, p_look: look });
    },

    async voteTally() {
      if (DEMO) return demoTally();
      return rpc('vote_tally', {});
    },

    async rosters() {
      if (DEMO) return demo.rosters.slice();
      return rest('draft_rosters?select=*');
    },

    async predictMarks() {
      if (DEMO) return demo.predictMarks.slice();
      const rows = await rest('draft_predict_marks?select=player_name');
      return rows.map((r) => r.player_name);
    },

    async predictions() {
      if (DEMO) return demo.predictions.slice();
      return rest('draft_predictions?select=rank1,rank2,rank3,nickname');
    },

    async submitPrediction(name, r1, r2, r3, nick) {
      if (DEMO) {
        if (demo.predictMarks.includes(name)) { const e = new Error(C.ERROR_MESSAGE.ALREADY_PREDICTED); e.code = 'ALREADY_PREDICTED'; throw e; }
        demo.predictMarks.push(name); demo.predictions.push({ rank1: r1, rank2: r2, rank3: r3, nickname: nick });
        return { ok: true };
      }
      return rpc('submit_prediction', { p_name: name, p_r1: r1, p_r2: r2, p_r3: r3, p_nick: nick });
    },

    async comments() {
      if (DEMO) return demo.comments.slice();
      return rest('draft_comments?select=id,team,nickname,body,created_at&order=created_at.desc&limit=200');
    },

    async submitComment(team, nick, body) {
      if (DEMO) {
        demo.comments.unshift({ id: crypto.randomUUID(), team, nickname: nick, body, created_at: new Date().toISOString() });
        return { ok: true };
      }
      return rpc('submit_comment', { p_team: team, p_nick: nick, p_body: body });
    },

    async matches() {
      if (DEMO) return demo.matches.slice();
      return rest('draft_matches?select=id,home,away,home_score,away_score&order=id');
    },

    async standings() {
      if (DEMO) return demoStandings();
      return rpc('standings', {});
    },

    masterSetScore(pass, matchId, home, away) {
      if (DEMO) {
        const m = demo.matches.find((x) => x.id === matchId);
        if (m) { m.home_score = home; m.away_score = away; }
        return Promise.resolve({ ok: true });
      }
      return rpc('master_set_score', { p_passcode: pass, p_match: matchId, p_home: home, p_away: away });
    },

    // ── 코치용 (암호 게이트) ────────────────────────────
    coachState: (pass) => (DEMO ? Promise.resolve(demo.coachState()) : rpc('coach_state', { p_passcode: pass })),

    coachPick(pass, player) {
      if (DEMO) {
        const st = demo.coachState();
        demo.config.progress_cursor = Math.min(C.TOTAL_PICKS, st.cursor + 1);
        return Promise.resolve(demo.coachState());
      }
      return rpc('coach_pick', { p_passcode: pass, p_player: player });
    },

    coachUndo(pass) {
      if (DEMO) {
        demo.config.progress_cursor = Math.max(0, demo.config.progress_cursor - 1);
        return Promise.resolve(demo.coachState());
      }
      return rpc('coach_undo', { p_passcode: pass });
    },

    coachWish: (pass, player, kind) =>
      (DEMO ? Promise.resolve(demo.coachState()) : rpc('coach_wish', { p_passcode: pass, p_player: player, p_kind: kind })),

    masterSetPhase(pass, phase) {
      if (DEMO) { demo.config.phase = phase; return Promise.resolve(demo.coachState()); }
      return rpc('master_set_phase', { p_passcode: pass, p_phase: phase });
    },

    masterRevealStep(pass, step) {
      if (DEMO) { demo.config.reveal_step = step; return Promise.resolve(demo.coachState()); }
      return rpc('master_set_reveal_step', { p_passcode: pass, p_step: step });
    },

    masterLockOrder(pass) {
      if (DEMO) {
        demo.config.draft_order = demoTally()
          .sort((a, b) => b.score - a.score || b.first - a.first).map((t) => t.code);
        return Promise.resolve(demo.coachState());
      }
      return rpc('master_lock_order', { p_passcode: pass });
    },

    masterPublish(pass) {
      if (DEMO) { demo.config.phase = 'RESULT'; return Promise.resolve(demo.coachState()); }
      return rpc('master_publish', { p_passcode: pass });
    },
    masterHideComment: (pass, id) => rpc('master_hide_comment', { p_passcode: pass, p_id: id }),
    masterReset(pass) {
      if (DEMO) {
        Object.assign(demo.config, { phase: 'SETUP', reveal_step: 0, draft_order: null, progress_cursor: 0 });
        return Promise.resolve(demo.coachState());
      }
      return rpc('master_reset', { p_passcode: pass, p_confirm: 'RESET' });
    },
  };

  // ── 헬퍼 ──────────────────────────────────────────────
  // 스네이크: 라운드마다 방향을 뒤집는다 (서버 draft_snake_team 과 동일 규칙)
  function snakeTeam(order, seq) {
    const round = Math.floor(seq / 3);
    const idx = seq % 3;
    return round % 2 === 0 ? order[idx] : order[2 - idx];
  }

  function snakeSeq(order) {
    return Array.from({ length: C.TOTAL_PICKS }, (_, i) => snakeTeam(order, i));
  }

  // 스네이크 트랙 — 6라운드 × 3픽을 팀 색 칸으로 그린다. 선수·코치 화면이 같이 쓴다.
  // 짝수 라운드는 오른쪽에서 왼쪽으로 흘러 "뱀" 모양이 눈에 보이게 한다.
  // 선수에게도 보여주는 화면이라 칸에는 팀만 적고, 누가 뽑혔는지는 절대 넣지 않는다.
  function snakeTrackHtml(order, cur, teams) {
    if (!order) return '';
    const teamOf = (c) => teams.find((t) => t.code === c) || { name: c, color: '#888' };
    const seq = snakeSeq(order);
    const rounds = [];
    for (let r = 0; r < C.TOTAL_PICKS / 3; r++) {
      const cells = [0, 1, 2].map((k) => {
        const i = r * 3 + k;
        const t = teamOf(seq[i]);
        const state = i < cur ? 'done' : i === cur ? 'now' : 'todo';
        return `<span class="st-cell ${state}" style="--tc:${t.color};--tc-bg:${t.color}24;--tc-bd:${t.color}66;--tc-glow:${t.color}73">
          <span class="st-name">${esc(t.name)}</span>
          ${state === 'done' ? '<span class="st-mark">✓</span>' : state === 'now' ? '<span class="st-mark st-now">지금</span>' : ''}
        </span>`;
      });
      const rev = r % 2 === 1;
      const roundDone = cur >= (r + 1) * 3;
      rounds.push(`<div class="st-round ${rev ? 'rev' : ''} ${roundDone ? 'done' : ''}">
        <span class="st-label">${r + 1}R</span>
        ${cells.join('<span class="st-arrow"></span>')}
      </div>`);
    }
    return `<div class="snake-track">${rounds.join('')}</div>`;
  }

  // 이름 → 고정 색상 (아바타용)
  const AVATAR_COLORS = ['#36C5F0', '#2EB67D', '#ECB22E', '#E01E5A', '#4A154B', '#1264A3', '#DE7C29'];
  function colorFor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    return Math.floor(diff / 86400) + '일 전';
  }

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 축포 — 외부 CDN을 쓰지 않는다.
  // 예전에 jsDelivr가 막혀 폰트가 통째로 깨진 적이 있어서, 이 프로젝트는
  // 브라우저로 나가는 리소스를 저장소 안에만 둔다. 캔버스 200줄이면 충분하다.
  function confetti(opts = {}) {
    if (typeof document === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const COLORS = opts.colors || ['#36C5F0', '#E01E5A', '#2EB67D', '#F2B705', '#7A4FCF', '#EE7B30'];
    const count = opts.count || 130;
    const duration = opts.duration || 2600;

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(cv);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.width = innerWidth * dpr;
    const H = cv.height = innerHeight * dpr;
    const ctx = cv.getContext('2d');
    if (!ctx) { cv.remove(); return; }
    ctx.scale(dpr, dpr);

    const w = innerWidth, h = innerHeight;
    // 좌우 하단에서 비스듬히 쏘아 올린다 — 가운데에서 터뜨리는 것보다 무대 느낌이 난다
    const bits = Array.from({ length: count }, (_, i) => {
      const left = i % 2 === 0;
      const angle = (left ? -60 : -120) + (Math.random() - .5) * 46;
      const speed = 11 + Math.random() * 11;
      return {
        x: left ? w * .08 : w * .92,
        y: h * .96,
        vx: Math.cos(angle * Math.PI / 180) * speed,
        vy: Math.sin(angle * Math.PI / 180) * speed,
        size: 5 + Math.random() * 6,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * .32,
        wob: Math.random() * Math.PI * 2,
        ratio: .35 + Math.random() * .65,
      };
    });

    const start = performance.now();
    (function frame(now) {
      const t = now - start;
      if (t > duration) { cv.remove(); return; }
      const fade = t > duration - 700 ? (duration - t) / 700 : 1;
      ctx.clearRect(0, 0, w, h);

      for (const b of bits) {
        b.vy += .34;             // 중력
        b.vx *= .992;            // 공기 저항
        b.wob += .1;
        b.x += b.vx + Math.sin(b.wob) * .7;
        b.y += b.vy;
        b.rot += b.spin;
        if (b.y > h + 40) continue;

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.globalAlpha = fade;
        ctx.fillStyle = b.color;
        // 회전에 따라 폭을 눌러 종잇조각이 팔랑거리는 것처럼 보이게 한다
        ctx.fillRect(-b.size / 2, -b.size * b.ratio / 2, b.size, b.size * b.ratio * Math.abs(Math.cos(b.wob)));
        ctx.restore();
      }
      requestAnimationFrame(frame);
    })(start);
  }

  window.FDApp = { api, store, snakeTeam, snakeSeq, snakeTrackHtml, colorFor, esc, timeAgo, shuffled, confetti, DEMO };
})();
