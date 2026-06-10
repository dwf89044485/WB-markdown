#!/bin/bash
# 部署当前项目到 pages.woa.com
# 使用: ./scripts/deploy-pages.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

python3 "$ROOT_DIR/scripts/deploy-pages.py"

curl -s -X PUT \
  -H "X-Api-Key: $OA_PAGES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/pages_payload.json \
  "https://pages.woa.com/api/sites/workbuddy-markdown.pages.woa.com" | python3 -m json.tool
