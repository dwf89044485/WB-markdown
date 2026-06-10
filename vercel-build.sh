#!/bin/sh
# Vercel 构建脚本：将 commit hash 注入到 index.html 的 meta 占位符。
# 注：本地端通过 commit-hash.js 直接读取 .git/HEAD 获取最新 hash，
# Vercel 部署不会上传 .git 目录，所以前端会自动 fallback 到此处注入的 meta 值。
SHORT_SHA=$(printf '%s' "$VERCEL_GIT_COMMIT_SHA" | cut -c1-8)
sed "s/__COMMIT_HASH__/$SHORT_SHA/g" index.html > index.html.tmp && mv index.html.tmp index.html

# 删除 docs 目录（仅包含外部文档资源，非项目运行必需）
rm -rf docs
