# Luxembourg par âge : pipeline

Construit `../data/` (bâtiments, contexte, métadonnées) pour la page `../index.html`.

## Données à télécharger

Toutes depuis data.public.lu (ACT, CC0) :

| Fichier | Jeu de données |
|---|---|
| `ACT2023v2_Buildings3d_Footprints.gpkg` | Base de données nationale des bâtiments 3D 2023, « Empreintes 2D en GeoPackage » |
| `ACT2023v2_bati3d_Luxembourg.gml` | même jeu, `act2023v2-bati3d-luxembourg.zip` : seule la première entrée (1,1 Go décompressé) est utile, les textures non |
| `LOD1_par_commune/Luxembourg.gml` | Bâtiments 3D 2013 (LOD1), `lod1-par-commune.zip` |

Le reste (Wikidata, OpenStreetMap, features.geoportail.lu) est téléchargé par les scripts et mis en cache dans `work/`.

## Lancer

```bash
python -m venv venv && venv/bin/pip install geopandas pyogrio pyproj shapely pyarrow requests scipy osm2geojson
venv/bin/python 01_buildings.py ACT2023v2_Buildings3d_Footprints.gpkg ACT2023v2_bati3d_Luxembourg.gml work
venv/bin/python 02_evidence.py work LOD1_par_commune/Luxembourg.gml
venv/bin/python 03_context.py work
venv/bin/python 04_build.py work ../data
```

Pour changer les estimations, modifier `priors.json` (part de chaque époque par quartier) et relancer `04_build.py`.

## Pièges rencontrés

- Le CityGML LOD2 2023 liste les coordonnées en (nord, est) : il faut inverser les axes.
- Le LOD2 et les empreintes n'ont pas d'identifiant commun : jointure par le centre de la GroundSurface.
- Les empreintes 2020 de l'ACT n'ont pas Luxembourg-Ville (trou dans le fichier) : non utilisées.
- features.geoportail.lu renvoie au plus 2 000 objets par page, quelle que soit la `limit`.
