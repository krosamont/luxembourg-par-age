"""Photos for buildings with known occupants, from Wikimedia Commons.

Every building of the EU institutions must have one, so for those the script tries, in order:
  1. the occupant's OpenStreetMap tags: wikimedia_commons, image (on Commons), wikidata
  2. the image (P18) of the occupant's Wikidata item
  3. a Commons search on the occupant's name and "Luxembourg"
  4. the nearest geotagged Commons photo within 150 m of the building
Other uses only get a photo from 1 and 2, which name the building itself; a search could
return a photo of something else.

Choices that a search gets wrong can be pinned in photo_overrides.json ({building index: "File name.jpg"}).

Output: adds "p" (thumb, page, artist, licence, licenceUrl) to entries of ../data/occupants.json
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
SEARCH_USES = set()  # searches picked wrong photos; EU buildings get checked ones from landmarks.json
COMMONS = "https://commons.wikimedia.org/w/api.php"


def api(url, **params):
    r = requests.get(url, params={"format": "json", **params}, headers=UA, timeout=120)
    r.raise_for_status()
    return r.json()


occ = json.loads((data / "occupants.json").read_text())
osm_tags = {f"{e['type']}/{e['id']}": e.get("tags", {}) for e in json.loads((work / "osm_occupants.json").read_text())["elements"]}
overrides = json.loads((here / "photo_overrides.json").read_text()) if (here / "photo_overrides.json").exists() else {}

b = gpd.read_parquet(work / "buildings.parquet")
centre = gpd.GeoSeries(b.representative_point(), crs=2169).to_crs(4326)

p18_cache = {}


def p18(qid):
    if qid not in p18_cache:
        e = api("https://www.wikidata.org/w/api.php", action="wbgetclaims", entity=qid, property="P18")
        c = e.get("claims", {}).get("P18")
        p18_cache[qid] = c[0]["mainsnak"]["datavalue"]["value"] if c else None
    return p18_cache[qid]


def from_tags(ref):
    t = osm_tags.get(ref, {})
    wc = t.get("wikimedia_commons", "")
    if wc.startswith("File:"):
        return wc[5:]
    img = t.get("image", "")
    m = re.search(r"commons\.wikimedia\.org/wiki/File:(.+)$", img) or re.search(r"upload\.wikimedia\.org/.+/([^/]+\.(?:jpe?g|png))$", img, re.I)
    if m:
        return requests.utils.unquote(m.group(1)).replace("_", " ")
    if t.get("wikidata"):
        return p18(t["wikidata"])
    return None


IMAGE = re.compile(r"\.(jpe?g|png|webp|tiff?)$", re.I)
SKIP = re.compile(r"logo|map|plan|carte|karte|flag|drapeau|coat of arms|wappen|signature|diagram|\.svg", re.I)


def search(name):
    q = re.sub(r"[()\[\]:]", " ", name)
    res = api(COMMONS, action="query", list="search", srnamespace=6, srlimit=10, srsearch=f"{q} Luxembourg")
    for h in res["query"]["search"]:
        title = h["title"][5:]
        if IMAGE.search(title) and not SKIP.search(title):
            return title
    return None


def nearby(lon, lat):
    res = api(COMMONS, action="query", list="geosearch", gsnamespace=6, gsradius=150, gslimit=20, gscoord=f"{lat}|{lon}")
    for h in res["query"]["geosearch"]:
        title = h["title"][5:]
        if IMAGE.search(title) and not SKIP.search(title):
            return title
    return None


def strip(s):
    s = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s or ""))).strip()
    w = s.split(" ")
    if len(w) % 2 == 0 and w[: len(w) // 2] == w[len(w) // 2:]:
        s = " ".join(w[: len(w) // 2])
    return s


def info(file):
    res = api(COMMONS, action="query", titles=f"File:{file}", prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=800)
    page = next(iter(res["query"]["pages"].values()))
    if "imageinfo" not in page:
        return None
    ii = page["imageinfo"][0]
    md = ii.get("extmetadata", {})
    return {
        "thumb": (ii.get("thumburl") or ii["url"]).split("?")[0],
        "page": ii["descriptionurl"],
        "artist": strip(md.get("Artist", {}).get("value"))[:120] or "Unknown",
        "licence": strip(md.get("LicenseShortName", {}).get("value")) or "see file page",
        "licenceUrl": md.get("LicenseUrl", {}).get("value", ""),
    }


report = []
for k, v in occ.items():
    v.pop("p", None)
    eu = v["c"] in SEARCH_USES
    file, how = overrides.get(k), "override"
    for name, use, web, ref in ([] if file else v["o"]):
        file = from_tags(ref) if "/" in ref else p18(ref)
        if file:
            how = "osm tags" if "/" in ref else "wikidata"
            break
    if not file and eu:
        for name, *_ in v["o"]:
            file = search(name)
            if file:
                how = f"search “{name}”"
                break
    if not file and eu:
        c = centre.iloc[int(k)]
        file, how = nearby(c.x, c.y), "nearby"
    if file:
        p = info(file)
        if p:
            v["p"] = p
    if eu:
        report.append((k, v["o"][0][0], how if v.get("p") else "NONE", file))

(data / "occupants.json").write_text(json.dumps(occ, ensure_ascii=False, separators=(",", ":")))
for r in report:
    print(*r, sep=" | ")
print("EU buildings with photo:", sum(r[2] != "NONE" for r in report), "/", len(report),
      "| all buildings with occupant photo:", sum("p" in v for v in occ.values()))
