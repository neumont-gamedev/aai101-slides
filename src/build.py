"""rebuild the site from src/: python src/build.py (no dependencies beyond python 3)

each deck in DECKS becomes <slug>/index.html, plus the landing page index.html.
to add a deck: put its source in src/decks/<slug>/, write a builder function, add a line to DECKS.
images: put them in src/decks/<slug>/img/ and reference them as {{IMG:name.jpg}} in the deck source.
"""
import base64, os, re, shutil

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(SRC)  # the site root (the repo root)
CORE = open(f"{SRC}/live_core.js", encoding="utf-8").read()
read = lambda p: open(f"{SRC}/{p}", encoding="utf-8").read()
b64 = lambda p, mime: f"data:{mime};base64," + base64.b64encode(open(f"{SRC}/{p}", "rb").read()).decode()
LOGO = b64("logo.png", "image/png")

def ai_history_1():
    s = read("decks/ai-history-1/shell.html")
    s = s.replace("{{LOGO}}", LOGO).replace("{{COVER}}", b64("decks/ai-history-1/cover.jpg", "image/jpeg"))
    return s.replace("{{APP}}", read("decks/ai-history-1/app.js").replace("/*LIVE_CORE*/", CORE))

def ai_history_2():
    s = read("decks/ai-history-2/shell.html").replace("{{LOGO}}", LOGO)
    return s.replace("{{APP}}", read("decks/ai-history-2/app.js").replace("/*LIVE_CORE*/", CORE))

def cellular_automata():
    return read("decks/cellular-automata/deck.html").replace("/*LIVE_CORE*/", CORE)

DECKS = [
    # slug, builder, number, title, blurb
    ("ai-history-1", ai_history_1, "01", "AI History · Part 1",
     "From Aristotle and Boole to the Turing Test, neural networks, ELIZA, expert systems and Deep Blue."),
    ("ai-history-2", ai_history_2, "02", "AI History · Part 2",
     "From backprop and Roomba to AlexNet, transformers and ChatGPT, with hands-on demos."),
    ("cellular-automata", cellular_automata, "03", "Cellular Automata",
     "Simple rules, complex worlds: Conway’s Game of Life, patterns, and a sandbox to play in."),
]

def stamp():
    # shown next to the slide counter so you can tell which version a browser has loaded
    from datetime import datetime
    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Denver"))
    except Exception:
        now = datetime.now()
    return now.strftime("%b %d, %I:%M %p").replace(" 0", " ")

def to_web(html, slug):
    # tag the deck, make the brand a link home, and load the firebase live sync
    html = html.replace("<head>", f'<head>\n<meta name="deck-id" content="{slug}">', 1)
    html, n = re.subn(r'<div id="brand">(.*?)</div>', r'<a id="brand" href="../" title="All slide decks" style="text-decoration:none">← \1</a>', html, count=1)
    assert n == 1, "deck is missing its #brand element"
    html = html.replace('<span id="count">', f'<span class="ver" style="font-size:12px;opacity:.6;margin-right:8px">updated {stamp()}</span><span id="count">', 1)
    return html.replace("</body>", '<script type="module" src="../live.js"></script>\n</body>', 1)

def main():
    cards = []
    for slug, build, num, title, blurb in DECKS:
        html = re.sub(r"\{\{IMG:([^}]+)\}\}", r"img/\1", build())  # images load as files from <slug>/img/
        assert "/*LIVE_CORE*/" not in html and "{{" not in html, f"{slug}: unfilled placeholder"
        os.makedirs(f"{OUT}/{slug}", exist_ok=True)
        if os.path.isdir(f"{SRC}/decks/{slug}/img"):
            shutil.copytree(f"{SRC}/decks/{slug}/img", f"{OUT}/{slug}/img", dirs_exist_ok=True)
        open(f"{OUT}/{slug}/index.html", "w", encoding="utf-8").write(to_web(html, slug))
        cards.append(f'    <a class="deck" href="{slug}/"><span class="n">{num}</span><h2>{title}</h2><p>{blurb}</p><span class="go">Open slides →</span></a>')
        print("built", slug)
    idx = read("site_index.html").replace("{{LOGO}}", LOGO).replace("{{DECKS}}", "\n".join(cards))
    open(f"{OUT}/index.html", "w", encoding="utf-8").write(idx)
    for f in ("live.js", "config.js", "firestore.rules"):
        shutil.copy(f"{SRC}/site/{f}", f"{OUT}/{f}")
    open(f"{OUT}/.nojekyll", "w").close()
    print("built index.html")

main()
