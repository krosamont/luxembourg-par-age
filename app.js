/* Luxembourg par âge: deck.gl view of data/buildings.bin (written by pipeline/04_build.py). */
(() => {
    const { Deck, MapView, SolidPolygonLayer, PathLayer, TextLayer, ScatterplotLayer, COORDINATE_SYSTEM, DataFilterExtension } = deck;

    const MIN_YEAR = 1000; // abbaye d'Altmünster, 1083
    const MAX_YEAR = 2025; // a few Wikidata openings postdate the 2023 survey
    const ERAS = [
        { label: "Forteresse", sub: "avant 1815", from: MIN_YEAR, to: 1814, color: [104, 110, 236] },
        { label: "Forteresse fédérale", sub: "1815–66", from: 1815, to: 1866, color: [66, 152, 236] },
        { label: "Ville ouverte", sub: "1867–1918", from: 1867, to: 1918, color: [52, 198, 178] },
        { label: "Entre-deux-guerres", sub: "1919–45", from: 1919, to: 1945, color: [140, 208, 98] },
        { label: "Après-guerre", sub: "1946–70", from: 1946, to: 1970, color: [234, 214, 76] },
        { label: "Place financière", sub: "1971–98", from: 1971, to: 1998, color: [246, 160, 62] },
        { label: "1999–2010", sub: "", from: 1999, to: 2010, color: [240, 100, 72] },
        { label: "2011 à aujourd'hui", sub: "", from: 2011, to: MAX_YEAR, color: [228, 62, 124] },
    ];
    const HEIGHT_STOPS = [[0, [46, 58, 110]], [8, [52, 120, 176]], [16, [60, 186, 164]], [30, [190, 214, 84]], [60, [246, 160, 62]], [120, [236, 72, 96]]];
    const MUTE = [58, 60, 66];
    const SRC_LABEL = [
        "Wikidata (date de création ou d'inauguration)",
        "OpenStreetMap (start_date)",
        "Couche « Période de construction » (geoportail.lu)",
        "Absent du modèle 3D 2013 et de la couche des périodes",
        "Estimée d'après le profil du quartier",
    ];
    // hand-placed; coordinates from Wikidata where it has them
    const LANDMARKS = [
        ["Palais grand-ducal", 6.13221, 49.61096, "end"],
        ["Cathédrale", 6.13139, 49.60972, "end"],
        ["Casemates du Bock", 6.13698, 49.61178],
        ["Abbaye de Neumünster", 6.13750, 49.60944],
        ["Gare centrale", 6.13361, 49.59972],
        ["Pont Adolphe", 6.12667, 49.60778],
        ["Philharmonie", 6.14209, 49.61849],
        ["Fort Thüngen", 6.13889, 49.61639],
        ["Cour de justice de l'UE", 6.13944, 49.62000],
        ["Glacis", 6.12364, 49.61675],
        ["Centre hospitalier", 6.10109, 49.61870],
        ["Stade de Luxembourg", 6.10940, 49.57860],
    ];

    const $ = (id) => document.getElementById(id);
    const state = { mode: "period", context: true, recordedOnly: false, lo: MIN_YEAR, hi: MAX_YEAR, playing: false, hover: -1 };
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

    async function load() {
        const [meta, buf, ctx] = await Promise.all([
            fetch("data/meta.json").then((r) => r.json()),
            fetch("data/buildings.bin").then((r) => r.arrayBuffer()),
            fetch("data/context.json").then((r) => r.json()),
        ]);
        const T = { int16: Int16Array, uint16: Uint16Array, uint8: Uint8Array, uint32: Uint32Array };
        const a = {};
        for (const l of meta.layout) a[l.key] = new T[l.type](buf, l.offset, l.length);
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
        D = { meta, ctx, n, polys, era, ...a, ids: Array.from({ length: n }, (_, i) => i) };
    }

    function buildingColor(i) {
        let c = state.mode === "period" ? ERAS[D.era[i]].color : lerpColor(HEIGHT_STOPS, D.height[i] / 10);
        if (state.mode === "period" && D.src[i] === 4) c = mix(c, MUTE, 0.55);
        return c;
    }

    function layers() {
        const origin = D.meta.origin;
        const common = { coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS, coordinateOrigin: origin };
        const out = [];
        if (state.context) {
            out.push(new SolidPolygonLayer({
                id: "green", ...common, data: D.ctx.greenRings, positionFormat: "XY",
                getPolygon: (d) => d, getFillColor: [26, 46, 34],
            }));
            out.push(new SolidPolygonLayer({
                id: "water", ...common, data: D.ctx.waterRings, positionFormat: "XY",
                getPolygon: (d) => d, getFillColor: [32, 70, 112],
            }));
        }
        out.push(new PathLayer({
            id: "quartiers", ...common, data: D.ctx.quartiers, positionFormat: "XY",
            getPath: (d) => d.path,
            getColor: [255, 255, 255, 34], getWidth: 1, widthUnits: "pixels",
        }));
        out.push(new SolidPolygonLayer({
            id: "buildings", ...common, data: D.ids, positionFormat: "XY",
            extruded: true, wireframe: false, pickable: true, autoHighlight: true,
            highlightColor: [255, 255, 255, 200],
            getPolygon: (i) => D.polys[i],
            getElevation: (i) => D.height[i] / 10,
            getFillColor: buildingColor,
            getFilterValue: (i) => [D.year[i], D.src[i]],
            filterRange: [[state.lo, state.hi], [0, state.recordedOnly ? 3 : 4]],
            extensions: [new DataFilterExtension({ filterSize: 2 })],
            material: { ambient: 0.45, diffuse: 0.65, shininess: 12, specularColor: [40, 40, 40] },
            updateTriggers: { getFillColor: [state.mode] },
            onHover: onHover,
        }));
        out.push(new TextLayer({
            id: "quartier-names", ...common, data: D.ctx.quartiers,
            getPosition: (d) => d.centre, getText: (d) => d.name.toUpperCase(),
            getSize: 10.5, getColor: [200, 205, 215, 120], fontFamily: "Barlow Condensed, sans-serif",
            fontWeight: 600, characterSet: "auto", getPixelOffset: [0, 0],
            parameters: { depthCompare: "always" },
        }));
        out.push(new ScatterplotLayer({
            id: "landmark-dots", data: LANDMARKS, getPosition: (d) => [d[1], d[2], 0],
            getRadius: 3, radiusUnits: "pixels", getFillColor: [255, 255, 255], parameters: { depthCompare: "always" },
        }));
        out.push(new TextLayer({
            id: "landmarks", data: LANDMARKS, getPosition: (d) => [d[1], d[2], 0], getText: (d) => d[0],
            getSize: 12.5, getColor: [255, 255, 255], getTextAnchor: (d) => d[3] || "start", getPixelOffset: (d) => [d[3] === "end" ? -7 : 7, 0],
            fontFamily: "Barlow, sans-serif", fontWeight: 600, characterSet: "auto",
            outlineWidth: 3, outlineColor: [14, 17, 22, 230], fontSettings: { sdf: true },
            parameters: { depthCompare: "always" },
        }));
        return out;
    }

    function centroid(r) {
        let x = 0, y = 0;
        const m = r.length / 2;
        for (let k = 0; k < r.length; k += 2) { x += r[k]; y += r[k + 1]; }
        return [x / m, y / m];
    }

    function render() {
        $("tooltip").hidden = true; // the hovered building may just have been filtered out
        deckgl.setProps({ layers: layers() });
        updateCount();
        drawHist();
        placeHandles();
    }

    /* ---------- hover ---------- */
    function onHover(info) {
        const tip = $("tooltip");
        const i = info.index;
        if (i == null || i < 0) { tip.hidden = true; return; }
        const src = D.src[i], y = D.year[i], lo = D.lo[i], hi = D.hi[i];
        const name = D.meta.names[D.name[i]] || "Bâtiment";
        let when;
        if (src <= 1) when = String(y);
        else if (src === 4) when = `vers ${y}`;
        else when = `${lo}–${hi}`;
        const ref = D.meta.refs[i];
        const srcLine = src === 4
            ? `${SRC_LABEL[4]} ${D.meta.quartiers[D.quartier[i]]}, époque ${lo <= 1500 ? "avant " + (hi + 1) : lo + "–" + hi}`
            : SRC_LABEL[src] + (ref ? ` · ${ref}` : "");
        tip.innerHTML =
            `<b>${escapeHtml(name)}</b>` +
            `<div class="y">${when}</div>` +
            `<div class="src">${escapeHtml(srcLine)}</div>` +
            `<div>${(D.height[i] / 10).toFixed(1).replace(".", ",")} m · ${escapeHtml(D.meta.quartiers[D.quartier[i]])}</div>` +
            (D.flags[i] & 1 ? `<span class="tag">Monument protégé</span>` : "");
        tip.hidden = false;
        const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
        let x = info.x + pad, yy = info.y + pad;
        if (x + w > window.innerWidth - 8) x = info.x - w - pad;
        if (yy + h > window.innerHeight - 8) yy = info.y - h - pad;
        tip.style.left = `${Math.max(8, x)}px`;
        tip.style.top = `${Math.max(8, yy)}px`;
    }

    const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

    /* ---------- counts & legend ---------- */
    const fmt = (v) => v.toLocaleString("fr-FR");

    function updateCount() {
        let shown = 0;
        const maxSrc = state.recordedOnly ? 3 : 4;
        for (let i = 0; i < D.n; i++) if (D.year[i] >= state.lo && D.year[i] <= state.hi && D.src[i] <= maxSrc) shown++;
        $("count").innerHTML = `<strong>${fmt(shown)}</strong> sur ${fmt(D.n)} bâtiments debout aujourd'hui`;
        $("year-label").textContent = state.lo > MIN_YEAR ? `${state.lo}–${state.hi}` : state.hi;
        $("range-label").textContent =
            state.lo === MIN_YEAR && state.hi === MAX_YEAR ? "tous les bâtiments"
                : state.lo === MIN_YEAR ? `construits jusqu'en ${state.hi}` : "construits sur la période";
        document.querySelectorAll("#legend-list li").forEach((li, k) => {
            const e = ERAS[k];
            li.classList.toggle("off", e.to < state.lo || e.from > state.hi);
        });
    }

    function buildLegend() {
        const list = $("legend-list");
        list.innerHTML = "";
        if (state.mode === "height") {
            $("legend-title").textContent = "Hauteur";
            $("ramp").style.display = "";
            $("ramp").style.background = `linear-gradient(to right, ${HEIGHT_STOPS.map(([v, c]) => `rgb(${c}) ${(v / 120) * 100}%`).join(",")})`;
            $("ramp").insertAdjacentHTML("afterend", "");
            let ax = document.querySelector(".ramp-axis");
            if (!ax) { ax = document.createElement("div"); ax.className = "ramp-axis"; $("ramp").after(ax); }
            ax.innerHTML = "<span>0 m</span><span>30</span><span>60</span><span>120 m</span>";
            document.querySelector(".legend-note").style.display = "none";
            return;
        }
        $("legend-title").textContent = "Période de construction";
        $("ramp").style.display = "none";
        document.querySelector(".ramp-axis")?.remove();
        document.querySelector(".legend-note").style.display = "";
        const counts = ERAS.map(() => 0);
        for (let i = 0; i < D.n; i++) if (!state.recordedOnly || D.src[i] < 4) counts[D.era[i]]++;
        ERAS.forEach((e, k) => {
            const li = document.createElement("li");
            li.tabIndex = 0;
            li.setAttribute("role", "button");
            li.title = `Afficher seulement ${e.label} (${e.sub || e.from + "–" + e.to})`;
            li.innerHTML = `<span class="swatch" style="background:rgb(${e.color})"></span>` +
                `<span>${e.label}${e.sub ? `<small>${e.sub}</small>` : ""}</span><span class="n">${fmt(counts[k])}</span>`;
            const pick = () => {
                stop();
                const alone = state.lo === e.from && state.hi === e.to;
                state.lo = alone ? MIN_YEAR : e.from;
                state.hi = alone ? MAX_YEAR : e.to;
                render();
            };
            li.addEventListener("click", pick);
            li.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });
            list.appendChild(li);
        });
    }

    /* ---------- timeline ---------- */
    // early centuries are squeezed so the 19th and 20th get the room
    const SPLIT = 1800, SPLIT_X = 0.16;
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
        const ticks = window.innerWidth < 600 ? [1000, 1800, 1850, 1900, 1950, 2000] : [1000, 1500, 1800, 1850, 1900, 1950, 2000];
        $("axis").innerHTML = ticks
            .map((y) => `<span style="left:${yearToX(y) * 100}%">${y}</span>`).join("");
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
            render();
        });
    }

    /* ---------- play ---------- */
    let raf = 0;
    const PLAY_ICON = '<path d="M8 5v14l11-7z"/>', PAUSE_ICON = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
    function play() {
        state.playing = true;
        $("play").querySelector("svg").innerHTML = PAUSE_ICON;
        $("play").setAttribute("aria-label", "Pause");
        let x = state.hi >= MAX_YEAR ? yearToX(state.lo) : yearToX(state.hi);
        let last = performance.now();
        const step = (t) => {
            x += ((t - last) / 18000);
            last = t;
            state.hi = Math.max(state.lo, Math.min(MAX_YEAR, xToYear(Math.min(1, x))));
            render();
            if (x >= 1) return stop();
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
    }
    function stop() {
        if (!state.playing) return;
        state.playing = false;
        cancelAnimationFrame(raf);
        $("play").querySelector("svg").innerHTML = PLAY_ICON;
        $("play").setAttribute("aria-label", "Lecture");
    }

    /* ---------- wiring ---------- */
    function wire() {
        document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
            state.mode = b.dataset.mode;
            document.querySelectorAll(".seg button").forEach((o) => o.classList.toggle("on", o === b));
            buildLegend();
            render();
        }));
        const toggle = (id, key) => $(id).addEventListener("click", () => {
            state[key] = !state[key];
            $(id).classList.toggle("on", state[key]);
            $(id).setAttribute("aria-pressed", state[key]);
            buildLegend();
            render();
        });
        toggle("t-context", "context");
        toggle("t-recorded", "recordedOnly");
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
            render();
        });
        window.addEventListener("resize", () => { buildAxis(); drawHist(); });
    }

    function fillAbout() {
        const s = D.meta.stats;
        const pct = (v) => (v / s.total < 0.005 ? "<1 %" : `${Math.round((v / s.total) * 100)} %`);
        $("about-stats").innerHTML = [
            `<li><strong>${fmt(s.documented)}</strong> bâtiments (${pct(s.documented)}) ont une date documentée (Wikidata, OpenStreetMap).</li>`,
            `<li><strong>${fmt(s.period)}</strong> (${pct(s.period)}) sont datés par la couche des périodes 1999–2021.</li>`,
            `<li><strong>${fmt(s.survey)}</strong> (${pct(s.survey)}) sont datés par comparaison des relevés ACT 2013 et 2023.</li>`,
            `<li><strong>${fmt(s.estimated)}</strong> (${pct(s.estimated)}) ont une date estimée ; ${fmt(s.pre1999layer)} d'entre eux sont « avant 1999 » selon la couche des périodes.</li>`,
            `<li><strong>${fmt(s.monuments)}</strong> sont des monuments protégés ; ${fmt(s.withHeight)} ont une hauteur mesurée.</li>`,
        ].join("");
        $("built").textContent = new Date(D.meta.built).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    }

    async function main() {
        await load();
        deckgl = new Deck({
            parent: $("map"),
            views: new MapView({ repeat: false }),
            initialViewState: { longitude: 6.1300, latitude: 49.6070, zoom: 13.4, pitch: 52, bearing: -18, maxPitch: 75 },
            controller: true,
            layers: [],
            getCursor: ({ isHovering }) => (isHovering ? "pointer" : "grab"),
            parameters: { clearColor: [14 / 255, 17 / 255, 22 / 255, 1] },
        });
        computeHist();
        buildAxis();
        buildLegend();
        fillAbout();
        wire();
        render();
        $("loading").classList.add("done");
    }

    main().catch((e) => {
        $("loading").textContent = "Impossible de charger les données.";
        console.error(e);
    });
})();
