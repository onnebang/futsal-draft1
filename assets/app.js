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

    // 코치 보드 리허설용 상태
    coachState() {
      const picks = ['해수', '다이', '은재', '이지', '서윤', '가은', '나영'].map((p, i) => ({
        seq: i, team: snakeTeam(['A', 'B', 'C'], i), player: p, by: 'demo',
      })).slice(0, this.config.progress_cursor);
      return {
        coach: { id: 'mh', name: '민호', team: 'A', is_master: false },
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

    masterSetPhase: (pass, phase) => rpc('master_set_phase', { p_passcode: pass, p_phase: phase }),
    masterRevealStep: (pass, step) => rpc('master_set_reveal_step', { p_passcode: pass, p_step: step }),
    masterLockOrder: (pass) => rpc('master_lock_order', { p_passcode: pass }),
    masterPublish: (pass) => rpc('master_publish', { p_passcode: pass }),
    masterHideComment: (pass, id) => rpc('master_hide_comment', { p_passcode: pass, p_id: id }),
    masterReset: (pass) => rpc('master_reset', { p_passcode: pass, p_confirm: 'RESET' }),
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

  function confetti() {
    if (typeof window.confetti !== 'function') return;
    const end = Date.now() + 2500;
    (function frame() {
      window.confetti({ particleCount: 4, spread: 70, origin: { x: Math.random(), y: Math.random() * .5 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  window.FDApp = { api, store, snakeTeam, snakeSeq, colorFor, esc, timeAgo, shuffled, confetti, DEMO };
})();
