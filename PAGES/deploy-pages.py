"""将当前项目文件打包并写入 /tmp/pages_payload.json，供 deploy-pages.sh 上传"""

import json, os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 精确列出的文件（不在固定目录结构里的）
EXPLICIT_FILES = [
    "index.html",
    "scenario.js",
    "icons-inline.js",
    "commit-hash.js",
    "design-notes.js",
    "vercel.json",
]

# 自动扫描的目录（所有文件均纳入）
SCAN_DIRS = [
    "engine",
    "features",
    "styles",
    "assets",
    "icons",
    "vendor",
]

def collect_files(root, dirs):
    """收集 dirs 下所有文件，路径为相对 ROOT_DIR 的斜杠分隔字符串"""
    files = []
    for d in dirs:
        full = os.path.join(root, d)
        if not os.path.isdir(full):
            continue
        for dirpath, _, filenames in os.walk(full):
            for fn in filenames:
                if fn == ".DS_Store":
                    continue
                abs_path = os.path.join(dirpath, fn)
                rel_path = os.path.relpath(abs_path, root).replace(os.sep, "/")
                files.append(rel_path)
    return sorted(files)

all_files = EXPLICIT_FILES + collect_files(ROOT_DIR, SCAN_DIRS)

import base64

BINARY_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot"}

def read_file(root, rel_path):
    ext = os.path.splitext(rel_path)[1].lower()
    fp = os.path.join(root, rel_path)
    if ext in BINARY_EXTS:
        with open(fp, "rb") as f:
            return base64.b64encode(f.read()).decode("ascii")
    else:
        with open(fp, "r", encoding="utf-8") as f:
            return f.read()

files = {}
for t in all_files:
    content = read_file(ROOT_DIR, t)
    files[t] = content

payload = json.dumps({"files": files, "description": "WorkBuddy 对话流体验原型"}, ensure_ascii=False)

with open("/tmp/pages_payload.json", "w") as f:
    f.write(payload)

print(f"✅ Payload: {len(payload) / 1024:.0f} KB, {len(files)} files")
