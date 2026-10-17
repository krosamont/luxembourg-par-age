"""Photos and source links for the story chapters and the documented buildings.

Chapter topics come from story_topics.json (English Wikipedia titles). Each title is resolved
to its Wikidata item; the item gives the image (P18, hosted on Wikimedia Commons) and the
Wikipedia articles in English, French and Luxembourgish. Buildings dated from Wikidata
(refs in data/meta.json) get the same treatment.

Output: ../data/media.json
"""
import html
import json
import re
import sys
from pathlib import Path

import requests

here = Path(__file__).parent
data = Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent / "data"
UA = {"User-Agent": "luxembourg-by-age/0.1 (https://github.com/krosamont/luxembourg-par-age)"}
LANGS = ("en", "fr", "lb")


def chunks(xs, n):
    xs = list(xs)
    for i in range(0, len(xs), n):
        yield xs[i:i + n]


def api(url, **params):
    r = requests.get(url, params={"format": "json", **params}, headers=UA, timeout=120)
    r.raise_for_status()
    return r.json()


topics = json.loads((here / "story_topics.json").read_text())
groups = [topics["intro"]] + topics["chapters"]
titles = sorted({t for g in groups for t in [g["photo"], *g["links"]]})

# English Wikipedia title -> Wikidata item
title_qid = {}
for batch in chunks(titles, 40):
    res = api("https://en.wikipedia.org/w/api.php", action="query", titles="|".join(batch),
              redirects=1, prop="pageprops", ppprop="wikibase_item")["query"]
    alias = {}
    for k in ("normalized", "redirects"):
        for m in res.get(k, []):
            alias[m["from"]] = m["to"]
    by_title = {p["title"]: p.get("pageprops", {}).get("wikibase_item") for p in res["pages"].values()}
    for t in batch:
        final = t
        while final in alias:
            final = alias[final]
        title_qid[t] = by_title.get(final)
missing = [t for t, q in title_qid.items() if not q]
if missing:
    print("NOT FOUND on en.wikipedia:", missing)

meta = json.loads((data / "meta.json").read_text())
item_qids = sorted({r for r in meta["refs"].values() if r.startswith("Q")})
qids = sorted({q for q in title_qid.values() if q} | set(item_qids))

entities = {}
for batch in chunks(qids, 50):
    res = api("https://www.wikidata.org/w/api.php", action="wbgetentities", ids="|".join(batch),
              props="claims|sitelinks/urls|labels", languages="|".join(LANGS), sitefilter="|".join(f"{l}wiki" for l in LANGS))
    entities.update(res["entities"])

files = {}
for q, e in entities.items():
    p18 = e.get("claims", {}).get("P18")
    if p18:
        files[q] = p18[0]["mainsnak"]["datavalue"]["value"]


def strip(s):
    s = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()
    w = s.split(" ")
    if len(w) % 2 == 0 and w[: len(w) // 2] == w[len(w) // 2:]:  # Commons often repeats "Unknown author"
        s = " ".join(w[: len(w) // 2])
    return s


photos = {}
for batch in chunks(sorted(set(files.values())), 40):
    res = api("https://commons.wikimedia.org/w/api.php", action="query", titles="|".join("File:" + f for f in batch),
              prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=800)["query"]
    norm = {m["to"]: m["from"] for m in res.get("normalized", [])}
    for p in res["pages"].values():
        if "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]
        md = ii.get("extmetadata", {})
        name = norm.get(p["title"], p["title"]).removeprefix("File:")
        photos[name] = {
            "thumb": (ii.get("thumburl") or ii["url"]).split("?")[0],
            "page": ii["descriptionurl"],
            "artist": strip(md.get("Artist", {}).get("value"))[:120] or "Unknown",
            "licence": strip(md.get("LicenseShortName", {}).get("value")) or "see file page",
            "licenceUrl": md.get("LicenseUrl", {}).get("value", ""),
        }


def item(q):
    e = entities.get(q, {})
    return {
        "qid": q,
        # the article title reads better than the Wikidata label, and matches the page it opens
        "label": {l: e.get("sitelinks", {}).get(f"{l}wiki", {}).get("title") or e.get("labels", {}).get(l, {}).get("value") for l in LANGS},
        "wiki": {l: e.get("sitelinks", {}).get(f"{l}wiki", {}).get("url") for l in LANGS},
        "photo": photos.get(files.get(q, "").replace("_", " ")) or photos.get(files.get(q, "")),
    }


def group(g):
    p = item(title_qid[g["photo"]]) if title_qid.get(g["photo"]) else {}
    found = list(dict.fromkeys(title_qid[t] for t in g["links"] if title_qid.get(t)))  # redirects can repeat an item
    links = [item(q) for q in found]
    return {"photo": p.get("photo"), "links": [{"label": l["label"], "wiki": l["wiki"], "qid": l["qid"]} for l in links]}


out = {
    "intro": group(topics["intro"]),
    "chapters": [group(g) for g in topics["chapters"]],
    "items": {q: item(q) for q in item_qids},
}
(data / "media.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print("chapters with photo:", sum(bool(c["photo"]) for c in out["chapters"]), "/", len(out["chapters"]),
      "| buildings with photo:", sum(bool(i["photo"]) for i in out["items"].values()), "/", len(item_qids),
      "| lb links:", sum(bool(l["wiki"]["lb"]) for c in out["chapters"] for l in c["links"]))
