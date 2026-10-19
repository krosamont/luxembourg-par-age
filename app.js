/* Luxembourg by Age: deck.gl view of data/buildings.bin (written by pipeline/04_build.py),
   with the story of the city (story.js) and three languages (i18n.js). */
(() => {
    const { Deck, MapView, SolidPolygonLayer, PathLayer, TextLayer, ScatterplotLayer, COORDINATE_SYSTEM, DataFilterExtension, FlyToInterpolator } = deck;
    const { rulers: RULERS, chapters: CHAPTERS, intro: INTRO, events: EVENTS } = window.STORY;
    const I18N = window.I18N;

    const MIN_YEAR = 960; // Siegfried's castle, 963
    const MAX_YEAR = 2025; // a few Wikidata openings postdate the 2023 survey
    const ERAS = [
        { from: MIN_YEAR, to: 1814, color: [104, 110, 236] },
        { from: 1815, to: 1866, color: [66, 152, 236] },
        { from: 1867, to: 1918, color: [52, 198, 178] },
        { from: 1919, to: 1945, color: [140, 208, 98] },
        { from: 1946, to: 1970, color: [234, 214, 76] },
        { from: 1971, to: 1998, color: [246, 160, 62] },
        { from: 1999, to: 2010, color: [240, 100, 72] },
        { from: 2011, to: MAX_YEAR, color: [228, 62, 124] },
    ];
    const HEIGHT_STOPS = [[0, [46, 58, 110]], [8, [52, 120, 176]], [16, [60, 186, 164]], [30, [190, 214, 84]], [60, [246, 160, 62]], [120, [236, 72, 96]]];
    const MUTE = [58, 60, 66];
    const USES = ["gov", "eu", "embassy", "media", "finance", "company", "public"];
    const USE_COLORS = {
        gov: [232, 72, 78], eu: [74, 124, 242], embassy: [176, 112, 232], media: [242, 193, 78],
        finance: [56, 196, 152], company: [150, 168, 190], public: [240, 142, 64],
    };
    const NO_USE = [46, 50, 58];
    // hand-placed; coordinates from Wikidata where it has them. Names are in i18n.js, same order.
    const LANDMARKS = [
        [6.13221, 49.61096, "end"], [6.13139, 49.60972, "end"], [6.13698, 49.61178], [6.13750, 49.60944],
        [6.13361, 49.59972], [6.12667, 49.60778], [6.14209, 49.61849], [6.13889, 49.61639],
        [6.13944, 49.62000], [6.12364, 49.61675], [6.10109, 49.61870], [6.10940, 49.57860],
    ].map((d, k) => ({ k, lon: d[0], lat: d[1], anchor: d[2] || "start" }));

    const $ = (id) => document.getElementById(id);
    const state = { useOnly: null, lang: "en", mode: "period", story: true, context: true, recordedOnly: false, lo: MIN_YEAR, hi: MAX_YEAR, playing: false, chapter: -1, card: -1 };
    const T = () => I18N[state.lang];
    let D; // decoded data
    let deckgl;

    function eraOf(y) {
        for (let k = ERAS.length - 1; k >= 0; k--) if (y >= ERAS[k].from) return k;
        return 0;
    }

    function lerpColor(stops, v) {
        if (v <= stops[0][0]) return stops[0][1];
        for (let k = 1; k < stops.length; k++) {
            if (v <= stops[k][0]) {
                const [a, ca] = stops[k - 1], [b, cb] = stops[k];
                const t = (v - a) / (b - a);
                return ca.map((c, j) => Math.round(c + (cb[j] - c) * t));
            }
        }
        return stops[stops.length - 1][1];
    }

    const mix = (c, m, t) => c.map((v, j) => Math.round(v + (m[j] - v) * t));

    function centroid(r) {
        let x = 0, y = 0;
        const m = r.length / 2;
        for (let k = 0; k < r.length; k += 2) { x += r[k]; y += r[k + 1]; }
        return [x / m, y / m];
    }

    async function load() {
        const [meta, buf, ctx, media, occJson] = await Promise.all([
            fetch("data/meta.json").then((r) => r.json()),
            fetch("data/buildings.bin").then((r) => r.arrayBuffer()),
            fetch("data/context.json").then((r) => r.json()),
            fetch("data/media.json").then((r) => r.json()),
            fetch("data/occupants.json").then((r) => r.json()),
        ]);
        const Typed = { int16: Int16Array, uint16: Uint16Array, uint8: Uint8Array, uint32: Uint32Array };
        const a = {};
        for (const l of meta.layout) a[l.key] = new Typed[l.type](buf, l.offset, l.length);
        const n = meta.count, q = 1 / meta.unitsPerMetre;
        const xy = new Float32Array(a.coords.length);
        for (let i = 0; i < xy.length; i++) xy[i] = a.coords[i] * q;
        const polys = new Array(n);
        let p = 0;
        for (let i = 0; i < n; i++) {
            const c = a.count[i] * 2;
            polys[i] = xy.subarray(p, p + c);
            p += c;
        }
        const era = new Uint8Array(n);
        for (let i = 0; i < n; i++) era[i] = eraOf(a.year[i]);
        // layer data must keep its identity across renders, or deck.gl re-tessellates every frame
        const flat = (rings) => rings.map((r) => Float32Array.from(r));
        ctx.greenRings = flat(ctx.green);
        ctx.waterRings = flat(ctx.water);
        ctx.quartiers.forEach((d) => {
            d.path = Float32Array.from([...d.ring, d.ring[0], d.ring[1]]);
            d.centre = centroid(d.ring);
        });
        const ids = Array.from({ length: n }, (_, i) => i);
        // ids in order of year, to pick the buildings rising in a range of years
        const byYear = Int32Array.from(ids).sort((x, y) => a.year[x] - a.year[y]);
        const yearsSorted = Int16Array.from(byYear, (i) => a.year[i]);
        const occ = new Array(n);
        for (const k in occJson) occ[+k] = occJson[k];
        D = { meta, ctx, media, occ, n, polys, era, ...a, ids, byYear, yearsSorted };
    }

    /* ---------- map ---------- */
    function buildingColor(i) {
        if (state.mode === "use") {
            const o = D.occ[i];
            return o && (!state.useOnly || o.c === state.useOnly) ? USE_COLORS[o.c] : NO_USE;
        }
        let c = state.mode === "period" ? ERAS[D.era[i]].color : lerpColor(HEIGHT_STOPS, D.height[i] / 10);
        if (state.mode === "period" && D.src[i] === 4) c = mix(c, MUTE, 0.55);
        return c;
    }

    /* ---------- buildings rising ----------
       When the end year moves forward, the buildings it reveals rise from the ground over GROW_MS.
       grow.yg is the year up to which every building is fully up; grow.hist records when the end
       year passed each value, which gives each rising building its start time. */
    const GROW_MS = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    const grow = { yg: MAX_YEAR, hist: [], ids: [], key: "", frame: 0, raf: 0 };

    const upperBound = (arr, v) => {
        let a = 0, b = arr.length;
        while (a < b) { const m = (a + b) >> 1; if (arr[m] <= v) a = m + 1; else b = m; }
        return a;
    };

    function trackGrowth() {
        if (!GROW_MS || state.hi < grow.yg) {
            grow.yg = state.hi;
            grow.hist = [];
            return;
        }
        if (state.hi === grow.yg) return;
        const last = grow.hist[grow.hist.length - 1];
        if (!last || last[1] !== state.hi) grow.hist.push([performance.now(), state.hi]);
        if (!grow.raf) grow.raf = requestAnimationFrame(growTick);
    }

    function growTick() {
        const now = performance.now();
        while (grow.hist.length && now - grow.hist[0][0] >= GROW_MS) grow.yg = Math.max(grow.yg, grow.hist.shift()[1]);
        if (!grow.hist.length) grow.yg = Math.max(grow.yg, state.hi);
        grow.frame++;
        grow.raf = grow.hist.length ? requestAnimationFrame(growTick) : 0;
        // while playing or building, their own loop redraws every frame
        if (!state.playing && !state.building) deckgl.setProps({ layers: layers() });
    }

    function risingIds() {
        const key = `${grow.yg}|${state.hi}|${state.lo}|${state.recordedOnly}`;
        if (key !== grow.key) {
            grow.key = key;
            const a = upperBound(D.yearsSorted, Math.max(grow.yg, state.lo - 1)), b = upperBound(D.yearsSorted, state.hi);
            const maxSrc = state.recordedOnly ? 3 : 4;
            grow.ids = Array.from(D.byYear.subarray(a, b)).filter((i) => D.src[i] <= maxSrc);
        }
        return grow.ids;
    }

    function riseOf(i) {
        const y = D.year[i], now = performance.now();
        const h = grow.hist.find((e) => e[1] >= y);
        const p = h ? Math.min(1, Math.max(0, (now - h[0]) / GROW_MS)) : 1;
        return 1 - Math.pow(1 - p, 3);
    }

    function layers() {
        const common = { coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS, coordinateOrigin: D.meta.origin };
        const out = [];
        if (state.context) {
            out.push(new SolidPolygonLayer({ id: "green", ...common, data: D.ctx.greenRings, positionFormat: "XY", getPolygon: (d) => d, getFillColor: [26, 46, 34] }));
            out.push(new SolidPolygonLayer({ id: "water", ...common, data: D.ctx.waterRings, positionFormat: "XY", getPolygon: (d) => d, getFillColor: [32, 70, 112] }));
        }
        out.push(new PathLayer({
            id: "quartiers", ...common, data: D.ctx.quartiers, positionFormat: "XY",
            getPath: (d) => d.path, getColor: [255, 255, 255, 34], getWidth: 1, widthUnits: "pixels",
        }));
        out.push(new SolidPolygonLayer({
            id: "buildings", ...common, data: D.ids, positionFormat: "XY",
            extruded: true, wireframe: false, pickable: true, autoHighlight: true,
            highlightColor: [255, 255, 255, 200],
            getPolygon: (i) => D.polys[i],
            getElevation: (i) => D.height[i] / 10,
            getFillColor: buildingColor,
            getFilterValue: (i) => [D.year[i], D.src[i]],
            filterRange: [[state.lo, Math.min(state.hi, grow.yg)], [0, state.recordedOnly ? 3 : 4]],
            extensions: [new DataFilterExtension({ filterSize: 2 })],
            material: { ambient: 0.45, diffuse: 0.65, shininess: 12, specularColor: [40, 40, 40] },
            updateTriggers: { getFillColor: [state.mode, state.useOnly] },
            onHover,
            onClick: (info) => openCard(info.index),
        }));
        if (grow.yg < state.hi) {
            out.push(new SolidPolygonLayer({
                id: "buildings-rising", ...common, data: risingIds(), positionFormat: "XY",
                extruded: true, wireframe: false,
                getPolygon: (i) => D.polys[i],
                getElevation: (i) => (D.height[i] / 10) * riseOf(i),
                getFillColor: (i) => mix(buildingColor(i), [255, 236, 190], 0.35 * (1 - riseOf(i))),
                material: { ambient: 0.45, diffuse: 0.65, shininess: 12, specularColor: [40, 40, 40] },
                updateTriggers: { getElevation: grow.frame, getFillColor: [grow.frame, state.mode, state.useOnly] },
            }));
        }
        out.push(new TextLayer({
            id: "quartier-names", ...common, data: D.ctx.quartiers,
            getPosition: (d) => d.centre, getText: (d) => d.name.toUpperCase(),
            getSize: 10.5, getColor: [200, 205, 215, 120], fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 600, characterSet: "auto", parameters: { depthCompare: "always" },
        }));
        out.push(new ScatterplotLayer({
            id: "landmark-dots", data: LANDMARKS, getPosition: (d) => [d.lon, d.lat, 0],
            getRadius: 3, radiusUnits: "pixels", getFillColor: [255, 255, 255], parameters: { depthCompare: "always" },
        }));
        out.push(new TextLayer({
            id: "landmarks", data: LANDMARKS, getPosition: (d) => [d.lon, d.lat, 0], getText: (d) => T().landmarks[d.k],
            getSize: 12.5, getColor: [255, 255, 255], getTextAnchor: (d) => d.anchor, getPixelOffset: (d) => [d.anchor === "end" ? -7 : 7, 0],
            fontFamily: "Barlow, sans-serif", fontWeight: 600, characterSet: "auto",
            outlineWidth: 3, outlineColor: [14, 17, 22, 230], fontSettings: { sdf: true },
            parameters: { depthCompare: "always" }, updateTriggers: { getText: [state.lang] },
        }));
        return out;
    }

    function render() {
        $("tooltip").hidden = true; // the hovered building may just have been filtered out
        trackGrowth();
        deckgl.setProps({ layers: layers() });
        updateCount();
        drawHist();
        placeHandles();
        updateRulers();
        updateEvents();
    }

    /* ---------- timeline tooltip: the reign, its buildings and events under the pointer ---------- */
    let reignStats;
    function computeReignStats() {
        reignStats = RULERS.map((r) => {
            const a = upperBound(D.yearsSorted, r.from - 1), b = upperBound(D.yearsSorted, r.to - 1 + (r.to >= MAX_YEAR ? 1 : 0));
            let rec = 0;
            for (let k = a; k < b; k++) if (D.src[D.byYear[k]] < 4) rec++;
            return { n: b - a, rec };
        });
    }

    function showTimelineTip(ev) {
        if (ev.pointerType === "touch") return;
        const t = T(), L = state.lang;
        const r = $("track").getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
        const y = xToYear(x);
        const k = RULERS.findIndex((q) => y >= q.from && y < q.to);
        const tip = $("tl-tip");
        const decade = y < SPLIT;
        const y0 = decade ? Math.floor(y / 10) * 10 : y;
        const nYear = upperBound(D.yearsSorted, decade ? y0 + 9 : y0) - upperBound(D.yearsSorted, y0 - 1);
        let html = `<div class="tt-year">${decade ? y0 + "s" : y}<span>${decade ? t.tlDecade(fmt(nYear), y0) : t.tlYear(fmt(nYear), y0)}</span></div>`;
        if (k >= 0) {
            const q = RULERS[k], st = reignStats[k];
            const evs = EVENTS.filter((e) => e.year >= q.from && e.year < q.to);
            html += `<div class="tt-ruler">♛ ${escapeHtml(q.name[L])} <span>${t.tlReign} ${q.from}–${Math.min(q.to, MAX_YEAR)}</span></div>` +
                `<p class="tt-bio">${escapeHtml(q.bio[L])}</p>` +
                `<p class="tt-stat">${t.tlStill(fmt(st.n), fmt(st.rec))}</p>` +
                (evs.length ? `<div class="tt-events"><b>${t.tlEvents}</b>${evs.map((e) => `<div><span>${e.year}</span>${escapeHtml(e.text[L])}</div>`).join("")}</div>` : "");
        }
        html += `<div class="tt-hint">${t.tlClick}</div>`;
        tip.innerHTML = html;
        tip.hidden = false;
        const w = tip.offsetWidth, W = r.width;
        tip.style.left = `${Math.min(W - w / 2, Math.max(w / 2, x * W))}px`;
        // the guide line follows the pointer
        $("tl-guide").style.left = `${x * 100}%`;
        $("tl-guide").hidden = false;
    }

    function hideTimelineTip() {
        $("tl-tip").hidden = true;
        $("tl-guide").hidden = true;
    }

    /* ---------- dated events on the timeline ---------- */
    function buildEvents() {
        const box = $("events");
        box.innerHTML = "";
        EVENTS.forEach((e, j) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "tl-event";
            b.style.left = `${yearToX(e.year) * 100}%`;
            b.title = `${e.year} · ${e.text[state.lang]}`;
            b.setAttribute("aria-label", b.title);
            b.addEventListener("pointerdown", (ev) => ev.stopPropagation());
            b.addEventListener("click", () => {
                stop();
                state.lo = MIN_YEAR;
                state.hi = e.year;
                followTimeline();
                render();
            });
            box.appendChild(b);
        });
    }

    // the latest event at or before the end year is told in a bubble above the timeline
    let lastEvent = -2;
    function updateEvents() {
        let k = -1;
        EVENTS.forEach((e, j) => { if (e.year <= state.hi) k = j; });
        if (state.building || (state.hi >= MAX_YEAR && !state.playing && state.chapter < 0)) k = -1;
        document.querySelectorAll(".tl-event").forEach((el, j) => el.classList.toggle("on", j === k));
        const bub = $("bubble");
        if (k < 0) { bub.hidden = true; lastEvent = -1; return; }
        const e = EVENTS[k];
        if (k !== lastEvent) {
            bub.innerHTML = `<b>${e.year}</b> ${escapeHtml(e.text[state.lang])}`;
            bub.classList.remove("pop");
            void bub.offsetWidth; // restart the pop animation
            bub.classList.add("pop");
            lastEvent = k;
        }
        bub.hidden = false;
        const W = $("track").clientWidth, w = bub.offsetWidth;
        bub.style.left = `${Math.min(W - w / 2, Math.max(w / 2, yearToX(e.year) * W))}px`;
    }

    function flyTo(view) {
        deckgl.setProps({
            initialViewState: { ...view, maxPitch: 75, transitionDuration: 2200, transitionInterpolator: new FlyToInterpolator({ speed: 1.6 }) },
        });
    }

    /* ---------- hover ---------- */
    function onHover(info) {
        const tip = $("tooltip");
        const i = info.index;
        if (i == null || i < 0) { tip.hidden = true; return; }
        tip.innerHTML = describe(i) + (D.meta.refs[i] || D.occ[i] ? `<div class="hint">${T().clickHint}</div>` : "");
        tip.hidden = false;
        const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
        let x = info.x + pad, yy = info.y + pad;
        if (x + w > window.innerWidth - 8) x = info.x - w - pad;
        if (yy + h > window.innerHeight - 8) yy = info.y - h - pad;
        tip.style.left = `${Math.max(8, x)}px`;
        tip.style.top = `${Math.max(8, yy)}px`;
    }

    // name, date, ruler, source, height: shared by the tooltip and the pinned card
    function describe(i) {
        const t = T();
        const src = D.src[i], y = D.year[i], lo = D.lo[i], hi = D.hi[i];
        const quarter = D.meta.quartiers[D.quartier[i]];
        const name = nameOf(i);
        const when = src <= 1 ? String(y) : src === 4 ? `${t.about_} ${y}` : `${lo}–${hi}`;
        const ref = D.meta.refs[i];
        const srcLine = src === 4
            ? `${t.src[4]} ${quarter}, ${t.era} ${lo <= 1500 ? t.before + " " + (hi + 1) : lo + "–" + hi}`
            : t.src[src] + (ref ? ` · ${ref}` : "");
        const ruler = rulerAt(y);
        return `<b>${escapeHtml(name)}</b>` +
            `<div class="y">${when}</div>` +
            (ruler ? `<div class="ruler">${escapeHtml(ruler.name[state.lang])}</div>` : "") +
            `<div class="src">${escapeHtml(srcLine)}</div>` +
            `<div>${(D.height[i] / 10).toFixed(1).replace(".", t.decimal)} m · ${escapeHtml(quarter)}</div>` +
            (D.flags[i] & 1 ? `<span class="tag">${t.monument}</span>` : "") +
            occupantsShort(i);
    }

    const useTag = (u) => `<span class="use-tag"><i style="background:rgb(${USE_COLORS[u]})"></i>${T().uses[u]}</span>`;

    function occupantsShort(i) {
        const o = D.occ[i];
        if (!o) return "";
        const names = o.o.slice(0, 3).map((x) => escapeHtml(x[0])).join(" · ");
        return `<div class="occ">${useTag(o.c)}<div>${names}${o.n > 3 ? ` <span class="more">${T().more(o.n - 3)}</span>` : ""}</div></div>`;
    }

    function occupantsFull(i) {
        const o = D.occ[i];
        if (!o) return "";
        const t = T();
        const rows = o.o.map(([name, u, web, ref]) => {
            const refUrl = /^Q\d+$/.test(ref) ? `https://www.wikidata.org/wiki/${ref}` : `https://www.openstreetmap.org/${ref}`;
            const site = web ? ` · ${ext(web, t.website)}` : "";
            return `<li><i style="background:rgb(${USE_COLORS[u]})"></i><span>${ext(refUrl, escapeHtml(name))}${site}<small>${t.uses[u]}</small></span></li>`;
        }).join("");
        const more = o.n > o.o.length ? `<p class="more">${t.more(o.n - o.o.length)}</p>` : "";
        return `<h4>${t.whoIsHere}</h4><ul class="occ-list">${rows}</ul>${more}`;
    }

    // Wikidata label in the reader's language when the item has one
    function nameOf(i) {
        const item = D.media.items[D.meta.refs[i]];
        const l = item && item.label;
        const o = D.occ[i];
        return (l && (l[state.lang] || l.en || l.fr || l.lb)) || D.meta.names[D.name[i]] || (o && o.o[0][0]) || T().building;
    }

    /* ---------- photos and links ---------- */
    const ext = (url, text) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${text}</a>`;

    function photoHtml(p, alt) {
        if (!p) return "";
        const lic = p.licenceUrl ? ext(p.licenceUrl, escapeHtml(p.licence)) : escapeHtml(p.licence);
        return `<figure class="card-photo"><img src="${escapeHtml(p.thumb)}" alt="${escapeHtml(alt)}" loading="lazy">` +
            `<figcaption>${T().photoBy}: ${ext(p.page, escapeHtml(p.artist))} · ${lic} · Wikimedia Commons</figcaption></figure>`;
    }

    // the Wikipedia article in the reader's language, else the first that exists, marked with its language
    function wikiLink(l) {
        const L = state.lang;
        const lang = l.wiki[L] ? L : ["en", "fr", "lb"].find((x) => l.wiki[x]);
        if (!lang) return "";
        const label = l.label[lang] || l.label.en || l.qid;
        return ext(l.wiki[lang], escapeHtml(label)) + (lang !== L ? ` <span class="lang-tag">${lang.toUpperCase()}</span>` : "");
    }

    function openCard(i) {
        if (i == null || i < 0) return;
        state.card = i;
        const t = T(), ref = D.meta.refs[i] || "";
        const item = ref.startsWith("Q") ? D.media.items[ref] : null;
        const name = nameOf(i);
        const links = [];
        if (item) {
            const w = wikiLink(item);
            if (w) links.push(w);
            links.push(ext(`https://www.wikidata.org/wiki/${ref}`, t.wikidata));
        } else if (ref) {
            links.push(ext(`https://www.openstreetmap.org/${ref}`, t.osm));
        }
        $("card-body").innerHTML =
            (item ? photoHtml(item.photo, name) || `<p class="no-photo">${t.noPhoto}</p>` : "") +
            describe(i).replace(occupantsShort(i), "") +
            (links.length ? `<p class="card-links">${links.join(" · ")}</p>` : "") +
            occupantsFull(i);
        $("card").hidden = false;
        $("tooltip").hidden = true;
    }

    function closeCard() {
        state.card = -1;
        $("card").hidden = true;
    }

    const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const fmt = (v) => v.toLocaleString(T().locale);

    /* ---------- counts & legend ---------- */
    function updateCount() {
        const t = T();
        let shown = 0;
        const maxSrc = state.recordedOnly ? 3 : 4;
        for (let i = 0; i < D.n; i++) if (D.year[i] >= state.lo && D.year[i] <= state.hi && D.src[i] <= maxSrc) shown++;
        $("count").innerHTML = t.count(fmt(shown), fmt(D.n));
        $("year-label").textContent = state.lo > MIN_YEAR ? `${state.lo}–${state.hi}` : state.hi;
        $("range-label").textContent =
            state.lo === MIN_YEAR && state.hi === MAX_YEAR ? t.allBuildings
                : state.lo === MIN_YEAR ? t.builtUpTo(state.hi) : t.builtInRange;
        const r = rulerAt(state.hi);
        $("ruler-label").textContent = r ? r.name[state.lang] : "";
        if (state.mode === "period") {
            document.querySelectorAll("#legend-list li").forEach((li, k) => {
                const e = ERAS[k];
                li.classList.toggle("off", e.to < state.lo || e.from > state.hi);
            });
        }
    }

    function buildLegend() {
        const t = T();
        const list = $("legend-list");
        list.innerHTML = "";
        document.querySelector(".ramp-axis")?.remove();
        document.querySelector(".legend-use-note")?.remove();
        if (state.mode === "use") {
            $("legend-title").textContent = t.legendUse;
            $("ramp").style.display = "none";
            document.querySelector(".legend-note").style.display = "none";
            const counts = Object.fromEntries(USES.map((u) => [u, 0]));
            let none = 0;
            for (let i = 0; i < D.n; i++) if (D.occ[i]) counts[D.occ[i].c]++; else none++;
            USES.forEach((u) => {
                const li = document.createElement("li");
                li.tabIndex = 0;
                li.setAttribute("role", "button");
                li.classList.toggle("off", !!state.useOnly && state.useOnly !== u);
                li.title = t.showOnly(t.uses[u]);
                li.innerHTML = `<span class="swatch" style="background:rgb(${USE_COLORS[u]})"></span><span>${t.uses[u]}</span><span class="n">${fmt(counts[u])}</span>`;
                const pick = () => { state.useOnly = state.useOnly === u ? null : u; buildLegend(); render(); };
                li.addEventListener("click", pick);
                li.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
                list.appendChild(li);
            });
            list.insertAdjacentHTML("beforeend", `<li class="static"><span class="swatch" style="background:rgb(${NO_USE})"></span><span>${t.uses.none}</span><span class="n">${fmt(none)}</span></li>`);
            list.insertAdjacentHTML("afterend", `<p class="legend-use-note">${t.useNote}</p>`);
            return;
        }
        if (state.mode === "height") {
            $("legend-title").textContent = t.legendHeight;
            $("ramp").style.display = "";
            $("ramp").style.background = `linear-gradient(to right, ${HEIGHT_STOPS.map(([v, c]) => `rgb(${c}) ${(v / 120) * 100}%`).join(",")})`;
            const ax = document.createElement("div");
            ax.className = "ramp-axis";
            ax.innerHTML = "<span>0 m</span><span>30</span><span>60</span><span>120 m</span>";
            $("ramp").after(ax);
            document.querySelector(".legend-note").style.display = "none";
            return;
        }
        $("legend-title").textContent = t.legendPeriod;
        $("ramp").style.display = "none";
        document.querySelector(".legend-note").style.display = "";
        const counts = ERAS.map(() => 0);
        for (let i = 0; i < D.n; i++) if (!state.recordedOnly || D.src[i] < 4) counts[D.era[i]]++;
        ERAS.forEach((e, k) => {
            const [label, sub] = t.eras[k];
            const li = document.createElement("li");
            li.tabIndex = 0;
            li.setAttribute("role", "button");
            li.title = t.showOnly(`${label}${sub ? " (" + sub + ")" : ""}`);
            li.innerHTML = `<span class="swatch" style="background:rgb(${e.color})"></span>` +
                `<span>${label}${sub ? `<small>${sub}</small>` : ""}</span><span class="n">${fmt(counts[k])}</span>`;
            const pick = () => {
                stop();
                const alone = state.lo === e.from && state.hi === e.to;
                state.lo = alone ? MIN_YEAR : e.from;
                state.hi = alone ? MAX_YEAR : e.to;
                followTimeline();
                render();
            };
            li.addEventListener("click", pick);
            li.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
            list.appendChild(li);
        });
    }

    /* ---------- story ---------- */
    const rulerAt = (y) => RULERS.find((r) => y >= r.from && y < r.to) || (y >= MAX_YEAR ? RULERS[RULERS.length - 1] : null);
    const chapterEnd = (k) => (k < CHAPTERS.length - 1 ? CHAPTERS[k + 1].year - 1 : MAX_YEAR);
    function chapterAt(y) {
        let k = -1;
        CHAPTERS.forEach((c, j) => { if (y >= c.year) k = j; });
        return k;
    }

    function goToChapter(k) {
        stop();
        state.chapter = k;
        state.lo = MIN_YEAR;
        state.hi = k < 0 ? MAX_YEAR : chapterEnd(k);
        flyTo(k < 0 ? INTRO.view : CHAPTERS[k].view);
        renderStory();
        render();
    }

    // when the user moves the timeline, the story follows without moving the camera
    function followTimeline() {
        const k = chapterAt(state.hi);
        if (k !== state.chapter && !(state.chapter === -1 && state.hi === MAX_YEAR && state.lo === MIN_YEAR)) {
            state.chapter = k;
            renderStory();
        }
    }

    function renderStory() {
        const t = T(), L = state.lang, k = state.chapter, n = CHAPTERS.length;
        if (k < 0) {
            $("story-step").textContent = t.intro;
            $("story-year").textContent = `${CHAPTERS[0].year}–${MAX_YEAR}`;
            $("story-title").textContent = INTRO.title[L];
            $("story-ruler").textContent = "";
            $("story-text").textContent = INTRO.text[L];
            $("story-next").textContent = t.begin;
        } else {
            const c = CHAPTERS[k], r = rulerAt(c.year);
            $("story-step").textContent = t.chapter(k + 1, n);
            $("story-year").textContent = k === n - 1 ? String(c.year) : `${c.year}–${chapterEnd(k)}`;
            $("story-title").textContent = c.title[L];
            $("story-ruler").textContent = r ? r.name[L] : "";
            $("story-text").textContent = c.text[L];
            $("story-next").textContent = k === n - 1 ? t.restart : t.next;
        }
        const m = k < 0 ? D.media.intro : D.media.chapters[k];
        const title = $("story-title").textContent;
        if (m && m.photo) {
            const p = m.photo;
            $("story-img").src = p.thumb;
            $("story-img").alt = title;
            const lic = p.licenceUrl ? ext(p.licenceUrl, escapeHtml(p.licence)) : escapeHtml(p.licence);
            $("story-credit").innerHTML = `${t.photoBy}: ${ext(p.page, escapeHtml(p.artist))} · ${lic} · Wikimedia Commons`;
            $("story-photo").hidden = false;
        } else {
            $("story-photo").hidden = true;
        }
        const links = (m ? m.links : []).map(wikiLink).filter(Boolean);
        $("story-links").innerHTML = links.length ? `<span>${t.readMore}:</span> ${links.join(" · ")}` : "";
        $("story-prev").textContent = t.earlier;
        $("story-prev").disabled = k < 0;
        $("story").scrollTop = 0;
        document.querySelectorAll(".tl-chapter").forEach((el, j) => el.classList.toggle("on", j === k));
    }

    function buildRulers() {
        const box = $("rulers");
        box.innerHTML = "";
        const W = box.clientWidth || 1;
        RULERS.forEach((r, j) => {
            const a = yearToX(Math.max(r.from, MIN_YEAR)), b = yearToX(Math.min(r.to, MAX_YEAR + 1));
            const el = document.createElement("div");
            el.className = "tl-reign" + (j % 2 ? " alt" : "");
            el.style.left = `${a * 100}%`;
            el.style.width = `${(b - a) * 100}%`;
            el.title = `${r.name[state.lang]} (${r.from}–${Math.min(r.to, MAX_YEAR)})`;
            const label = r.short[state.lang];
            if ((b - a) * W > label.length * 6.2 + 8) el.textContent = label;
            el.dataset.from = r.from;
            box.appendChild(el);
        });
        CHAPTERS.forEach((c, j) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "tl-chapter";
            dot.style.left = `${yearToX(c.year) * 100}%`;
            dot.title = `${c.year} · ${c.title[state.lang]}`;
            dot.setAttribute("aria-label", dot.title);
            dot.addEventListener("pointerdown", (ev) => ev.stopPropagation());
            dot.addEventListener("click", () => goToChapter(j));
            box.appendChild(dot);
        });
    }

    function updateRulers() {
        const cur = rulerAt(state.hi);
        document.querySelectorAll(".tl-reign").forEach((el, j) => el.classList.toggle("on", RULERS[j] === cur));
    }

    function setStory(on) {
        state.story = on;
        document.body.classList.toggle("story-on", on);
        $("t-story").classList.toggle("on", on);
        $("t-story").setAttribute("aria-pressed", on);
    }

    /* ---------- timeline ---------- */
    // early centuries are squeezed so the 19th and 20th get the room
    const SPLIT = 1800, SPLIT_X = 0.18;
    const yearToX = (y) => (y < SPLIT ? ((y - MIN_YEAR) / (SPLIT - MIN_YEAR)) * SPLIT_X : SPLIT_X + ((y - SPLIT) / (MAX_YEAR - SPLIT)) * (1 - SPLIT_X));
    const xToYear = (x) => Math.round(x < SPLIT_X ? MIN_YEAR + (x / SPLIT_X) * (SPLIT - MIN_YEAR) : SPLIT + ((x - SPLIT_X) / (1 - SPLIT_X)) * (MAX_YEAR - SPLIT));

    let histBins;
    function computeHist() {
        // one bin per decade before 1800, per year after
        const keys = [];
        for (let y = MIN_YEAR; y < SPLIT; y += 10) keys.push([y, y + 9]);
        for (let y = SPLIT; y <= MAX_YEAR; y++) keys.push([y, y]);
        const rec = new Float32Array(keys.length), est = new Float32Array(keys.length);
        const index = (y) => (y < SPLIT ? Math.floor((Math.max(y, MIN_YEAR) - MIN_YEAR) / 10) : (SPLIT - MIN_YEAR) / 10 + (y - SPLIT));
        for (let i = 0; i < D.n; i++) {
            const k = index(Math.min(D.year[i], MAX_YEAR));
            if (D.src[i] === 4) est[k]++; else rec[k]++;
        }
        histBins = keys.map((k, j) => ({ from: k[0], to: k[1], rec: rec[j] / (k[1] - k[0] + 1), est: est[j] / (k[1] - k[0] + 1) }));
    }

    function drawHist() {
        const cv = $("hist"), dpr = window.devicePixelRatio || 1;
        const W = cv.clientWidth, H = cv.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        const g = cv.getContext("2d");
        g.scale(dpr, dpr);
        g.clearRect(0, 0, W, H);
        const show = (b) => (state.recordedOnly ? b.rec : b.rec + b.est);
        const sorted = histBins.map(show).sort((a, b) => a - b);
        const max = Math.max(1, sorted[Math.floor(sorted.length * 0.995)]);
        for (const b of histBins) {
            const x0 = yearToX(b.from) * W, x1 = yearToX(b.to + 1) * W;
            const w = Math.max(1, x1 - x0 - 0.6);
            const inRange = b.to >= state.lo && b.from <= state.hi;
            const c = ERAS[eraOf(b.from)].color;
            const hr = Math.min(H, (b.rec / max) * H);
            const he = state.recordedOnly ? 0 : Math.min(H - hr, (b.est / max) * H);
            g.globalAlpha = inRange ? 1 : 0.22;
            g.fillStyle = `rgb(${c})`;
            g.fillRect(x0, H - hr, w, hr);
            g.fillStyle = `rgb(${mix(c, MUTE, 0.55)})`;
            g.fillRect(x0, H - hr - he, w, he);
        }
        g.globalAlpha = 1;
    }

    function buildAxis() {
        const ticks = window.innerWidth < 600 ? [1000, 1800, 1850, 1900, 1950, 2000] : [1000, 1200, 1400, 1600, 1800, 1850, 1900, 1950, 2000];
        $("axis").innerHTML = ticks.map((y) => `<span style="left:${yearToX(y) * 100}%">${y}</span>`).join("");
    }

    function placeHandles() {
        const a = yearToX(state.lo) * 100, b = yearToX(state.hi) * 100;
        $("h-lo").style.left = `${a}%`;
        $("h-hi").style.left = `${b}%`;
        $("range-fill").style.left = `${a}%`;
        $("range-fill").style.width = `${b - a}%`;
        $("h-lo").setAttribute("aria-valuenow", state.lo);
        $("h-hi").setAttribute("aria-valuenow", state.hi);
    }

    function dragHandle(el, which) {
        el.setAttribute("role", "slider");
        el.setAttribute("aria-valuemin", MIN_YEAR);
        el.setAttribute("aria-valuemax", MAX_YEAR);
        const setFromEvent = (ev) => {
            const r = $("track").getBoundingClientRect();
            const y = xToYear(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)));
            if (which === "lo") state.lo = Math.min(y, state.hi);
            else state.hi = Math.max(y, state.lo);
            followTimeline();
            render();
        };
        el.addEventListener("pointerdown", (ev) => {
            stop();
            el.setPointerCapture(ev.pointerId);
            const move = (e) => setFromEvent(e);
            const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerup", up);
        });
        el.addEventListener("keydown", (ev) => {
            const step = ev.shiftKey ? 10 : 1;
            const d = ev.key === "ArrowRight" || ev.key === "ArrowUp" ? step : ev.key === "ArrowLeft" || ev.key === "ArrowDown" ? -step : 0;
            if (!d) return;
            ev.preventDefault();
            stop();
            if (which === "lo") state.lo = Math.max(MIN_YEAR, Math.min(state.lo + d, state.hi));
            else state.hi = Math.min(MAX_YEAR, Math.max(state.hi + d, state.lo));
            followTimeline();
            render();
        });
    }

    /* ---------- play ---------- */
    let raf = 0;
    const PLAY_ICON = '<path d="M8 5v14l11-7z"/>', PAUSE_ICON = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
    function play() {
        state.playing = true;
        $("play").querySelector("svg").innerHTML = PAUSE_ICON;
        $("play").setAttribute("aria-label", T().pause);
        let x = state.hi >= MAX_YEAR ? yearToX(state.lo) : yearToX(state.hi);
        let last = performance.now();
        const step = (t) => {
            x += (t - last) / 36000;
            last = t;
            state.hi = Math.max(state.lo, Math.min(MAX_YEAR, xToYear(Math.min(1, x))));
            followTimeline();
            render();
            if (x >= 1) return stop();
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
    }
    function stop() {
        if (state.building) endBuild();
        if (!state.playing) return;
        state.playing = false;
        cancelAnimationFrame(raf);
        $("play").querySelector("svg").innerHTML = PLAY_ICON;
        $("play").setAttribute("aria-label", T().play);
    }

    /* ---------- opening: the city builds itself ---------- */
    let buildRaf = 0;
    function buildCity() {
        if (!GROW_MS) return;
        state.building = true;
        state.hi = MIN_YEAR;
        grow.yg = MIN_YEAR;
        grow.hist = [];
        const t0 = performance.now(), dur = 5000;
        const step = (t) => {
            const p = Math.min(1, (t - t0) / dur);
            state.hi = xToYear(p * p * (3 - 2 * p)); // ease in and out across the timeline
            $("building").textContent = `${T().buildingCity} ${Math.round(p * 100)} %`;
            render();
            if (p >= 1) return endBuild();
            buildRaf = requestAnimationFrame(step);
        };
        $("building").hidden = false;
        buildRaf = requestAnimationFrame(step);
    }
    function endBuild() {
        cancelAnimationFrame(buildRaf);
        state.building = false;
        $("building").hidden = true;
        if (state.hi < MAX_YEAR && state.chapter < 0 && !state.playing) {
            state.hi = MAX_YEAR;
            render();
        }
    }

    /* ---------- language ---------- */
    function pickLang() {
        const q = new URLSearchParams(location.search).get("lang");
        if (I18N[q]) return q;
        try {
            const s = localStorage.getItem("lux-age-lang");
            if (I18N[s]) return s;
        } catch (e) { /* storage blocked */ }
        const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
        return I18N[nav] ? nav : "en";
    }

    function setLang(l) {
        state.lang = l;
        try { localStorage.setItem("lux-age-lang", l); } catch (e) { /* storage blocked */ }
        const t = T();
        document.documentElement.lang = l;
        document.title = t.pageTitle;
        document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.dataset.i18n]; });
        document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === l));
        $("play").setAttribute("aria-label", state.playing ? t.pause : t.play);
        $("h-lo").setAttribute("aria-label", t.startYear);
        $("h-hi").setAttribute("aria-label", t.endYear);
        $("close-story").setAttribute("aria-label", t.hideStory);
        $("loading").textContent = t.loading;
        if (!D) return;
        $("about-body").innerHTML = t.aboutHtml;
        fillAbout();
        buildLegend();
        buildRulers();
        buildEvents();
        renderStory();
        render();
        if (state.card >= 0) openCard(state.card);
    }

    function fillAbout() {
        const s = D.meta.stats;
        const pct = (v) => (v / s.total < 0.005 ? "<1 %" : `${Math.round((v / s.total) * 100)} %`);
        $("about-stats").innerHTML = T().stats(s, fmt, pct).map((x) => `<li>${x}</li>`).join("");
        $("built").textContent = new Date(D.meta.built).toLocaleDateString(T().locale, { day: "numeric", month: "long", year: "numeric" });
    }

    /* ---------- wiring ---------- */
    function wire() {
        document.querySelectorAll(".seg button[data-mode]").forEach((b) => b.addEventListener("click", () => {
            state.mode = b.dataset.mode;
            document.querySelectorAll(".seg button[data-mode]").forEach((o) => o.classList.toggle("on", o === b));
            buildLegend();
            render();
        }));
        document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
        const toggle = (id, key) => $(id).addEventListener("click", () => {
            state[key] = !state[key];
            $(id).classList.toggle("on", state[key]);
            $(id).setAttribute("aria-pressed", state[key]);
            buildLegend();
            render();
        });
        toggle("t-context", "context");
        toggle("t-recorded", "recordedOnly");
        $("t-story").addEventListener("click", () => setStory(!state.story));
        $("close-story").addEventListener("click", () => setStory(false));
        $("close-card").addEventListener("click", closeCard);
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCard(); });
        $("story-prev").addEventListener("click", () => goToChapter(Math.max(-1, state.chapter - 1)));
        $("story-next").addEventListener("click", () => goToChapter(state.chapter >= CHAPTERS.length - 1 ? -1 : state.chapter + 1));
        $("open-about").addEventListener("click", () => $("about").showModal());
        $("close-about").addEventListener("click", () => $("about").close());
        $("about").addEventListener("click", (e) => { if (e.target === $("about")) $("about").close(); });
        $("play").addEventListener("click", () => (state.playing ? stop() : play()));
        dragHandle($("h-lo"), "lo");
        dragHandle($("h-hi"), "hi");
        $("track").addEventListener("pointerdown", (ev) => {
            if (ev.target.classList.contains("handle")) return;
            stop();
            const r = $("track").getBoundingClientRect();
            const y = xToYear((ev.clientX - r.left) / r.width);
            if (Math.abs(y - state.lo) < Math.abs(y - state.hi) && y < state.hi) state.lo = y; else state.hi = Math.max(y, state.lo);
            followTimeline();
            render();
        });
        $("track").addEventListener("pointermove", showTimelineTip);
        $("track").addEventListener("pointerleave", hideTimelineTip);
        $("track").addEventListener("pointerdown", hideTimelineTip);
        window.addEventListener("resize", () => { buildAxis(); buildRulers(); buildEvents(); drawHist(); updateRulers(); updateEvents(); renderStory(); });
    }

    async function main() {
        setLang(pickLang());
        await load();
        deckgl = new Deck({
            parent: $("map"),
            views: new MapView({ repeat: false }),
            initialViewState: { ...INTRO.view, maxPitch: 75 },
            controller: true,
            layers: [],
            getCursor: ({ isHovering }) => (isHovering ? "pointer" : "grab"),
            parameters: { clearColor: [14 / 255, 17 / 255, 22 / 255, 1] },
        });
        computeHist();
        computeReignStats();
        buildAxis();
        wire();
        setLang(state.lang);
        $("loading").classList.add("done");
        buildCity();
    }

    main().catch((e) => {
        $("loading").textContent = T().loadError;
        console.error(e);
    });
})();
