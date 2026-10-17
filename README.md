# Luxembourg par âge

Les 23 373 bâtiments de la commune de Luxembourg en 3D, extrudés à leur hauteur mesurée et colorés selon leur année de construction. Inspiré de *Central London by Age* (plotbrief) et de *LAYRS: Amsterdam*.

Page statique : `index.html`, `app.js`, `style.css` et `data/` (1,5 Mo). Pour la voir en local :

```bash
python3 -m http.server 8765
```

puis ouvrir http://127.0.0.1:8765/.

## D'où viennent les dates

| Source | Bâtiments |
|---|---|
| Wikidata / OpenStreetMap (date documentée) | 98 |
| Couche « Période de construction » 1999–2021, geoportail.lu | 2 683 |
| Absent du modèle 3D ACT 2013, présent en 2023 | 456 |
| Estimée d'après le profil du quartier (`pipeline/priors.json`) | 20 136 |

Les estimations sont pâles sur la carte et peuvent être masquées. Méthode et limites détaillées dans « À propos des données » sur la page.

## Reconstruire les données

Voir [pipeline/README.md](pipeline/README.md).

## Licences

Bâtiments et hauteurs : ACT (CC0). Wikidata (CC0). OpenStreetMap (ODbL) : noms, quartiers, eau et espaces verts, donc les données dérivées dans `data/` sont sous ODbL.
