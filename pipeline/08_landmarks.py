"""Hand-written stories and photos for landmark buildings: the state, the EU institutions,
the main employers, the station, the Grund (landmarks.json, in English, French and Luxembourgish).

Each entry is placed on its footprint by the OpenStreetMap ref of an occupant (from 06_occupants.py),
by a Wikidata item already dated in 02_evidence.py, or by coordinates. The photo is the named
Commons file, else the image of the Wikipedia article's Wikidata item. "area": true marks a photo
of the surroundings, when Commons has none of the building itself.

Output: ../data/landmarks.json  {building index: {title, story, photo, area, links}}
"""
import html
import json
import re
import sys
from pathlib import Path

import geopandas as gpd
import requests

here = Path(__file__).parent
work, data = Path(sys.argv[1]), Path(sys.argv[2])
UA = {"User-Agent": "luxembourg-by-age/0.1 (https://github.com/krosamont/luxembourg-par-age)"}
LANGS = ("en", "fr", "lb")


def api(url, **params):
    for _ in range(4):
        r = requests.get(url, params={"format": "json", **params}, headers=UA, timeout=120)
        if r.ok and r.text.startswith("{"):
            return r.json()
        import time
        time.sleep(8)
    r.raise_for_status()


def strip(s):
    s = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()
    w = s.split(" ")
    if len(w) % 2 == 0 and w[: len(w) // 2] == w[len(w) // 2:]:
        s = " ".join(w[: len(w) // 2])
    return s


def photo_info(file):
    res = api("https://commons.wikimedia.org/w/api.php", action="query", titles=f"File:{file}",
              prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=800)
    page = next(iter(res["query"]["pages"].values()))
    if "imageinfo" not in page:
        return None
    ii, md = page["imageinfo"][0], page["imageinfo"][0].get("extmetadata", {})
    return {"thumb": (ii.get("thumburl") or ii["url"]).split("?")[0], "page": ii["descriptionurl"],
            "artist": strip(md.get("Artist", {}).get("value"))[:120] or "Unknown",
            "licence": strip(md.get("LicenseShortName", {}).get("value")) or "see file page",
            "licenceUrl": md.get("LicenseUrl", {}).get("value", "")}


def wiki_item(title):
    res = api("https://en.wikipedia.org/w/api.php", action="query", titles=title, redirects=1, prop="pageprops", ppprop="wikibase_item")
    q = next(iter(res["query"]["pages"].values())).get("pageprops", {}).get("wikibase_item")
    if not q:
        return None, {}
    e = api("https://www.wikidata.org/w/api.php", action="wbgetentities", ids=q, props="claims|sitelinks/urls",
            sitefilter="|".join(f"{l}wiki" for l in LANGS))["entities"][q]
    p18 = e.get("claims", {}).get("P18")
    links = {l: {"url": s["url"], "title": s["title"]} for l in LANGS if (s := e.get("sitelinks", {}).get(f"{l}wiki"))}
    return (p18[0]["mainsnak"]["datavalue"]["value"] if p18 else None), {"qid": q, **links}


landmarks = json.loads((here / "landmarks.json").read_text())
occ = json.loads((data / "occupants.json").read_text())
meta = json.loads((data / "meta.json").read_text())
ref_to_b = {o[3]: int(k) for k, v in occ.items() for o in v["o"]}
q_to_b = {v: int(k) for k, v in meta["refs"].items() if v.startswith("Q")}
b = gpd.read_parquet(work / "buildings.parquet")

out, missing = {}, []
for lm in landmarks:
    m = lm["match"]
    if "ref" in m:
        i = ref_to_b.get(m["ref"])
    elif "wikidata" in m:
        i = q_to_b.get(m["wikidata"])
    else:
        p = gpd.GeoSeries(gpd.points_from_xy([m["lonlat"][0]], [m["lonlat"][1]]), crs=4326).to_crs(2169)
        j = gpd.sjoin_nearest(gpd.GeoDataFrame(geometry=p), b[["geometry"]], max_distance=30)
        i = int(j["index_right"].iloc[0]) if len(j) else None
    if i is None:
        missing.append(lm["title"]["en"])
        continue
    p18, links = wiki_item(lm["wiki"]) if lm.get("wiki") else (None, {})
    file = lm.get("photo") or p18
    photo = photo_info(file) if file else None
    if photo:
        photo["area"] = bool(lm.get("area"))
    if i in out:  # two entries on one footprint: keep the first, it is the more specific
        continue
    out[i] = {"title": lm["title"], "story": lm["story"], "photo": photo, "links": links}
    print(i, "|", lm["title"]["en"], "|", file if photo else "NO PHOTO", "| area" if lm.get("area") else "")

(data / "landmarks.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print("landmarks placed:", len(out), "| with photo:", sum(bool(v["photo"]) for v in out.values()), "| not placed:", missing)
