/* Interface text in English, French and Luxembourgish. Read by app.js. */
window.I18N = {
    en: {
        locale: "en-GB",
        pageTitle: "Luxembourg by Age",
        titleA: "Luxembourg", titleB: "by age",
        loading: "Raising 23,373 buildings…",
        loadError: "Could not load the data.",
        count: (shown, total) => `<strong>${shown}</strong> of ${total} buildings standing today`,
        period: "Period", height: "Height", story: "Story", context: "Water & parks", recorded: "Recorded dates only", about: "About the data",
        legendPeriod: "Period built", legendHeight: "Height",
        legendNote: "Pale tone: date estimated from the quarter",
        showOnly: (label) => `Show only ${label}`,
        eras: [["Fortress city", "before 1815"], ["Federal fortress", "1815–66"], ["Open city", "1867–1918"], ["Interwar", "1919–45"], ["Post-war", "1946–70"], ["Financial centre", "1971–98"], ["1999–2010", ""], ["2011 to today", ""]],
        allBuildings: "all buildings", builtUpTo: (y) => `built up to ${y}`, builtInRange: "built in this range",
        note: "Only buildings standing today are shown: everything demolished is missing, so earlier years look emptier than they were.",
        play: "Play", pause: "Pause", startYear: "Start year", endYear: "End year",
        earlier: "← Earlier", next: "Next →", restart: "Start again", begin: "Start the story →", hideStory: "Hide the story",
        intro: "Introduction", chapter: (k, n) => `Chapter ${k} of ${n}`,
        building: "Building", about_: "c.", monument: "Protected monument",
        src: ["Wikidata (inception or opening date)", "OpenStreetMap (start_date)", "Construction period layer (geoportail.lu)", "Missing from the 2013 3D model and the period layer", "Estimated from the profile of"],
        era: "era", before: "before",
        decimal: ".",
        landmarks: ["Grand Ducal Palace", "Cathedral", "Bock Casemates", "Neumünster Abbey", "Central Station", "Adolphe Bridge", "Philharmonie", "Fort Thüngen", "EU Court of Justice", "Glacis", "Hospital (CHL)", "Stade de Luxembourg"],
        close: "Close",
        tlReign: "Reign", tlStill: (n, rec) => `<strong>${n}</strong> buildings from these years still stand, ${rec} of them with a recorded date.`,
        tlYear: (n, y) => `${n} built in ${y}`, tlDecade: (n, y) => `${n} built in the ${y}s`, tlEvents: "In these years", tlClick: "Click to go to this year",
        use: "Use", legendUse: "Who uses it",
        uses: { gov: "Government & state", eu: "EU & international", embassy: "Embassies & consulates", media: "Radio, TV & press", finance: "Banks & finance", company: "Companies & hotels", public: "Schools, health & culture", none: "No known occupant" },
        useNote: "Occupants from OpenStreetMap and Wikidata. Most buildings, homes above all, have none recorded.",
        whoIsHere: "Who is here", more: (n) => `+${n} more`, website: "website", buildingCity: "Building the city",
        readMore: "Read more", photoBy: "Photo", clickHint: "Click for photo and links", wikidata: "Wikidata", osm: "OpenStreetMap", noPhoto: "No photo on Wikimedia Commons yet",
        stats: (s, f, p) => [
            `<strong>${f(s.documented)}</strong> buildings (${p(s.documented)}) have a documented date (Wikidata, OpenStreetMap).`,
            `<strong>${f(s.period)}</strong> (${p(s.period)}) are dated by the 1999–2021 construction period layer.`,
            `<strong>${f(s.survey)}</strong> (${p(s.survey)}) are dated by comparing the 2013 and 2023 ACT surveys.`,
            `<strong>${f(s.estimated)}</strong> (${p(s.estimated)}) have an estimated date; ${f(s.pre1999layer)} of them are “before 1999” in the period layer.`,
            `<strong>${f(s.monuments)}</strong> are protected monuments; ${f(s.withHeight)} have a measured height.`,
        ],
        aboutHtml: `
<h2>About the data</h2>
<p>Every building in the commune of Luxembourg, extruded to its measured height and coloured by when it was built. Drag the right handle to set the latest year shown and the left one to open a range. Press play to watch the buildings appear in order of age, or follow the story chapter by chapter. Click a period in the key to see it alone, and hover a building for its date, height and where the date comes from.</p>
<h3>What this map is not</h3>
<p>It shows when today's buildings were built. It does not show the city as it was in any past year: everything demolished is missing, from the fortress dismantled after 1867 to the suburbs razed during sieges and the blocks rebuilt since. Treat the timeline as a filter by age, not as the growth of the city.</p>
<h3>Where the dates come from</h3>
<ul id="about-stats"></ul>
<p>No open dataset gives the construction year of every building in Luxembourg, so the map combines, in order of trust:</p>
<ol>
<li><strong>Documented</strong>: the inception or opening date of a Wikidata item located in the footprint, or an OpenStreetMap <code>start_date</code> tag.</li>
<li><strong>Construction period layer</strong> from geoportail.lu (Department of Spatial Planning): one period per building from 1999 to 2021 (1999–2004, 2004–2006 … 2018–2021). The year shown is spread within the period.</li>
<li><strong>ACT surveys</strong>: a building over 60 m² present in 2023 but missing from both the 2013 3D model and the period layer is dated between 2014 and 2023.</li>
<li><strong>Estimated</strong>: everything else, mostly buildings “before 1999”. Each quarter gets a hand-written share of buildings per era, based on its history (Ville-Haute and Grund old first, Gare and Limpertsberg mostly 1870–1930, Kirchberg after 1961…). Within a quarter, protected monuments take the oldest eras, then low and small buildings before large and tall ones, smoothed over 60 m so that blocks stay coherent. These dates are drawn pale and marked “estimated”.</li>
</ol>
<h3>Where the data is imprecise</h3>
<ul>
<li><strong>Estimates are guesses.</strong> They follow the quarter's profile, but any single building can be decades off. “Recorded dates only” hides them.</li>
<li><strong>Quarter shares</strong> are written by hand and published with the code (<code>priors.json</code>), to be replaced as soon as a better source exists.</li>
<li><strong>Wikidata dates.</strong> An inception date can be that of an institution or a renovation rather than of the current building.</li>
<li><strong>Facades and rebuilds.</strong> A building rebuilt behind an old front may carry either date.</li>
<li><strong>Heights.</strong> Measured height from the 2023 LOD2 3D model; the few buildings without a model take the median height.</li>
</ul>
<h3>The story</h3>
<p>The chapters summarise the history of the city and of those who ruled it, from general sources (Wikipedia, <a href="https://www.vdl.lu/" target="_blank" rel="noopener">the City of Luxembourg</a>, <a href="https://citymuseum.lu/" target="_blank" rel="noopener">the Luxembourg City History Museum</a>), linked under each chapter. Before 1890 the sovereign of Luxembourg mostly ruled from elsewhere: Prague, Dijon, Madrid, Vienna, Paris or The Hague.</p>
<h3>Sources</h3>
<ul>
<li><a href="https://data.public.lu/fr/datasets/base-de-donnees-nationale-des-batiments-3d-2023/" target="_blank" rel="noopener">National 3D buildings database 2023</a> and <a href="https://data.public.lu/fr/datasets/batiments-3d-2013-lod-1-level-of-detail-1/" target="_blank" rel="noopener">2013 LOD1 model</a>, Administration du cadastre et de la topographie (ACT), via data.public.lu. CC0.</li>
<li><a href="https://features.geoportail.lu/collections/2214" target="_blank" rel="noopener">Construction period of buildings</a>; <a href="https://features.geoportail.lu/collections/709/0" target="_blank" rel="noopener">national monuments and supplementary inventory</a>, via features.geoportail.lu.</li>
<li><a href="https://www.wikidata.org/" target="_blank" rel="noopener">Wikidata</a> (CC0) and <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a> (ODbL): dates, names, quarters, water and green areas, and the occupants of buildings (ministries, EU institutions, embassies, radio and press, banks, companies).</li>
<li>Photos: <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a>, each credited with its author and licence.</li>
<li>Code and data pipeline: <a href="https://github.com/krosamont/luxembourg-par-age" target="_blank" rel="noopener">GitHub</a>.</li>
</ul>
<p class="small">Water and parks are today's and do not change with the timeline. Landmark labels are placed by hand. Inspired by <a href="https://plotbrief.co.uk/Londonbyyear" target="_blank" rel="noopener"><em>Central London by Age</em></a> (plotbrief) and <a href="https://stop-token.com/lab/amsterdam/" target="_blank" rel="noopener"><em>LAYRS: Amsterdam</em></a>, both inspired by <em>Paris, building by building</em>. Data built on <span id="built"></span>.</p>`,
    },

    fr: {
        locale: "fr-FR",
        pageTitle: "Luxembourg par âge",
        titleA: "Luxembourg", titleB: "par âge",
        loading: "Élévation de 23 373 bâtiments…",
        loadError: "Impossible de charger les données.",
        count: (shown, total) => `<strong>${shown}</strong> sur ${total} bâtiments debout aujourd'hui`,
        period: "Période", height: "Hauteur", story: "Histoire", context: "Eau & parcs", recorded: "Dates relevées seulement", about: "À propos des données",
        legendPeriod: "Période de construction", legendHeight: "Hauteur",
        legendNote: "Teinte pâle : date estimée d'après le quartier",
        showOnly: (label) => `Afficher seulement ${label}`,
        eras: [["Ville forteresse", "avant 1815"], ["Forteresse fédérale", "1815–66"], ["Ville ouverte", "1867–1918"], ["Entre-deux-guerres", "1919–45"], ["Après-guerre", "1946–70"], ["Place financière", "1971–98"], ["1999–2010", ""], ["2011 à aujourd'hui", ""]],
        allBuildings: "tous les bâtiments", builtUpTo: (y) => `construits jusqu'en ${y}`, builtInRange: "construits sur la période",
        note: "Seuls les bâtiments encore debout aujourd'hui figurent ici : ce qui a été démoli manque, la ville passée paraît donc plus vide qu'elle ne l'était.",
        play: "Lecture", pause: "Pause", startYear: "Année de début", endYear: "Année de fin",
        earlier: "← Avant", next: "Suite →", restart: "Recommencer", begin: "Commencer l'histoire →", hideStory: "Masquer l'histoire",
        intro: "Introduction", chapter: (k, n) => `Chapitre ${k} sur ${n}`,
        building: "Bâtiment", about_: "vers", monument: "Monument protégé",
        src: ["Wikidata (date de création ou d'inauguration)", "OpenStreetMap (start_date)", "Couche « Période de construction » (geoportail.lu)", "Absent du modèle 3D 2013 et de la couche des périodes", "Estimée d'après le profil de"],
        era: "époque", before: "avant",
        decimal: ",",
        landmarks: ["Palais grand-ducal", "Cathédrale", "Casemates du Bock", "Abbaye de Neumünster", "Gare centrale", "Pont Adolphe", "Philharmonie", "Fort Thüngen", "Cour de justice de l'UE", "Glacis", "Centre hospitalier", "Stade de Luxembourg"],
        close: "Fermer",
        tlReign: "Règne", tlStill: (n, rec) => `<strong>${n}</strong> bâtiments de ces années sont encore debout, dont ${rec} avec une date relevée.`,
        tlYear: (n, y) => `${n} construits en ${y}`, tlDecade: (n, y) => `${n} construits dans les années ${y}`, tlEvents: "Pendant ces années", tlClick: "Cliquez pour aller à cette année",
        use: "Usage", legendUse: "Qui l'occupe",
        uses: { gov: "Gouvernement & État", eu: "UE & international", embassy: "Ambassades & consulats", media: "Radio, télé & presse", finance: "Banques & finance", company: "Entreprises & hôtels", public: "Écoles, santé & culture", none: "Occupant inconnu" },
        useNote: "Occupants d'après OpenStreetMap et Wikidata. La plupart des bâtiments, surtout les logements, n'en ont aucun de recensé.",
        whoIsHere: "Qui est ici", more: (n) => `+${n} autres`, website: "site web", buildingCity: "Construction de la ville",
        readMore: "En savoir plus", photoBy: "Photo", clickHint: "Cliquez pour la photo et les liens", wikidata: "Wikidata", osm: "OpenStreetMap", noPhoto: "Pas encore de photo sur Wikimedia Commons",
        stats: (s, f, p) => [
            `<strong>${f(s.documented)}</strong> bâtiments (${p(s.documented)}) ont une date documentée (Wikidata, OpenStreetMap).`,
            `<strong>${f(s.period)}</strong> (${p(s.period)}) sont datés par la couche des périodes 1999–2021.`,
            `<strong>${f(s.survey)}</strong> (${p(s.survey)}) sont datés en comparant les relevés ACT de 2013 et 2023.`,
            `<strong>${f(s.estimated)}</strong> (${p(s.estimated)}) ont une date estimée ; ${f(s.pre1999layer)} d'entre eux sont « avant 1999 » selon la couche des périodes.`,
            `<strong>${f(s.monuments)}</strong> sont des monuments protégés ; ${f(s.withHeight)} ont une hauteur mesurée.`,
        ],
        aboutHtml: `
<h2>À propos des données</h2>
<p>Chaque bâtiment de la commune de Luxembourg, extrudé à sa hauteur mesurée et coloré selon son année de construction. Tirez la poignée de droite pour fixer la dernière année affichée, celle de gauche pour ouvrir une plage. Lancez la lecture pour voir les bâtiments apparaître dans l'ordre, ou suivez l'histoire chapitre par chapitre. Cliquez sur une période de la légende pour l'isoler, survolez un bâtiment pour voir sa date, sa hauteur et d'où vient la date.</p>
<h3>Ce que cette carte n'est pas</h3>
<p>Elle montre quand les bâtiments d'aujourd'hui ont été construits, pas la ville telle qu'elle était à une date passée. Tout ce qui a été démoli manque : la forteresse démantelée après 1867, les faubourgs rasés lors des sièges, les îlots reconstruits depuis. Prenez la frise comme un filtre par âge, pas comme la croissance de la ville.</p>
<h3>D'où viennent les dates</h3>
<ul id="about-stats"></ul>
<p>Aucune source ouverte ne donne l'année de construction de chaque bâtiment au Luxembourg. La carte combine donc, par ordre de confiance :</p>
<ol>
<li><strong>Documentée</strong> : la date de création ou d'inauguration d'un élément Wikidata situé dans l'empreinte, ou une étiquette <code>start_date</code> OpenStreetMap.</li>
<li><strong>Couche « Période de construction »</strong> du géoportail (Aménagement du territoire) : une tranche par bâtiment de 1999 à 2021 (1999–2004, 2004–2006 … 2018–2021). L'année affichée est répartie dans la tranche.</li>
<li><strong>Relevés ACT</strong> : un bâtiment de plus de 60 m² présent en 2023, absent du modèle 3D de 2013 et de la couche des périodes, est daté entre 2014 et 2023.</li>
<li><strong>Estimée</strong> : tout le reste, surtout les bâtiments « avant 1999 ». Chaque quartier reçoit une répartition par époque écrite à la main d'après son histoire (Ville-Haute et Grund d'abord anciens, Gare et Limpertsberg surtout 1870–1930, Kirchberg après 1961…). Dans un quartier, les monuments protégés prennent les époques les plus anciennes, puis les bâtiments bas et petits avant les grands et hauts, lissé sur 60 m pour que les îlots restent cohérents. Ces dates sont pâles et marquées « estimée ».</li>
</ol>
<h3>Où les données sont imprécises</h3>
<ul>
<li><strong>Les estimations sont des suppositions.</strong> Elles suivent le profil du quartier, mais un bâtiment pris isolément peut être faux de plusieurs décennies. « Dates relevées seulement » les masque.</li>
<li><strong>Répartitions par quartier</strong> : écrites à la main et publiées avec le code (<code>priors.json</code>), à remplacer dès qu'une meilleure source existe.</li>
<li><strong>Dates Wikidata.</strong> Une date de création peut être celle d'une institution ou d'une rénovation plutôt que du bâtiment actuel.</li>
<li><strong>Façades et reconstructions.</strong> Un bâtiment reconstruit derrière une façade ancienne peut porter l'une ou l'autre date.</li>
<li><strong>Hauteurs.</strong> Hauteur mesurée du modèle 3D LOD2 de 2023 ; les rares bâtiments sans modèle prennent la hauteur médiane.</li>
</ul>
<h3>L'histoire</h3>
<p>Les chapitres résument l'histoire de la ville et de ceux qui l'ont gouvernée, d'après des sources générales (Wikipédia, <a href="https://www.vdl.lu/" target="_blank" rel="noopener">Ville de Luxembourg</a>, <a href="https://citymuseum.lu/" target="_blank" rel="noopener">Lëtzebuerg City Museum</a>), citées sous chaque chapitre. Avant 1890, le souverain du Luxembourg régnait surtout depuis ailleurs : Prague, Dijon, Madrid, Vienne, Paris ou La Haye.</p>
<h3>Sources</h3>
<ul>
<li><a href="https://data.public.lu/fr/datasets/base-de-donnees-nationale-des-batiments-3d-2023/" target="_blank" rel="noopener">Base de données nationale des bâtiments 3D 2023</a> et <a href="https://data.public.lu/fr/datasets/batiments-3d-2013-lod-1-level-of-detail-1/" target="_blank" rel="noopener">modèle LOD1 2013</a>, Administration du cadastre et de la topographie (ACT), via data.public.lu. CC0.</li>
<li><a href="https://features.geoportail.lu/collections/2214" target="_blank" rel="noopener">Période de construction des bâtiments</a> ; <a href="https://features.geoportail.lu/collections/709/0" target="_blank" rel="noopener">immeubles classés monument national et inscrits à l'inventaire supplémentaire</a>, via features.geoportail.lu.</li>
<li><a href="https://www.wikidata.org/" target="_blank" rel="noopener">Wikidata</a> (CC0) et <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a> (ODbL) : dates, noms, quartiers, eau et espaces verts, et les occupants des bâtiments (ministères, institutions européennes, ambassades, radios et presse, banques, entreprises).</li>
<li>Photos : <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a>, chacune créditée avec son auteur et sa licence.</li>
<li>Code et chaîne de traitement : <a href="https://github.com/krosamont/luxembourg-par-age" target="_blank" rel="noopener">GitHub</a>.</li>
</ul>
<p class="small">L'eau et les parcs sont ceux d'aujourd'hui et ne changent pas avec la frise. Les repères sont placés à la main. Inspiré de <a href="https://plotbrief.co.uk/Londonbyyear" target="_blank" rel="noopener"><em>Central London by Age</em></a> (plotbrief) et de <a href="https://stop-token.com/lab/amsterdam/" target="_blank" rel="noopener"><em>LAYRS: Amsterdam</em></a>, eux-mêmes inspirés de <em>Paris, building by building</em>. Données construites le <span id="built"></span>.</p>`,
    },

    lb: {
        locale: "de-LU",
        pageTitle: "Lëtzebuerg no Alter",
        titleA: "Lëtzebuerg", titleB: "no Alter",
        loading: "23.373 Gebaier ginn opgeriicht…",
        loadError: "D'Donnéeë konnten net geluede ginn.",
        count: (shown, total) => `<strong>${shown}</strong> vun ${total} Gebaier, déi haut nach stinn`,
        period: "Period", height: "Héicht", story: "Geschicht", context: "Waasser & Parken", recorded: "Just opgeholl Datumen", about: "Iwwer d'Donnéeën",
        legendPeriod: "Bauperiod", legendHeight: "Héicht",
        legendNote: "Blass Faarf: Datum no dem Quartier geschat",
        showOnly: (label) => `Just ${label} weisen`,
        eras: [["Festungsstad", "virun 1815"], ["Bundesfestung", "1815–66"], ["Oppe Stad", "1867–1918"], ["Tëschent de Kricher", "1919–45"], ["Nokrichszäit", "1946–70"], ["Finanzplaz", "1971–98"], ["1999–2010", ""], ["2011 bis haut", ""]],
        allBuildings: "all Gebaier", builtUpTo: (y) => `gebaut bis ${y}`, builtInRange: "an dëser Zäit gebaut",
        note: "Just d'Gebaier, déi haut nach stinn, sinn hei: wat ofgerappt gouf, feelt, dofir gesäit d'Stad vu fréier méi eidel aus, wéi se war.",
        play: "Ofspillen", pause: "Paus", startYear: "Ufanksjoer", endYear: "Ennjoer",
        earlier: "← Virdrun", next: "Weider →", restart: "Nach eng Kéier", begin: "Geschicht ufänken →", hideStory: "Geschicht verstoppen",
        intro: "Aleedung", chapter: (k, n) => `Kapitel ${k} vun ${n}`,
        building: "Gebai", about_: "ëm", monument: "Geschützt Monument",
        src: ["Wikidata (Datum vun der Grënnung oder Aweiung)", "OpenStreetMap (start_date)", "Schicht „Bauperiod vun de Gebaier“ (geoportail.lu)", "Feelt am 3D-Modell vun 2013 an an der Schicht vun de Perioden", "Geschat no dem Profil vu(n)"],
        era: "Epoch", before: "virun",
        decimal: ",",
        landmarks: ["Groussherzogleche Palais", "Kathedral", "Bock-Kasematten", "Abtei Neimënster", "Zentralgare", "Adolphe-Bréck", "Philharmonie", "Fort Thüngen", "EU-Geriichtshaff", "Glacis", "CHL", "Stade de Luxembourg"],
        close: "Zoumaachen",
        tlReign: "Regentschaft", tlStill: (n, rec) => `<strong>${n}</strong> Gebaier aus dëse Joren stinn nach, dovun ${rec} mat engem opgeholl Datum.`,
        tlYear: (n, y) => `${n} gebaut ${y}`, tlDecade: (n, y) => `${n} gebaut an den ${y}er Joren`, tlEvents: "An dëse Joren", tlClick: "Klickt fir op dëst Joer ze goen",
        use: "Notzung", legendUse: "Wien ass do",
        uses: { gov: "Regierung & Staat", eu: "EU & international", embassy: "Ambassaden & Konsulater", media: "Radio, Tëlee & Press", finance: "Banken & Finanzen", company: "Betriber & Hotellen", public: "Schoulen, Gesondheet & Kultur", none: "Keen bekannte Benotzer" },
        useNote: "Benotzer no OpenStreetMap a Wikidata. Bei de meeschte Gebaier, virun allem Wunnengen, ass keen agedroen.",
        whoIsHere: "Wien ass hei", more: (n) => `+${n} aner`, website: "Websäit", buildingCity: "D'Stad gëtt gebaut",
        readMore: "Méi gewuer ginn", photoBy: "Foto", clickHint: "Klickt fir d'Foto an d'Linken", wikidata: "Wikidata", osm: "OpenStreetMap", noPhoto: "Nach keng Foto op Wikimedia Commons",
        stats: (s, f, p) => [
            `<strong>${f(s.documented)}</strong> Gebaier (${p(s.documented)}) hunn en dokumentéierten Datum (Wikidata, OpenStreetMap).`,
            `<strong>${f(s.period)}</strong> (${p(s.period)}) sinn duerch d'Schicht vun de Bauperioden 1999–2021 datéiert.`,
            `<strong>${f(s.survey)}</strong> (${p(s.survey)}) sinn duerch de Verglach vun den ACT-Opnamen 2013 an 2023 datéiert.`,
            `<strong>${f(s.estimated)}</strong> (${p(s.estimated)}) hunn e geschaten Datum; ${f(s.pre1999layer)} dovu sinn „virun 1999“ an der Schicht vun de Perioden.`,
            `<strong>${f(s.monuments)}</strong> si geschützt Monumenter; ${f(s.withHeight)} hunn eng gemiessen Héicht.`,
        ],
        aboutHtml: `
<h2>Iwwer d'Donnéeën</h2>
<p>All Gebai an der Gemeng Lëtzebuerg, op seng gemiessen Héicht opgeriicht an no sengem Baujoer gefierft. Zitt de rietse Grëff fir dat lescht Joer ze wielen, an de lénke fir eng Zäitspan opzemaachen. Dréckt op Ofspillen a kuckt, wéi d'Gebaier no hirem Alter erschéngen, oder verfollegt d'Geschicht Kapitel fir Kapitel. Klickt op eng Period an der Legend fir se eleng ze weisen, a gitt mat der Maus iwwer e Gebai fir säin Datum, seng Héicht an d'Quell vum Datum ze gesinn.</p>
<h3>Wat dës Kaart net ass</h3>
<p>Si weist, wéini déi haiteg Gebaier gebaut goufen, net wéi d'Stad an engem fréiere Joer ausgesinn huet. Alles, wat ofgerappt gouf, feelt: d'Festung, déi no 1867 geschleeft gouf, d'Viirstied, déi bei Belagerungen zerstéiert goufen, an d'Blocken, déi zënterhier nei gebaut goufen. Huelt d'Zäitlinn als Filter no Alter, net als Wuesstem vun der Stad.</p>
<h3>Wou d'Datume hierkommen</h3>
<ul id="about-stats"></ul>
<p>Keng oppe Quell gëtt d'Baujoer vun all Gebai zu Lëtzebuerg. D'Kaart kombinéiert dofir, no Vertrauen:</p>
<ol>
<li><strong>Dokumentéiert</strong>: d'Datum vun der Grënnung oder Aweiung vun engem Wikidata-Element am Grondrëss, oder en OpenStreetMap-Tag <code>start_date</code>.</li>
<li><strong>Schicht „Bauperiod vun de Gebaier“</strong> vum Geoportail (Landesplanung): eng Period pro Gebai vun 1999 bis 2021 (1999–2004, 2004–2006 … 2018–2021). D'Joer gëtt an der Period verdeelt.</li>
<li><strong>ACT-Opnamen</strong>: e Gebai vu méi wéi 60 m², dat 2023 do ass, mee am 3D-Modell vun 2013 an an der Schicht vun de Perioden feelt, gëtt tëschent 2014 an 2023 datéiert.</li>
<li><strong>Geschat</strong>: alles anescht, virun allem Gebaier „virun 1999“. All Quartier kritt eng Opdeelung no Epochen, déi mat der Hand no senger Geschicht geschriwwe gouf (Uewerstad a Gronn als éischt al, Gare a Lampertsbierg virun allem 1870–1930, Kierchbierg no 1961…). An engem Quartier kréien d'geschützt Monumenter déi eelst Epochen, dann déi niddreg a kleng Gebaier virun de groussen an héijen, iwwer 60 m ausgeglach, fir datt d'Blocke kohärent bleiwen. Dës Datume si blass a mat „geschat“ markéiert.</li>
</ol>
<h3>Wou d'Donnéeën ongenee sinn</h3>
<ul>
<li><strong>Schätzunge si Vermutungen.</strong> Si verfollegen de Profil vum Quartier, mee en eenzelt Gebai kann e puer Joerzéngten dernieft leien. „Just opgeholl Datumen“ verstoppt se.</li>
<li><strong>Opdeelung pro Quartier</strong>: mat der Hand geschriwwen a mam Code verëffentlecht (<code>priors.json</code>), fir ersat ze ginn, soubal et eng besser Quell gëtt.</li>
<li><strong>Wikidata-Datumen.</strong> E Grënnungsdatum kann deen vun enger Institutioun oder enger Renovatioun sinn amplaz vum aktuelle Gebai.</li>
<li><strong>Fassaden an Neibauten.</strong> E Gebai, dat hannert enger aler Fassad nei gebaut gouf, kann deen een oder deen aneren Datum hunn.</li>
<li><strong>Héichten.</strong> Gemiessen Héicht aus dem LOD2-3D-Modell vun 2023; déi puer Gebaier ouni Modell kréien d'Medianhéicht.</li>
</ul>
<h3>D'Geschicht</h3>
<p>D'Kapitele resüméieren d'Geschicht vun der Stad a vun deenen, déi se regéiert hunn, no allgemenge Quellen (Wikipedia, <a href="https://www.vdl.lu/" target="_blank" rel="noopener">Stad Lëtzebuerg</a>, <a href="https://citymuseum.lu/" target="_blank" rel="noopener">Lëtzebuerg City Museum</a>), ënner all Kapitel verlinkt. Virun 1890 huet de Souverän vu Lëtzebuerg meeschtens vu soss enzwousch regéiert: vu Prag, Dijon, Madrid, Wien, Paräis oder Den Haag.</p>
<h3>Quellen</h3>
<ul>
<li><a href="https://data.public.lu/fr/datasets/base-de-donnees-nationale-des-batiments-3d-2023/" target="_blank" rel="noopener">Nationaal Datebank vun de 3D-Gebaier 2023</a> an <a href="https://data.public.lu/fr/datasets/batiments-3d-2013-lod-1-level-of-detail-1/" target="_blank" rel="noopener">LOD1-Modell 2013</a>, Administration du cadastre et de la topographie (ACT), iwwer data.public.lu. CC0.</li>
<li><a href="https://features.geoportail.lu/collections/2214" target="_blank" rel="noopener">Bauperiod vun de Gebaier</a>; <a href="https://features.geoportail.lu/collections/709/0" target="_blank" rel="noopener">Nationalmonumenter an zousätzlecht Inventar</a>, iwwer features.geoportail.lu.</li>
<li><a href="https://www.wikidata.org/" target="_blank" rel="noopener">Wikidata</a> (CC0) an <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-Mataarbechter</a> (ODbL): Datumen, Nimm, Quartieren, Waasser a Gréngflächen, an d'Benotzer vun de Gebaier (Ministèren, EU-Institutiounen, Ambassaden, Radio a Press, Banken, Betriber).</li>
<li>Fotoen: <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a>, all Foto mat sengem Auteur a senger Lizenz.</li>
<li>Code an Donnéeën-Pipeline: <a href="https://github.com/krosamont/luxembourg-par-age" target="_blank" rel="noopener">GitHub</a>.</li>
</ul>
<p class="small">Waasser a Parke sinn déi vun haut an änneren net mat der Zäitlinn. D'Landmarke si mat der Hand gesat. Inspiréiert vu <a href="https://plotbrief.co.uk/Londonbyyear" target="_blank" rel="noopener"><em>Central London by Age</em></a> (plotbrief) a <a href="https://stop-token.com/lab/amsterdam/" target="_blank" rel="noopener"><em>LAYRS: Amsterdam</em></a>, déi selwer vu <em>Paris, building by building</em> inspiréiert sinn. Donnéeë gebaut den <span id="built"></span>.</p>`,
    },
};
