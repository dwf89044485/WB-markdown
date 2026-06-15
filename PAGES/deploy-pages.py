"""将当前项目文件打包并写入 /tmp/pages_payload.json，供 deploy-pages.sh 上传"""

import json, os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = [
    "index.html",
    "scenario.js",
    "icons-inline.js",
    "commit-hash.js",
    "design-notes.js",
    "vercel.json",
    "engine/core.js",
    "engine/markdown.js",
    "engine/icons.js",
    "engine/typewriter.js",
    "engine/sheet.js",
    "engine/player.js",
    "engine/scroll-nav.js",
    "engine/ask-question.js",
    "engine/controls-stepper.js",
    "engine/controls-speed.js",
    "styles/base.css",
    "styles/conversation.css",
    "styles/markdown.css",
    "styles/sheet.css",
    "styles/demo-controls.css",
    "styles/ask-question.css",
]

files = {}
for t in FILES:
    fp = os.path.join(ROOT_DIR, t)
    with open(fp, "r", encoding="utf-8") as f:
        files[t] = f.read()

payload = json.dumps({"files": files, "description": "WorkBuddy 对话流体验原型"}, ensure_ascii=False)

with open("/tmp/pages_payload.json", "w") as f:
    f.write(payload)

print(f"✅ Payload: {len(payload) / 1024:.0f} KB, {len(files)} files")
