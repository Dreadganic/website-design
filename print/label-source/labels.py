#!/usr/bin/env python3
"""Beju bag labels for plain kraft valve pouches: a front label per coffee plus the
Japanese food-labelling panel (一括表示) for the back. Rendered to print PDFs with Chromium."""
import json, os, base64, html
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, "out")
LAND = json.load(open(os.path.join(ROOT, "land.json")))
LOGO = open(os.path.join(ROOT, "gen/logo/web/logo-horizontal-green.svg")).read()
LORA = "file://" + "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf"
BG, INK, MUTED = "#E8E1D5", "#1F1A15", "#6B6155"
OSAKA = (135.5, 34.69)
SELLER = ("ベージュ コーヒー ロースターズ（ジョーダン・ヒップキス）", "大阪府東大阪市東石切町4丁目9番地33")

LOTS = {
    "monteblanco": dict(country="Colombia", jp="コロンビア", place="Pitalito, Huila", lon=-76.05, lat=1.85),
    "laloma": dict(country="Colombia", jp="コロンビア", place="Caldas", lon=-75.55, lat=5.05),
    "cundinamarca": dict(country="Colombia", jp="コロンビア", place="Cundinamarca", lon=-74.45, lat=4.85),
    "terrapreta": dict(country="Brazil", jp="ブラジル", place="Mogiana", lon=-47.0, lat=-21.2),
    "aquiares": dict(country="Costa Rica", jp="コスタリカ", place="Turrialba", lon=-83.72, lat=9.93),
    "worka": dict(country="Ethiopia", jp="エチオピア", place="Yirgacheffe, Gedeo", lon=38.22, lat=6.08),
    "shimaren": dict(country="Indonesia", jp="インドネシア", place="Karo, North Sumatra", lon=98.52, lat=2.92),
}
COFFEES = [
    dict(id="casablanca", lines=["Casablanca", "Blend"], jp="カサブランカ ブレンド", tone="#2D6A46", g=250, lots=["terrapreta", "cundinamarca", "aquiares"],
         notes=["Cocoa", "Hazelnut", "Citrus fruit"], notes_jp=["ココア", "ヘーゼルナッツ", "柑橘"], origin_jp="ブラジル、コロンビア、コスタリカ"),
    dict(id="pinkwhiskey", lines=["Colombia", "Pink Whiskey"], jp="コロンビア ピンクウイスキー", tone="#B2455F", g=200, lots=["monteblanco"],
         notes=["Red apple", "Rose", "Barrel sweetness"], notes_jp=["赤りんご", "バラ", "樽のような甘み"], origin_jp="コロンビア"),
    dict(id="rumbarrel", lines=["Colombia", "Rum Barrel"], jp="コロンビア ラムバレル", tone="#8A4E2B", g=200, lots=["laloma"],
         notes=["Dark rum", "Brown sugar", "Cacao"], notes_jp=["ダークラム", "黒糖", "カカオ"], origin_jp="コロンビア"),
    dict(id="yirgacheffe", lines=["Ethiopia", "Yirgacheffe"], jp="エチオピア イルガチェフェ", tone="#6A4C9C", g=200, lots=["worka"],
         notes=["Jasmine", "Bergamot", "Lemon"], notes_jp=["ジャスミン", "ベルガモット", "レモン"], origin_jp="エチオピア"),
    dict(id="strawberry", lines=["Sumatra", "Strawberry"], jp="スマトラ ストロベリー", tone="#17788A", g=200, lots=["shimaren"],
         notes=["Strawberry", "Red berries", "Sweet finish"], notes_jp=["いちご", "赤いベリー", "甘い余韻"], origin_jp="インドネシア"),
]

px = lambda lon: (lon + 180) * 5
py = lambda lat: (88 - lat) * 5
DOTS = "".join("M%d %dh0" % (i * 10 + 5, j * 10 + 5) for j, runs in enumerate(LAND) for a, b in runs for i in range(a, b + 1))

def mix(a, b, t):
    a, b = [int(a[i:i + 2], 16) for i in (1, 3, 5)], [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(round(x + (y - x) * t) for x, y in zip(a, b))

def map_svg(C):
    tone = C["tone"]; ox, oy = px(OSAKA[0]), py(OSAKA[1]); s = []
    s.append('<path d="%s" stroke="%s" stroke-width="6" stroke-linecap="round" fill="none"/>' % (DOTS, mix(BG, INK, 0.27)))
    lots = [LOTS[k] for k in C["lots"]]
    for L in lots:
        x, y = px(L["lon"]), py(L["lat"]); mx, my = (x + ox) / 2, min(y, oy) - abs(ox - x) * 0.16 - 20
        s.append('<path d="M%.1f %.1fQ%.1f %.1f %.1f %.1f" fill="none" stroke="%s" stroke-width="5" stroke-dasharray="12 10" stroke-linecap="round"/>' % (x, y, mx, my, ox, oy, tone))
    for L in lots:
        x, y = px(L["lon"]), py(L["lat"])
        s.append('<circle cx="%.1f" cy="%.1f" r="30" fill="%s"/><circle cx="%.1f" cy="%.1f" r="13" fill="%s" stroke="%s" stroke-width="5"/>' % (x, y, mix(BG, tone, 0.25), x, y, tone, BG))
    s.append('<circle cx="%.1f" cy="%.1f" r="30" fill="%s"/><circle cx="%.1f" cy="%.1f" r="13" fill="%s" stroke="%s" stroke-width="5"/>' % (ox, oy, mix(BG, INK, 0.15), ox, oy, INK, BG))
    def lab(x, y, a, b, anchor="start"):
        return ('<text x="%.1f" y="%.1f" text-anchor="%s" class="m1">%s</text><text x="%.1f" y="%.1f" text-anchor="%s" class="m2">%s</text>'
                % (x, y, anchor, html.escape(a), x, y + 44, anchor, html.escape(b)))
    if len(lots) == 1:
        L = lots[0]; x, y = px(L["lon"]), py(L["lat"])
        right = x < 1300
        s.append(lab(x + (42 if right else -42), y + 12, L["country"], L["jp"] + "  " + L["place"], "start" if right else "end"))
    else:   # the blend: one short label per country
        for L in lots:
            x, y = px(L["lon"]), py(L["lat"])
            if L["country"] == "Costa Rica": s.append(lab(x - 42, y - 10, "Costa Rica", "コスタリカ", "end"))
            elif L["country"] == "Colombia": s.append(lab(x + 42, y + 14, "Colombia", "コロンビア"))
            else: s.append(lab(x + 42, y + 14, L["country"], L["jp"]))
    s.append(lab(ox - 40, oy + 46, "Osaka roastery", "大阪で焙煎", "end"))
    return '<svg class="map" viewBox="0 120 1800 520" xmlns="http://www.w3.org/2000/svg">%s</svg>' % "".join(s)

CSS = """
@font-face { font-family: Lora; src: url('%s'); font-weight: 400 700; }
@page { margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Noto Sans CJK JP", sans-serif; color: %s; }
.sheet { position: relative; overflow: hidden; background: %s; }
.cut { position: absolute; border: 0.15mm dashed #E0007A; border-radius: 3mm; pointer-events: none; }
.safe { position: absolute; border: 0.15mm dotted #00A0E9; pointer-events: none; }
""" % (LORA, INK, BG)

def front(C, guides):
    W, H, B = 100, 125, 2   # trim mm, bleed mm
    logo = LOGO.replace("#2D6A46", C["tone"])
    logo_uri = "data:image/svg+xml;base64," + base64.b64encode(logo.encode()).decode()
    notes = " / ".join(C["notes"]); notes_jp = " ・ ".join(C["notes_jp"])
    g = ('<div class="cut" style="left:%smm;top:%smm;width:%smm;height:%smm"></div><div class="safe" style="left:%smm;top:%smm;width:%smm;height:%smm"></div>'
         % (B, B, W, H, B + 4, B + 4, W - 8, H - 8)) if guides else ""
    return """<!doctype html><html><head><meta charset="utf-8"><style>%s
.sheet { width:%smm; height:%smm; }
.in { position:absolute; left:%smm; top:%smm; width:%smm; height:%smm; padding:7mm 7mm 6mm; display:flex; flex-direction:column; }
.logo { width:52mm; display:block; }
.house { font-size:2.15mm; color:%s; margin-top:2.6mm; letter-spacing:0.02em; }
h1 { font-family: Lora, serif; font-weight:600; font-size:8.6mm; line-height:1.04; margin-top:5mm; letter-spacing:-0.01em; }
.jp { font-size:3.1mm; font-weight:500; margin-top:1.8mm; }
.roast { font-size:2.3mm; font-weight:700; color:%s; margin-top:1.3mm; }
.map { display:block; width:calc(100%% + 14mm); margin:3.2mm -7mm 0; height:auto; }
.map .m1 { font: 700 34px "Noto Sans CJK JP", sans-serif; fill:%s; paint-order:stroke; stroke:%s; stroke-width:10px; }
.map .m2 { font: 400 28px "Noto Sans CJK JP", sans-serif; fill:%s; paint-order:stroke; stroke:%s; stroke-width:10px; }
.notes { font-size:3.25mm; font-weight:500; margin-top:auto; }
.njp { font-size:2.2mm; color:%s; margin-top:1mm; }
.foot { display:flex; justify-content:space-between; align-items:baseline; margin-top:3.6mm; font-size:2.15mm; }
.foot b { font-weight:500; } .foot span { color:%s; }
</style></head><body><div class="sheet"><div class="in">
<img class="logo" src="%s" alt="Beju">
<p class="house">ベージュ コーヒー ロースターズ ・ 大阪</p>
<h1>%s</h1><p class="jp">%s</p><p class="roast">Medium roast ・ 中煎り</p>
%s
<p class="notes">%s</p><p class="njp">%s</p>
<div class="foot"><b>%d g ・ 内容量 %d g</b><span>bejucoffee.com</span></div>
</div>%s</div></body></html>""" % (CSS, W + 2 * B, H + 2 * B, B, B, W, H, MUTED, C["tone"], INK, BG, MUTED, BG, MUTED, MUTED, logo_uri,
        "<br>".join(html.escape(l) for l in C["lines"]), C["jp"], map_svg(C), html.escape(notes), notes_jp, C["g"], C["g"], g)

GRINDS = ["豆のまま", "細挽き（エスプレッソ）", "中細挽き（マキネッタ）", "中挽き（ドリップ）", "粗挽き（フレンチプレス）"]
def back(C, guides):
    W, H, B = 70, 92, 2
    rows = [("名称", "レギュラーコーヒー"),
            ("原材料名", "コーヒー豆（生豆生産国名：%s）" % C["origin_jp"]),
            ("内容量", "%dg" % C["g"]),
            ("賞味期限", '<span class="fill">　　　　年　　月　　日</span>'),
            ("焙煎度", "中煎り"),
            ("挽き方", "".join('<span class="ck">□ %s</span>' % x for x in GRINDS)),
            ("保存方法", "直射日光・高温多湿を避け、常温で保存してください。"),
            ("製造者", "%s<br>%s" % SELLER)]
    trs = "".join('<tr><th>%s</th><td>%s</td></tr>' % r for r in rows)
    g = ('<div class="cut" style="left:%smm;top:%smm;width:%smm;height:%smm"></div><div class="safe" style="left:%smm;top:%smm;width:%smm;height:%smm"></div>'
         % (B, B, W, H, B + 3, B + 3, W - 6, H - 6)) if guides else ""
    return """<!doctype html><html><head><meta charset="utf-8"><style>%s
.sheet { width:%smm; height:%smm; background:#FFFFFF; }
.in { position:absolute; left:%smm; top:%smm; width:%smm; height:%smm; padding:4.5mm 4.5mm 4mm; display:flex; flex-direction:column; }
.t { font-size:2.5mm; font-weight:700; display:flex; justify-content:space-between; align-items:baseline; }
.t span { font-family: Lora, serif; font-weight:600; font-size:3.3mm; color:%s; }
table { border-collapse: collapse; width:100%%; margin-top:1.8mm; font-size:2.05mm; line-height:1.45; }
th, td { border:0.2mm solid %s; padding:0.9mm 1.2mm; vertical-align:top; text-align:left; }
th { width:13mm; font-weight:700; white-space:nowrap; background:#F3EFE8; }
.ck { display:inline-block; margin-right:1.6mm; white-space:nowrap; }
.fill { display:inline-block; min-height:3.4mm; }
.n { font-size:1.9mm; color:%s; margin-top:1.6mm; line-height:1.5; }
.n b { color:%s; }
</style></head><body><div class="sheet"><div class="in">
<p class="t">一括表示 <span>%s</span></p>
<table>%s</table>
<p class="n">開封後はチャックをしっかり閉め、お早めにお召し上がりください。焙煎後に出るガスはバルブから抜けるため、袋がふくらんでも品質に問題はありません。</p>
<p class="n"><b>bejucoffee.com</b> ・ hello@bejucoffee.com</p>
</div>%s</div></body></html>""" % (CSS, W + 2 * B, H + 2 * B, B, B, W, H, C["tone"], INK, MUTED, INK, html.escape(" ".join(C["lines"])), trs, g)

if __name__ == "__main__":
    os.makedirs(os.path.join(OUT, "html"), exist_ok=True)
    jobs = []
    for C in COFFEES:
        for kind, fn, size in (("front", front, (104, 129)), ("back", back, (74, 96))):
            for guides in (False, True):
                name = "beju_label-%s_%s%s" % (kind, C["id"], "_guides" if guides else "")
                p = os.path.join(OUT, "html", name + ".html"); open(p, "w").write(fn(C, guides))
                jobs.append(dict(html=p, name=name, w=size[0], h=size[1], guides=guides))
    json.dump(jobs, open(os.path.join(OUT, "jobs.json"), "w"), indent=1)
    print(len(jobs), "labels written")
