#!/usr/bin/env bash
# 배포할 때마다 asset 링크에 ?v=<내용 해시> 를 새로 박는다.
#
# 왜 필요한가: GitHub Pages 는 정적 파일을 캐시로 오래 물고 있고,
# 카톡 인앱 브라우저는 그걸 더 오래 잡는다. HTML 만 새로 받고 CSS/JS 는
# 옛날 걸 쓰는 상태가 실제로 나왔다 (레이아웃이 통째로 깨져 보인다).
# 파일 내용이 바뀌면 URL 이 바뀌므로 브라우저가 반드시 새로 받는다.
set -euo pipefail
cd "$(dirname "$0")/.."

ver=$(cat assets/style.css assets/app.js assets/character.js assets/config.js \
      | sha1sum | cut -c1-8)

for f in index.html coach.html admin.html; do
  [ -f "$f" ] || continue
  # href="assets/x.css" 또는 href="assets/x.css?v=..." → href="assets/x.css?v=<ver>"
  perl -pi -e 's{(\b(?:href|src)="assets/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"}{$1?v='"$ver"'"}g' "$f"
done

echo "asset version = $ver"
