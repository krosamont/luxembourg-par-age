"""Who occupies each building: ministries, state and city services, EU institutions, embassies,
radio, TV and press, banks, companies, schools and culture.

Sources: OpenStreetMap offices, government, diplomatic, amenity and studio tags, and Wikidata
organisations with coordinates in the city. Each one is placed in the footprint that contains
it (or the nearest within 15 m for OSM, 25 m for Wikidata, whose coordinates are rougher), and
the building takes the use of its most significant occupant.

Output: ../data/occupants.json  {building index: {"c": use, "o": [[name, use, website, ref], ...], "n": count}}
"""
import json
import re
import sys
import time
from pathlib import Path

import geopandas as gpd
import pandas as pd
import requests

work, data = Path(sys.argv[1]), Path(sys.argv[2])
UA = {"User-Agent": "luxembourg-by-age/0.1 (https://github.com/krosamont/luxembourg-par-age)"}

# most significant first: a building with a ministry and a canteen is a ministry building
USES = ["gov", "eu", "embassy", "media", "finance", "public", "company"]

OVERPASS = """[out:json][timeout:240];
area["name"="Luxembourg"]["admin_level"="8"]->.a;
(nwr["office"](area.a);nwr["government"](area.a);nwr["diplomatic"](area.a);nwr["studio"](area.a);
 nwr["amenity"~"^(townhall|courthouse|embassy|police|fire_station|studio|bank|post_office|library|university|college|school|hospital|clinic|theatre|arts_centre|community_centre|place_of_worship)$"](area.a);
 nwr["building"~"^(government|public|civic|office|commercial)$"]["name"](area.a);
 nwr["tourism"~"^(museum|hotel)$"](area.a););
out center tags;"""

SPARQL = """SELECT ?i ?iLabel ?kind ?c ?web WHERE {
 VALUES (?cls ?kind) { (wd:Q327333 "gov") (wd:Q192350 "gov") (wd:Q41487 "gov") (wd:Q3917681 "embassy")
   (wd:Q748720 "eu") (wd:Q484652 "eu") (wd:Q15265344 "media") (wd:Q14350 "media") (wd:Q1616075 "media")
   (wd:Q11032 "media") (wd:Q22687 "finance") (wd:Q4830453 "company") (wd:Q783794 "company") }
 SERVICE wikibase:around { ?i wdt:P625 ?c . bd:serviceParam wikibase:center "Point(6.1319 49.6116)"^^geo:wktLiteral ; wikibase:radius "7" . }
 ?i wdt:P31/wdt:P279* ?cls .
 OPTIONAL { ?i wdt:P856 ?web }
 SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en,lb,de" . }
}"""


def cached(name, fetch):
    p = work / name
    if not p.exists():
        p.write_text(json.dumps(fetch()))
    return json.loads(p.read_text())


def fetch_osm():
    for _ in range(4):
        r = requests.post("https://overpass-api.de/api/interpreter", data={"data": OVERPASS}, headers=UA, timeout=300)
        if r.ok:
            return r.json()
        time.sleep(30)
    r.raise_for_status()


def fetch_wd():
    r = requests.get("https://query.wikidata.org/sparql", params={"query": SPARQL, "format": "json"}, headers=UA, timeout=300)
    r.raise_for_status()
    return r.json()


RX = {
    # "Europe" alone is not enough: Ebay Europe or Société Européenne de Banque are companies
    "eu": re.compile(r"European (Commission|Parliament|Court|Investment|Union|Stability|School|Public Prosecutor|Schools)|"
                     r"(Commission|Cour|Parlement|Union|École|Ecole|Banque) européenne|Parlement européen|Parquet européen|"
                     r"Europa Experience|Maison de l'Europe|\bEU\b|\bUE\b|Court of Justice|Cour de justice|Curia|Eurostat|\bEIB\b|\bBEI\b|\bEIF\b|\bESM\b|"
                     r"Publications Office|Office des publications|Parlement|Parliament|Commission|Court of Auditors|"
                     r"Translation Centre|\bCdT\b|CHAFEA|procureur général européen|Konrad Adenauer|Jean Monnet|Robert Schuman|"
                     r"Bech building|Tower (Comenius|Montesquieu|Rocca)|Section Erasmus|\bOTAN\b|\bNATO\b|NSPA|United Nations|UNICEF", re.I),
    "embassy": re.compile(r"Ambassade|Ambassage|Embassy|Botschaft|Consulat|Consulate|Consul\b|Consul général|Chancellerie consulaire", re.I),
    "media": re.compile(r"\bRTL\b|\bRadio\b|Télévision|\bTele\b|\bTV\b|Luxemburger Wort|Tageblatt|Paperjam|eldoradio|100,7|Quotidien|Reporter\.lu|"
                        r"Journal\b|Lëtzebuerger Journal|Editpress|Mediahuis|Saint-Paul Luxembourg", re.I),
    "gov": re.compile(r"Minist|Administration|^Service|Ville de Luxembourg|Chambre des Députés|Conseil d'[ÉE]tat|^Cour\b|Cour des Comptes|"
                      r"Tribunal|Parquet|Police|CGDIS|incendie et de secours|Palais grand-ducal|Maréchalat|Banque centrale|STATEC|CTIE|"
                      r"Caisse nationale|\bCNS\b|\bCSSF\b|Gouvernement|\bÉtat\b|\bEtat\b|Archives nationales|Bibliothèque nationale|"
                      r"Musée national|Hôtel de Ville|Cité judiciaire|Ponts et Chaussées|Douanes|Contributions|Cadastre", re.I),
    "finance": re.compile(r"Bank|Banque|Spuerkeess|\bBCEE\b|\bBGL\b|Clearstream|\bFund|Fonds|Capital|Invest|Assurance|Insurance|"
                          r"Raiffeisen|\bING\b|Quintet|\bBIL\b|Deloitte|KPMG|PwC|\bEY\b|Ernst & Young|Arendt|Elvinger|Allen & Overy|"
                          r"Securities|Asset Management|Wealth|Fiduciaire|Trust\b", re.I),
}
PUBLIC_AMENITY = {"school", "university", "college", "hospital", "clinic", "library", "theatre", "arts_centre",
                  "community_centre", "place_of_worship", "post_office"}
GOV_AMENITY = {"townhall", "courthouse", "police", "fire_station"}
FINANCE_OFFICE = {"financial", "bank", "insurance", "financial_advisor", "accountant", "tax_advisor"}
MEDIA_OFFICE = {"newspaper", "media", "radio", "television", "publisher"}


def by_name(name):
    for use in ("eu", "embassy", "media", "gov", "finance"):
        if RX[use].search(name):
            return use
    return None


# state bodies whatever their OSM office tag says (the central bank is tagged office=financial)
STATE = re.compile(r"Banque centrale|\bCSSF\b|STATEC|^Minist|Chambre des Députés|Conseil d'[ÉE]tat|Palais grand.ducal|Maréchalat|"
                   r"Cour des Comptes|Commissariat aux assurances", re.I)


def classify_osm(t):
    name = t.get("name") or t.get("operator") or ""
    office, amenity = t.get("office"), t.get("amenity")
    if STATE.search(name):
        return "gov"
    if office == "diplomatic" or amenity == "embassy" or "diplomatic" in t:
        return "embassy"
    if RX["eu"].search(name) or office in ("international_organization", "intergovernmental"):
        return "eu"
    if "studio" in t or amenity == "studio" or office in MEDIA_OFFICE or RX["media"].search(name):
        return "media"
    if office == "government" or "government" in t or amenity in GOV_AMENITY or t.get("building") == "government":
        return "gov"
    if amenity == "bank" or office in FINANCE_OFFICE:
        return "finance"
    if amenity in PUBLIC_AMENITY or t.get("tourism") == "museum" or t.get("building") in ("public", "civic"):
        return by_name(name) if by_name(name) in ("gov", "eu") else "public"
    return by_name(name) or "company"


rows = []
for e in cached("osm_occupants.json", fetch_osm)["elements"]:
    t = e.get("tags", {})
    name = t.get("name") or t.get("operator")
    lat, lon = (e["lat"], e["lon"]) if "lat" in e else (e["center"]["lat"], e["center"]["lon"]) if "center" in e else (None, None)
    if not name or lat is None:
        continue
    rows.append(dict(name=name.strip(), use=classify_osm(t), web=t.get("website") or t.get("contact:website") or "",
                     ref=f"{e['type']}/{e['id']}", lon=lon, lat=lat, src="osm"))

for x in cached("wd_orgs.json", fetch_wd)["results"]["bindings"]:
    name = x["iLabel"]["value"]
    if re.fullmatch(r"Q\d+", name):
        continue
    lon, lat = map(float, re.findall(r"[-\d.]+", x["c"]["value"]))
    kind = x["kind"]["value"]
    use = "gov" if STATE.search(name) else kind if kind != "company" else (by_name(name) or "company")
    rows.append(dict(name=name, use=use, web=x.get("web", {}).get("value", ""),
                     ref=x["i"]["value"].rsplit("/", 1)[1], lon=lon, lat=lat, src="wikidata"))
occ = pd.DataFrame(rows)
print("occupants", len(occ), occ["use"].value_counts().to_dict())

b = gpd.read_parquet(work / "buildings.parquet")
meta = json.loads((data / "meta.json").read_text())
assert meta["count"] == len(b), "04_build.py dropped footprints: indices would not line up"

pts = gpd.GeoDataFrame(occ, geometry=gpd.points_from_xy(occ.lon, occ.lat), crs=4326).to_crs(2169)
parts = []
for src, dist in (("osm", 15), ("wikidata", 12)):
    p = pts[pts.src == src]
    j = gpd.sjoin_nearest(p, b[["geometry"]], max_distance=dist, distance_col="d")
    parts.append(j[~j.index.duplicated()])
j = pd.concat(parts)
print("placed in a building", len(j), "of", len(occ))

out = {}
rank = {u: k for k, u in enumerate(USES)}
for i, g in j.groupby("index_right"):
    g = g.assign(r=g["use"].map(rank)).sort_values(["r", "src", "name"])  # OSM first: its names and websites are more specific
    seen, items = set(), []
    for _, r in g.iterrows():
        key = re.sub(r"\W", "", r["name"].lower())
        if key in seen:
            continue
        seen.add(key)
        items.append([r["name"], r["use"], r["web"], r["ref"]])
    out[int(i)] = {"c": items[0][1], "o": items[:12], "n": len(items)}

(data / "occupants.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print("buildings with occupants", len(out), pd.Series([v["c"] for v in out.values()]).value_counts().to_dict(),
      "| size", (data / "occupants.json").stat().st_size // 1024, "KB")
