"""ACT 2023 footprints for the commune of Luxembourg, joined to LOD2 measured heights.

Inputs (see README):
  ACT2023v2_Buildings3d_Footprints.gpkg   2D footprints, national
  ACT2023v2_bati3d_Luxembourg.gml         LOD2 CityGML for the commune (first entry of
                                          act2023v2-bati3d-luxembourg.zip, textures skipped)
The two files share no identifier, so each LOD2 building is matched to the footprint
that contains the centre of its ground surface.
Output: work/buildings.parquet (EPSG:2169)
"""
import re
import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd

fp_path, gml_path, work = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
work.mkdir(exist_ok=True)

rx_h = re.compile(r"<bldg:measuredHeight[^>]*>([\d.]+)<")
rx_pos = re.compile(r"<gml:posList[^>]*>([^<]+)<")
rows = []
h, in_ground, ground = None, False, []
with open(gml_path, encoding="utf-8") as f:
    for line in f:
        if "<bldg:Building " in line:
            h, ground = None, []
        elif "measuredHeight" in line:
            h = float(rx_h.search(line).group(1))
        elif "<bldg:GroundSurface" in line:
            in_ground = True
        elif "</bldg:GroundSurface" in line:
            in_ground = False
        elif in_ground and "posList" in line:
            v = np.array(rx_pos.search(line).group(1).split(), dtype=float).reshape(-1, 3)
            ground.append(v[:, :2])
        elif "</bldg:Building>" in line and h is not None and ground:
            pts = np.vstack(ground)
            rows.append((h, pts[:, 1].mean(), pts[:, 0].mean()))  # GML axis order is northing, easting
lod2 = pd.DataFrame(rows, columns=["height", "x", "y"])
print("lod2 buildings", len(lod2))
pts = gpd.GeoDataFrame(lod2, geometry=gpd.points_from_xy(lod2.x, lod2.y), crs=2169)

gdf = gpd.read_file(fp_path, where="commune = 'Luxembourg'").set_crs(2169, allow_override=True)
gdf["geometry"] = gdf.geometry.force_2d()
j = gpd.sjoin(pts, gdf[["geometry"]], predicate="within")
# several LOD2 parts can fall in one footprint: keep the tallest
gdf["height"] = j.groupby("index_right")["height"].max()
print("footprints", len(gdf), "with height", round(gdf["height"].notna().mean(), 3))
gdf[["buildingid", "area", "height", "geometry"]].to_parquet(work / "buildings.parquet")
