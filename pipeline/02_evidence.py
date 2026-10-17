"""Collect every piece of dating evidence for the 2023 footprints.

  - Wikidata: inception (P571) or official opening (P1619) of built structures with coordinates
  - OpenStreetMap: start_date / building:year / construction_date on buildings
  - Construction period layer (geoportail.lu collection 2214, Aménagement du territoire):
    < 1999, 1999-2004, 2004-2006, 2006-2010, 2010-2013, 2013-2015, 2015-2018
  - ACT 2013 LOD1 survey: a 2023 footprint it does not cover was built after 2013
  - Protected monuments (collections 709/0 and 709/1) and PAG "constructions à conserver"
    (698/25): flags only, neither register gives a construction date

Output: work/evidence.parquet, one row per 2023 footprint (same index as buildings.parquet)
"""
import re
import sys
import json
import time
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import requests
from shapely.geometry import Polygon

work, lod1_path = Path(sys.argv[1]), Path(sys.argv[2])
UA = {"User-Agent": "luxembourg-by-age/0.1 (data-workers.com)"}
b = gpd.read_parquet(work / "buildings.parquet")
b_wgs = b.to_crs(4326)


def cached(name, fetch):
    p = work / name
    if not p.exists():
        p.write_text(json.dumps(fetch()))
    return json.loads(p.read_text())


def parse_year(s):
    m = re.match(r"^\s*(?:c\.?|~|ca\.?)?\s*(\d{3,4})", str(s))
    return int(m.group(1)) if m else None


# ---- Wikidata
SPARQL = """
SELECT ?i ?iLabel ?d ?prop ?c WHERE {
  SERVICE wikibase:around { ?i wdt:P625 ?c . bd:serviceParam wikibase:center "Point(6.1319 49.6116)"^^geo:wktLiteral ; wikibase:radius "8" . }
  { ?i wdt:P571 ?d . BIND("inception" AS ?prop) } UNION { ?i wdt:P1619 ?d . BIND("opening" AS ?prop) }
  ?i wdt:P31/wdt:P279* wd:Q811979 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,lb,de,en" . }
}"""


def fetch_wd():
    r = requests.get("https://query.wikidata.org/sparql", params={"query": SPARQL, "format": "json"},
                     headers=UA, timeout=300)
    r.raise_for_status()
    return r.json()["results"]["bindings"]


wd = []
for row in cached("wikidata.json", fetch_wd):
    lon, lat = map(float, re.findall(r"[-\d.]+", row["c"]["value"]))
    y = parse_year(row["d"]["value"].lstrip("+"))
    if y:
        wd.append(dict(qid=row["i"]["value"].rsplit("/", 1)[1], name=row["iLabel"]["value"],
                       year=y, prop=row["prop"]["value"], lon=lon, lat=lat))
wd = pd.DataFrame(wd).sort_values("year").drop_duplicates("qid")  # earliest date per item
print("wikidata items", len(wd))

# ---- OpenStreetMap
OVERPASS = """[out:json][timeout:180];
area["name"="Luxembourg"]["admin_level"="8"]->.a;
(way["building"]["start_date"](area.a);way["building"]["building:year"](area.a);
 way["building"]["construction_date"](area.a);relation["building"]["start_date"](area.a););
out center tags;"""


def fetch_osm():
    for _ in range(3):
        r = requests.post("https://overpass-api.de/api/interpreter", data={"data": OVERPASS}, headers=UA, timeout=300)
        if r.ok:
            return r.json()["elements"]
        time.sleep(20)
    r.raise_for_status()


osm = []
for e in cached("osm_dates.json", fetch_osm):
    t = e.get("tags", {})
    y = parse_year(t.get("start_date") or t.get("building:year") or t.get("construction_date"))
    if y and "center" in e:
        osm.append(dict(osm_id=f"{e['type']}/{e['id']}", name=t.get("name"), year=y,
                        lon=e["center"]["lon"], lat=e["center"]["lat"]))
osm = pd.DataFrame(osm)
print("osm dated buildings", len(osm))


def attach(points, label):
    """Footprint index for each point: containing footprint, else nearest within 20 m."""
    g = gpd.GeoDataFrame(points, geometry=gpd.points_from_xy(points.lon, points.lat), crs=4326).to_crs(2169)
    j = gpd.sjoin_nearest(g, b[["geometry"]], max_distance=20, distance_col="dist")
    j = j[~j.index.duplicated()]
    print(label, "matched", len(j), "of", len(points))
    return j


ev = pd.DataFrame(index=b.index)
ev["year"] = pd.NA
ev["src"] = ""
ev["name"] = ""
ev["ref"] = ""

# OSM first, Wikidata overrides: a Wikidata date is tied to a cited item
for j, src, refcol in ((attach(osm, "osm"), "osm", "osm_id"), (attach(wd, "wikidata"), "wikidata", "qid")):
    # one point per footprint: the earliest date wins (a later opening date is often a renovation)
    j = j.sort_values("year").drop_duplicates("index_right")
    ev.loc[j.index_right, "year"] = j["year"].values
    ev.loc[j.index_right, "src"] = src
    ev.loc[j.index_right, "ref"] = j[refcol].values
    names = j["name"].fillna("").values
    ev.loc[j.index_right, "name"] = names

# ---- geoportail.lu OGC API Features
BBOX = "6.06,49.55,6.22,49.67"


def fetch_collection(cid):
    feats, offset = [], 0
    while True:
        r = requests.get(f"https://features.geoportail.lu/collections/{cid}/items",
                         params={"f": "json", "bbox": BBOX, "limit": 5000, "offset": offset}, headers=UA, timeout=300)
        r.raise_for_status()
        page = r.json()["features"]  # the server caps pages below the requested limit
        feats += page
        if not page:
            return {"type": "FeatureCollection", "features": feats}
        offset += len(page)


def collection(cid):
    fc = cached(f"geoportail_{cid.replace('/', '_')}.json", lambda: fetch_collection(cid))
    if not fc["features"]:
        return gpd.GeoDataFrame(geometry=[], crs=2169)
    return gpd.GeoDataFrame.from_features(fc["features"], crs=4326).to_crs(2169)


cent = gpd.GeoDataFrame(geometry=b.representative_point(), crs=2169)


def flag(gdf):
    out = pd.Series(False, index=b.index)
    if len(gdf):
        out.loc[gpd.sjoin(cent, gdf[["geometry"]], predicate="within").index.unique()] = True
    return out


per = collection("2214")
print("period polygons", len(per), per["period_label"].value_counts().to_dict())
jp = gpd.sjoin(cent, per[["geometry", "datum", "period_label"]], predicate="within")
jp = jp[~jp.index.duplicated()]
ev["period"] = ""
ev.loc[jp.index, "period"] = jp["period_label"].str.replace("&lt", "<").str.replace(" ", "").values

ev["monument"] = flag(pd.concat([collection("709/0"), collection("709/1")]))
ev["conserve"] = flag(collection("698/25"))
print("monuments", ev["monument"].sum(), "PAG à conserver", ev["conserve"].sum())


# ---- ACT 2013 LOD1
def lod1_polys(path):
    """Roof ring of each LOD1 block (the ring at the top z)."""
    rx = re.compile(r"<gml:posList[^>]*>([^<]+)<")
    polys, rings = [], []
    with open(path, encoding="utf-8") as f:
        for line in f:
            if "<bldg:Building" in line:
                rings = []
            elif "posList" in line:
                rings.append(np.array(rx.search(line).group(1).split(), dtype=float).reshape(-1, 3))
            elif "</bldg:Building>" in line and rings:
                top = max(rings, key=lambda r: (np.ptp(r[:, 2]) == 0) * r[0, 2])
                if len(top) >= 4:
                    polys.append(Polygon(top[:, :2]).buffer(0))
    return gpd.GeoDataFrame(geometry=polys, crs=2169)


s2013 = lod1_polys(lod1_path)
inter = gpd.overlay(b[["geometry"]].reset_index(), s2013, how="intersection", keep_geom_type=True)
a = inter.assign(a=inter.area).groupby("index")["a"].sum()
ev["cov2013"] = (a / b.area).reindex(b.index).fillna(0).clip(0, 1).round(3)
print("LOD1 2013 blocks", len(s2013))

ev.to_parquet(work / "evidence.parquet")
print(ev["period"].value_counts().to_dict())
print(pd.crosstab(ev["period"], ev["cov2013"] < 0.3))
