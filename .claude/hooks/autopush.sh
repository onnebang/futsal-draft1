#!/usr/bin/env bash
# 작업이 끝날 때(Stop) 자동으로 커밋 + 푸시.
# main 브랜치에서는 아무것도 하지 않는다 — 선수 18명이 보는 배포 브랜치라
# 확인 없이 올라가면 안 되기 때문.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo '{"systemMessage":"⚠️ main 브랜치에는 자동 푸시하지 않습니다. 작업 브랜치로 옮겨주세요: git switch -c claude/작업이름"}'
  fi
  exit 0
fi

[ -z "$(git status --porcelain)" ] && exit 0

# asset 링크에 내용 해시를 다시 박는다 — 카톡 인앱 브라우저가 옛 CSS 를
# 물고 있어 레이아웃이 깨져 보인 적이 있다. 커밋 전에 해야 같이 올라간다.
[ -x tools/stamp-assets.sh ] && ./tools/stamp-assets.sh >/dev/null 2>&1

git add -A || exit 0
git -c user.name="${GIT_AUTHOR_NAME:-Claude}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" \
    commit -q -m "자동 저장: $(date '+%Y-%m-%d %H:%M')" || exit 0

for wait in 0 2 4 8 16; do
  [ "$wait" -gt 0 ] && sleep "$wait"
  if git push -q -u origin "$branch" 2>/dev/null; then
    echo "{\"systemMessage\":\"✅ ${branch} 브랜치에 자동 커밋·푸시 완료\"}"
    exit 0
  fi
done

echo "{\"systemMessage\":\"⚠️ 커밋은 됐지만 푸시에 실패했습니다. 수동으로: git push -u origin ${branch}\"}"
exit 0
