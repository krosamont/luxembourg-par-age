# Luxembourg by Age

All 23,373 buildings of the commune of Luxembourg in 3D, extruded to their measured height and coloured by the year they were built, with the story of the city and of the rulers who held it, from Count Siegfried's castle in 963 to Grand Duke Guillaume in 2025. In English, French and Luxembourgish (`?lang=en|fr|lb`). Inspired by *Central London by Age* (plotbrief) and *LAYRS: Amsterdam*.

Live: https://krosamont.github.io/luxembourg-par-age/

A static page: `index.html`, `app.js`, `style.css`, `story.js` (chapters and rulers), `i18n.js` (interface text) and `data/` (1.5 MB). To view it locally:

```bash
python3 -m http.server 8765
```

then open http://127.0.0.1:8765/.

## Where the dates come from

| Source | Buildings |
|---|---|
| Wikidata / OpenStreetMap (documented date) | 98 |
| Construction period layer 1999–2021, geoportail.lu | 2,683 |
| Missing from the ACT 2013 3D model, present in 2023 | 456 |
| Estimated from the quarter's profile (`pipeline/priors.json`) | 20,136 |

Estimates are drawn pale on the map and can be hidden. The method and its limits are detailed under “About the data” on the page.

## Editing the story

Each chapter in `story.js` has a year, a camera view and a title and text in `en`, `fr` and `lb`. The `events` list in the same file holds the dated events marked on the timeline, each told in a bubble when the timeline reaches its year. The Luxembourgish text has not yet been reviewed by a native speaker.

## Rebuilding the data

See [pipeline/README.md](pipeline/README.md).

## Licences

Buildings and heights: ACT (CC0). Wikidata (CC0). OpenStreetMap (ODbL): names, quarters, water and green areas, so the derived data in `data/` is under the ODbL.
