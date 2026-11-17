# one self-contained html for a deck (images/videos inlined, no site links), like the other standalone decks
# usage: py -I standalone.py <src dir> <deck slug> <output .html>
import base64, re, sys, os
SRC, SLUG, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
read = lambda p: open(os.path.join(SRC, p), encoding="utf-8").read()
MIME = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "mp4": "video/mp4", "webm": "video/webm"}
def uri(p):
    return f"data:{MIME[p.rsplit('.', 1)[1].lower()]};base64," + base64.b64encode(open(os.path.join(SRC, p), "rb").read()).decode()
html = read(f"decks/{SLUG}/shell.html").replace("{{LOGO}}", uri("logo.png"))
if "{{COVER}}" in html:
    html = html.replace("{{COVER}}", uri(f"decks/{SLUG}/cover.jpg"))
html = html.replace("{{APP}}", read(f"decks/{SLUG}/app.js").replace("/*LIVE_CORE*/", read("live_core.js")))
html = re.sub(r"\{\{IMG:([^}]+)\}\}", lambda m: uri(f"decks/{SLUG}/img/" + m.group(1)), html)
assert "{{" not in html and "/*LIVE_CORE*/" not in html, "unfilled placeholder"
open(OUT, "w", encoding="utf-8").write(html)
print("wrote", OUT, round(os.path.getsize(OUT) / 1e6, 2), "MB")
