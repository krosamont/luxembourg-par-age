# Luxembourg by Age: data pipeline

Builds `../data/` (buildings, context, metadata) for the page `../index.html`.

## Files to download

All from data.public.lu (ACT, CC0):

| File | Dataset |
|---|---|
| `ACT2023v2_Buildings3d_Footprints.gpkg` | National 3D buildings database 2023, “2D footprints in GeoPackage” |
| `ACT2023v2_bati3d_Luxembourg.gml` | same dataset, `act2023v2-bati3d-luxembourg.zip`: only the first entry (1.1 GB unzipped) is needed, not the textures |
| `LOD1_par_commune/Luxembourg.gml` | 3D buildings 2013 (LOD1), `lod1-par-commune.zip` |

Everything else (Wikidata, OpenStreetMap, features.geoportail.lu) is downloaded by the scripts and cached in `work/`.

## Run

```bash
python -m venv venv && venv/bin/pip install geopandas pyogrio pyproj shapely pyarrow requests scipy osm2geojson
venv/bin/python 01_buildings.py ACT2023v2_Buildings3d_Footprints.gpkg ACT2023v2_bati3d_Luxembourg.gml work
venv/bin/python 02_evidence.py work LOD1_par_commune/Luxembourg.gml
venv/bin/python 03_context.py work
venv/bin/python 04_build.py work ../data
venv/bin/python 05_media.py ../data
```

`05_media.py` fetches the chapter photos and source links (topics in `story_topics.json`) and the photos of buildings dated from Wikidata, with each photo's author and licence from Wikimedia Commons.

To change the estimates, edit `priors.json` (share of each era per quarter) and rerun `04_build.py`.

## Pitfalls

- The 2023 LOD2 CityGML lists coordinates as (northing, easting): the axes must be swapped.
- LOD2 buildings and footprints share no identifier: they are joined by the centre of the ground surface.
- The ACT 2020 footprints have a hole over Luxembourg City: not used.
- features.geoportail.lu returns at most 2,000 features per page, whatever the `limit`.
