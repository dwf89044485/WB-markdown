#!/bin/sh
# Vercel 构建脚本：将 commit hash 注入到前端可访问的位置
echo "$VERCEL_GIT_COMMIT_SHA" > COMMIT_HASH
# 替换 index.html 中的占位符（兼容 macOS 和 Linux）
sed "s/__COMMIT_HASH__/$VERCEL_GIT_COMMIT_SHA/g" index.html > index.html.tmp && mv index.html.tmp index.html
