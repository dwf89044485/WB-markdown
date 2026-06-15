#!/bin/bash
# 部署当前项目到 pages.woa.com
# 使用: ./PAGES/deploy-pages.sh

# 如果 OA_PAGES_API_KEY 未设置，尝试从 ~/.zshrc 读取
if [ -z "$OA_PAGES_API_KEY" ]; then
  OA_PAGES_API_KEY=$(grep '^export OA_PAGES_API_KEY=' ~/.zshrc 2>/dev/null | head -1 | sed 's/.*="//;s/"$//')
fi

if [ -z "$OA_PAGES_API_KEY" ]; then
  echo "❌ OA_PAGES_API_KEY 未设置，请在 ~/.zshrc 中配置后再试"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

python3 "$ROOT_DIR/PAGES/deploy-pages.py"

curl -s -X PUT \
  -H "X-Api-Key: $OA_PAGES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/pages_payload.json \
  "https://pages.woa.com/api/sites/workbuddy-markdown.pages.woa.com" | python3 -m json.tool
