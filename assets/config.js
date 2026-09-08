// FC풉살 2026 하반기 드래프트 — 공통 설정
// 이 파일의 키는 공개용(anon)입니다. 실제 보안은 Supabase RLS + SECURITY DEFINER 함수가 담당합니다.
window.FD = {
  SUPABASE_URL: 'https://qjvuxwldlviknhiydoxw.supabase.co',
  SUPABASE_KEY: 'sb_publishable_RLFma5SNSLQHni7jpWVo7Q_3u4to-EL',

  TEAM_COLORS: { A: '#36C5F0', B: '#E01E5A', C: '#2EB67D' },

  PHASES: ['SETUP', 'VOTE', 'REVEAL', 'DRAFT', 'RESULT', 'PREDICT', 'MATCH'],

  PHASE_LABEL: {
    SETUP: '준비 중',
    VOTE: '선호팀 투표',
    REVEAL: '드래프트 순서 발표',
    DRAFT: '드래프트 진행 중',
    RESULT: '팀 확정',
    PREDICT: '우승 예측 · 응원',
    MATCH: '매치데이',
  },

  ERROR_MESSAGE: {
    ALREADY_VOTED: '이미 투표를 마치셨어요. 한 사람당 한 번만 투표할 수 있습니다.',
    ALREADY_PREDICTED: '이미 예측을 등록하셨어요.',
    NOT_VOTING: '지금은 투표 기간이 아니에요.',
    NOT_PREDICTING: '지금은 예측 기간이 아니에요.',
    NOT_DRAFT_PHASE: '지금은 드래프트 기간이 아닙니다.',
    NOT_YOUR_TURN: '지금은 우리 팀 차례가 아니에요.',
    ALREADY_PICKED: '이미 다른 팀이 지명한 선수예요.',
    DRAFT_DONE: '드래프트가 이미 끝났습니다.',
    DRAFT_INCOMPLETE: '아직 18픽이 모두 끝나지 않았어요.',
    NOTHING_TO_UNDO: '취소할 픽이 없습니다.',
    NOT_YOUR_PICK: '직전 픽을 한 코치 본인만 취소할 수 있어요.',
    INVALID_PASSCODE: '암호가 올바르지 않습니다.',
    NOT_MASTER: '마스터 권한이 필요합니다.',
    DUPLICATE_CHOICE: '같은 팀을 중복해서 고를 수 없어요.',
    UNKNOWN_PLAYER: '명단에 없는 이름입니다.',
    PLEDGE_CLOSED: '각오 한마디는 지금 남길 수 없어요.',
    COMMENTS_CLOSED: '아직 응원 채널이 열리지 않았어요.',
    VOTE_IN_PROGRESS: '투표가 끝나야 결과를 볼 수 있어요.',
  },

  // 총 18픽 = 3팀 × 6명, 라운드마다 방향이 뒤집히는 스네이크
  TOTAL_PICKS: 18,
  ROSTER_SIZE: 6,
};
