"""Give every footprint a year and write the browser files.

Year, in order of trust:
  0 Wikidata    inception / opening of the item located in the footprint
  1 OSM         start_date tag
  2 period      geoportail.lu construction period layer, 1999 to 2021 (year spread inside the range)
  3 survey      not in ACT 2013 LOD1 nor in the period layer: built 2013-2023
  4 estimate    pre-1999 (or undated) stock: quartier era shares from priors.json, assigned in
                order of an age score (protected monument first, then low and small before tall
                and large, smoothed over 60 m so blocks stay coherent)

Output: ../data/buildings.bin, ../data/context.json, ../data/meta.json
"""
import json
import struct
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
from shapely.geometry import MultiPolygon, Polygon

work, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
here = Path(__file__).parent
priors = json.loads((here / "priors.json").read_text())

b = gpd.read_parquet(work / "buildings.parquet")
ev = pd.read_parquet(work / "evidence.parquet")
q = gpd.read_parquet(work / "quartiers.parquet")
b = b.join(ev)
b["height"] = b["height"].fillna(b["height"].median()).clip(2, 200)

pts = gpd.GeoDataFrame(geometry=b.representative_point(), crs=2169)
jq = gpd.sjoin(pts, q[["name", "geometry"]], predicate="within")
jq = jq[~jq.index.duplicated()]
b["quartier"] = jq["name"].reindex(b.index).fillna("")
qnames = sorted(priors["quartiers"])
b.loc[~b["quartier"].isin(qnames), "quartier"] = "Ville-Haute"  # footprints on the boundary
print(b["quartier"].value_counts().to_dict())


def h01(idx, salt):
    """Deterministic pseudo-random in [0, 1) per building."""
    x = (np.asarray(idx, dtype=np.uint64) * np.uint64(2654435761) + np.uint64(salt)) % np.uint64(1 << 32)
    x ^= x >> np.uint64(13)
    x = (x * np.uint64(1274126177)) % np.uint64(1 << 32)
    return (x % np.uint64(10007)).astype(float) / 10007


n = len(b)
year = np.zeros(n, dtype=int)
lo = np.zeros(n, dtype=int)
hi = np.zeros(n, dtype=int)
src = np.full(n, 4, dtype=int)
u = h01(np.arange(n), 7)

# 0/1 documented
doc = b["year"].notna().values
src[doc & (b["src"] == "wikidata").values] = 0
src[doc & (b["src"] == "osm").values] = 1
year[doc] = b.loc[doc, "year"].astype(int).values
lo[doc] = hi[doc] = year[doc]

# 2 period layer
per = b["period"].values
rng = {p: tuple(map(int, p.split("-"))) for p in set(per) if p[:2] in ("19", "20")}
for p, (a, z) in rng.items():
    m = (per == p) & ~doc
    src[m], lo[m], hi[m] = 2, a, z
    year[m] = a + np.floor(u[m] * (z - a + 1)).astype(int).clip(0, z - a)

# 3 survey gap
# small sheds are often missing from the 2013 LOD1, so their absence proves nothing
gap = ~doc & ~np.isin(per, list(rng)) & (b["cov2013"].values < 0.3) & (b.area.values >= 60)
a_gap = np.where(per == "", 2021, 2014)
src[gap], lo[gap], hi[gap] = 3, a_gap[gap], 2023
year[gap] = (a_gap + np.floor(u * (2023 - a_gap + 1))).astype(int)[gap]

# 4 estimate
est = src == 4
h = b["height"].values
area = b.area.values
score = np.where(h < 4.5, 11.0, h) + 3 * np.log10(np.maximum(area, 20))  # sheds and garages sit mid-range
xy = np.c_[pts.geometry.x.values, pts.geometry.y.values]
tree = cKDTree(xy[est])
nb = tree.query_ball_point(xy[est], r=60)
s_est = score[est]
smooth = np.array([s_est[i].mean() for i in nb]) * 0.6 + s_est * 0.4
smooth = smooth + (u[est] - 0.5) * 2.0  # break ties so a block is not one single year
smooth[b["monument"].values[est]] -= 100
score_full = np.full(n, np.nan)
score_full[est] = smooth
bins = np.array(priors["bins"])
for name in qnames:
    m = est & (b["quartier"].values == name)
    if not m.any():
        continue
    w = np.array(priors["quartiers"][name], dtype=float)
    cdf = np.cumsum(w / w.sum())
    r = pd.Series(score_full[m]).rank(method="first").values
    qq = (r - 0.5) / m.sum()
    k = np.searchsorted(cdf, qq).clip(0, len(w) - 1)
    start = np.r_[0, cdf][k]
    frac = ((qq - start) / np.maximum(w[k] / w.sum(), 1e-9)).clip(0, 0.999)
    a, z = bins[k, 0], bins[k, 1]
    lo[m], hi[m] = a, z
    year[m] = (a + frac * (z - a + 1)).astype(int)

print(pd.Series(src).value_counts().sort_index().to_dict())
print(pd.Series(pd.cut(year, [0, 1814, 1866, 1918, 1945, 1970, 1998, 2010, 2030])).value_counts().sort_index().to_dict())

# ---- geometry: largest exterior ring, simplified, in 0.25 m units around the commune centre
minx, miny, maxx, maxy = b.total_bounds
ox, oy = round((minx + maxx) / 2), round((miny + maxy) / 2)
origin = gpd.GeoSeries(gpd.points_from_xy([ox], [oy]), crs=2169).to_crs(4326).iloc[0]
Q = 4  # units per metre


def ring(g, tol=0.25):
    if isinstance(g, MultiPolygon):
        g = max(g.geoms, key=lambda p: p.area)
    g = g.simplify(tol)
    if not isinstance(g, Polygon) or g.is_empty:
        return None
    c = np.asarray(g.exterior.coords)[:-1]
    return np.round((c - [ox, oy]) * Q).astype(np.int16)


rings = [ring(g) for g in b.geometry]
keep = np.array([r is not None and len(r) >= 3 for r in rings])
names = b["name"].fillna("").values
name_list = [""] + sorted(set(names[keep]) - {""})
name_ix = {s: i for i, s in enumerate(name_list)}
refs = b["ref"].fillna("").values

idx = np.where(keep)[0]
counts = np.array([len(rings[i]) for i in idx], dtype=np.uint32)
coords = np.concatenate([rings[i] for i in idx]).ravel()
flags = (b["monument"].values[idx].astype(np.uint8))
qid = np.array([qnames.index(s) for s in b["quartier"].values[idx]], dtype=np.uint8)
cols = {
    "count": counts.astype(np.uint16),
    "height": np.round(h[idx] * 10).astype(np.uint16),
    "year": year[idx].astype(np.int16),
    "lo": lo[idx].astype(np.int16),
    "hi": hi[idx].astype(np.int16),
    "name": np.array([name_ix[s] for s in names[idx]], dtype=np.uint16),
    "src": src[idx].astype(np.uint8),
    "flags": flags,
    "quartier": qid,
}
layout, blob = [], bytearray()
for k, arr in [("coords", coords.astype(np.int16))] + list(cols.items()):
    while len(blob) % 4:
        blob.append(0)
    layout.append({"key": k, "type": arr.dtype.name, "offset": len(blob), "length": int(arr.size)})
    blob += arr.tobytes()
(out / "buildings.bin").write_bytes(bytes(blob))

refs_out = {int(j): refs[i] for j, i in enumerate(idx) if refs[i]}


# ---- context: water and larger green areas, 1 m units
def rings_of(gdf, tol, min_area):
    res = []
    for g in gdf.geometry.clip((minx - 300, miny - 300, maxx + 300, maxy + 300)):
        for p in getattr(g, "geoms", [g]):
            if isinstance(p, Polygon) and p.area >= min_area:
                c = np.asarray(p.simplify(tol).exterior.coords)[:-1]
                if len(c) >= 3:
                    res.append(np.round(c - [ox, oy]).astype(int).ravel().tolist())
    return res


water = gpd.read_parquet(work / "water.parquet")
green = gpd.read_parquet(work / "green.parquet")
green = green[green["kind"].isin(["park", "forest", "wood", "garden", "cemetery", "meadow", "grass"])]
ctx = {
    "water": rings_of(water, 1.5, 30),
    "green": rings_of(green, 2.0, 2500),
    "quartiers": [{"name": r["name"], "ring": rings_of(gpd.GeoDataFrame(geometry=[r.geometry], crs=2169), 4, 0)[0]}
                  for _, r in q.iterrows()],
}
(out / "context.json").write_text(json.dumps(ctx, separators=(",", ":")))

meta = {
    "origin": [origin.x, origin.y], "unitsPerMetre": Q, "count": int(len(idx)), "layout": layout,
    "names": name_list, "refs": refs_out, "quartiers": qnames,
    "sources": ["Wikidata", "OpenStreetMap", "Période de construction (geoportail.lu)", "Relevés ACT 2013 / 2023", "Estimation"],
    "built": pd.Timestamp.now().strftime("%Y-%m-%d"),
    "stats": {
        "total": int(len(idx)),
        "documented": int((src[idx] <= 1).sum()),
        "period": int((src[idx] == 2).sum()),
        "survey": int((src[idx] == 3).sum()),
        "estimated": int((src[idx] == 4).sum()),
        "pre1999layer": int((per[idx] == "<1999").sum()),
        "monuments": int(flags.sum()),
        "withHeight": int(gpd.read_parquet(work / "buildings.parquet")["height"].notna().sum()),
    },
}
(out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")))
print("written", len(idx), "buildings,", len(blob) // 1024, "KB;", "context", (out / "context.json").stat().st_size // 1024, "KB")
