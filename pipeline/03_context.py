"""OpenStreetMap context: the 24 quartiers, water, parks and woods.

Output: work/quartiers.parquet, work/water.parquet, work/green.parquet (EPSG:2169)
"""
import json
import sys
import time
from pathlib import Path

import geopandas as gpd
import osm2geojson
import requests

work = Path(sys.argv[1])
UA = {"User-Agent": "luxembourg-by-age/0.1 (data-workers.com)"}
BBOX = "49.55,6.06,49.67,6.22"
QUERIES = {
    "quartiers": 'area["name"="Luxembourg"]["admin_level"="8"]->.a;rel["boundary"="administrative"]["admin_level"="9"](area.a);',
    "water": f'(way["natural"="water"]({BBOX});rel["natural"="water"]({BBOX});way["waterway"~"river|stream|canal"]({BBOX});way["waterway"="riverbank"]({BBOX}););',
    "green": f'(way["leisure"~"park|garden"]({BBOX});rel["leisure"="park"]({BBOX});way["landuse"~"forest|grass|meadow|cemetery"]({BBOX});rel["landuse"="forest"]({BBOX});way["natural"="wood"]({BBOX});rel["natural"="wood"]({BBOX}););',
}

for name, q in QUERIES.items():
    p = work / f"osm_{name}.json"
    if not p.exists():
        for attempt in range(4):
            r = requests.post("https://overpass-api.de/api/interpreter",
                              data={"data": f"[out:json][timeout:240];{q}out geom;"}, headers=UA, timeout=300)
            if r.ok:
                p.write_text(r.text)
                break
            time.sleep(30)
        r.raise_for_status()
    fc = osm2geojson.json2geojson(json.loads(p.read_text()))
    g = gpd.GeoDataFrame.from_features(fc["features"], crs=4326)
    g["name"] = g["tags"].map(lambda t: (t or {}).get("name", ""))
    g["kind"] = g["tags"].map(lambda t: next((t[k] for k in ("waterway", "natural", "leisure", "landuse") if t and k in t), ""))
    g = g[["name", "kind", "geometry"]].to_crs(2169)
    if name == "water":
        # rivers here are narrow: draw waterway lines as 6-12 m ribbons
        lines = g.geom_type.str.contains("Line")
        g.loc[lines, "geometry"] = g[lines].apply(lambda r: r.geometry.buffer(6 if r.kind == "river" else 2.5), axis=1)
    g = g[g.geom_type.str.contains("Polygon")]
    print(name, len(g), g["kind"].value_counts().head(6).to_dict())
    g.to_parquet(work / f"{name}.parquet")
