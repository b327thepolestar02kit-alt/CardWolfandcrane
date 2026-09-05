import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
errors=[]
def text(name):
    p=ROOT/name
    if not p.exists(): errors.append(f"missing: {name}"); return ""
    return p.read_text(encoding="utf-8-sig")

s=text("data/cards.js")
cards=[]
m=re.match(r"\s*window\.CARD_POOL_DATA\s*=\s*(.*?);\s*$",s,re.S)
if not m: errors.append("data/cards.js: invalid wrapper")
else:
    try: cards=json.loads(m.group(1))
    except Exception as e: errors.append(f"data/cards.js: invalid JSON: {e}")
if len(cards)!=100: errors.append(f"data/cards.js: expected 100 cards, found {len(cards)}")
if len({c.get("name") for c in cards})!=len(cards): errors.append("data/cards.js: duplicate names")
for c in cards:
    if not str(c.get("image","")).startswith("images/"): errors.append(f"bad image path: {c.get('image')}")
idx=text("index.html")
if 'src="data/cards.js"' not in idx: errors.append("index.html does not load data/cards.js")
for req in ["data/cards.js","data/cards.config.json","images/.gitkeep","prepare_cards.cmd","prepare_cards.ps1","verify-build.py","crane.html"]:
    if not (ROOT/req).exists(): errors.append(f"missing required: {req}")
cr=text("crane.html")
for asset in ["ready_core_clean.png","success_core.png","success_drop_core.png","fail_core.png","fail_drop_core.png"]:
    if asset not in cr: errors.append(f"crane state missing: {asset}")
if errors:
    print("FAIL")
    [print(" -",e) for e in errors]
    raise SystemExit(1)
missing=[c["image"] for c in cards if not (ROOT/c["image"]).exists()]
if "--require-images" in sys.argv and missing:
    print(f"FAIL: missing card images={len(missing)}")
    raise SystemExit(1)
print("PASS")
print(f"cards=100")
print(f"missing_card_images={len(missing)}")
print("data=data/cards.js")
print("crane=crane.html")
