import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./styles.css";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const FLOWS = {
  direct: ["raw", "conformed", "curated"],
  standardised: ["raw", "standardised", "conformed", "curated"],
  workplace: ["raw", "conformed", "foundational", "curated"],
  ingestOnly: ["raw", "standardised"],
};

// Each flow type is a "metro line" with its own colour.
const LINES = {
  direct: { label: "Direct", color: "#31aefc" },
  standardised: { label: "Standardised", color: "#ffc341" },
  workplace: { label: "Workplace", color: "#8ee63f" },
  ingestOnly: { label: "Ingest only", color: "#b461ff" },
};

const SOURCES = [
  ["alis_messaging", "Alis_Messaging", "direct"],
  ["alis_pr", "Alis_PR", "direct"],
  ["archer", "Archer", "direct"],
  ["autoenrolment", "Autoenrolment", "direct"],
  ["bpa", "BPA", "standardised"],
  ["capita", "Capita", "direct"],
  ["ccaas", "CCaaS", "ingestOnly"],
  ["clara", "Clara", "direct"],
  ["crest", "Crest", "direct"],
  ["customerprofile", "CustomerProfile", "direct"],
  ["cra", "CRA", "direct"],
  ["integro", "Integro", "direct"],
  ["itrmaintenance", "ITRMaintenance", "standardised"],
  ["oryx", "Oryx", "direct"],
  ["plal", "PLAL", "direct"],
  ["reference_data", "Reference_Data", "direct"],
  ["cispp_main", "CISPP Main", "direct"],
  ["sonata", "Sonata", "standardised"],
  ["wealth_wizards", "Wealth Wizards", "ingestOnly"],
  ["workplace", "Workplace Insight", "workplace", ""],
].map(([id, name, type, note]) => ({
  id,
  name,
  type,
  note,
  flow: FLOWS[type],
  line: LINES[type],
}));

// NOTE: descriptions are generic wording - edit to match your platform standards.
const LAYERS = [
  {
    id: "raw",
    name: "RAW",
    color: "#b461ff",
    icon: "↓",
    summary: "Data lands exactly as it arrives from the source, unchanged.",
    points: ["Full copy kept for traceability", "Allows reprocessing without going back to the source"],
  },
  {
    id: "standardised",
    name: "Standardised",
    color: "#31aefc",
    icon: "▤",
    summary: "Data is aligned to common formats and naming so sources can be handled consistently.",
    points: ["Consistent data types and structure", "Ready for downstream rules"],
  },
  {
    id: "conformed",
    name: "Conformed",
    color: "#20d6c7",
    icon: "✓",
    summary: "Business rules and quality checks are applied and data is aligned to shared definitions.",
    points: ["Quality checks applied", "Shared business definitions"],
  },
  {
    id: "foundational",
    name: "Foundational",
    color: "#ffc341",
    icon: "◇",
    summary: "An extra modelling step, used by the Workplace Insight flow, that builds reusable core data before curation.",
    points: ["Reusable core data models", "Sits between Conformed and Curated"],
  },
  {
    id: "curated",
    name: "Curated",
    color: "#8ee63f",
    icon: "▥",
    summary: "Business-ready data products shaped for reporting, analytics and dashboards.",
    points: ["Feeds business consumption", "Trusted, governed outputs"],
  },
];

const CONSUMERS = [
  "Pensions Dashboard",
  "FinWell",
  "MyRL Portal",
  "CIAM",
  "Consumer Duty Dashboard",
];

const countByType = (type) => SOURCES.filter((s) => s.type === type).length;

// Guided tour: every talking point is derived from the data above.
const TOUR = [
  {
    title: "The big picture",
    source: "all",
    target: "journey",
    text: `${SOURCES.length} source systems flow through the Enterprise Data Platform. Each follows its own governed route.`,
  },
  {
    title: "Direct flow",
    source: "clara",
    target: "journey",
    text: `${countByType("direct")} sources take the direct route: Raw, Conformed, Curated. Clara is one example.`,
  },
  {
    title: "Standardised flow",
    source: "sonata",
    target: "journey",
    text: `${countByType("standardised")} sources, including Sonata, add a Standardised step before Conformed.`,
  },
  {
    title: "Ingest only",
    source: "ccaas",
    target: "journey",
    text: `${countByType("ingestOnly")} sources currently stop at Standardised. Their route ends there for now.`,
  },
  {
    title: "Workplace Insight",
    source: "workplace",
    target: "journey",
    layer: "foundational",
    text: "Workplace Insight adds a Foundational layer before Curated. It is still in progress and not yet live.",
  },
  {
    title: "Business value",
    source: "all",
    target: "consumption",
    text: `Curated data powers ${CONSUMERS.length} business products, from the Pensions Dashboard to the Consumer Duty Dashboard.`,
  },
];

const PARTICLES = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  lane: index % 3,
  delay: `${(index % 10) * 0.32}s`,
  duration: `${4.2 + (index % 6) * 0.45}s`,
  size: `${3 + (index % 4)}px`,
}));

const BEAM_PARTICLES = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  delay: `${index * 0.18}s`,
  left: `${28 + (index % 6) * 8}%`,
}));

const PUBLIC = process.env.PUBLIC_URL;

/* ------------------------------------------------------------------ */
/*  CLIENT SPOTLIGHT                                                   */
/* ------------------------------------------------------------------ */

// Images live in /public/clients. Names and titles are printed on the images themselves.
const TEAM = [
  { file: "Eleni.png", name: "Eleni Hadjikakou", role: "Head of Finance Operations" },
  { file: "Mike.png", name: "Mike Williams", role: "Head of Finance Systems & Change" },
  { file: "David.png", name: "David Thomson", role: "Head of Data Solutions" },
  { file: "Philip.png", name: "Philip Quarmby", role: "Head of Data Transformation" },
];
const TEAM_INTERVAL = 5000; // ms each person stays on screen

/* ------------------------------------------------------------------ */
/*  FULL-SCREEN PIXEL-FLOW SHOWCASE                                    */
/* ------------------------------------------------------------------ */

const SHOW_HOLD = 4200; // ms each person is held on screen
const SHOW_FLOW = 1900; // ms the pixel flow takes
const FLOW_SPAN = 0.4; // share of the flow each pixel block spends changing
const CELL = 24; // block size in image pixels
const LEVELS = [6, 12, 24]; // mosaic sizes a block passes through
const BG_W = 88;
const BG_H = 78;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function PixelShowcase({ startIndex, onClose }) {
  const canvasRef = useRef(null);
  const bgRef = useRef(null);
  const closeRef = useRef(null);
  const dataRef = useRef(null); // { W, H, ctx, bgCtx, items, cells }
  const animRef = useRef(null); // { from, to, dir, start }
  const rafRef = useRef(0);
  const indexRef = useRef(startIndex);

  const [index, setIndex] = useState(startIndex);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [running, setRunning] = useState(true);
  const [flowing, setFlowing] = useState(false);

  const reduced = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  /* ---- drawing ---- */
  const syncBg = useCallback(() => {
    const d = dataRef.current;
    if (d) d.bgCtx.drawImage(d.ctx.canvas, 0, 0, BG_W, BG_H);
  }, []);

  const drawStill = useCallback(
    (i) => {
      const d = dataRef.current;
      if (!d) return;
      d.ctx.imageSmoothingEnabled = true;
      d.ctx.drawImage(d.items[i].img, 0, 0);
      syncBg();
    },
    [syncBg]
  );

  const drawFrame = useCallback(
    (from, to, t, dir) => {
      const { W, H, ctx, items, cells } = dataRef.current;
      ctx.imageSmoothingEnabled = false;
      for (const c of cells) {
        // Wave travels across the photo, with a little noise so blocks flow rather than march.
        const xn = dir > 0 ? c.x / W : 1 - (c.x + c.w) / W;
        const delay = Math.min(1, xn * 0.62 + (c.y / H) * 0.12 + c.n * 0.26);
        const p = clamp01((t - delay * (1 - FLOW_SPAN)) / FLOW_SPAN);

        // First half: old photo breaks into bigger blocks. Second half: new photo resolves.
        let item;
        let lvl;
        if (p < 0.5) {
          const q = p * 2;
          item = items[from];
          lvl = q < 0.25 ? -1 : q < 0.5 ? 0 : q < 0.75 ? 1 : 2;
        } else {
          const q = (p - 0.5) * 2;
          item = items[to];
          lvl = q < 0.25 ? 2 : q < 0.5 ? 1 : q < 0.75 ? 0 : -1;
        }

        if (lvl < 0) {
          ctx.drawImage(item.img, c.x, c.y, c.w, c.h, c.x, c.y, c.w, c.h);
        } else {
          const b = LEVELS[lvl];
          ctx.drawImage(item.levels[lvl], c.x / b, c.y / b, c.w / b, c.h / b, c.x, c.y, c.w, c.h);
        }

        if (p > 0 && p < 1) {
          const a = (0.3 * Math.sin(Math.PI * p)).toFixed(2);
          ctx.fillStyle = `rgba(53,220,255,${a})`;
          ctx.fillRect(c.x, c.y, c.w, c.h);
        }
      }
    },
    []
  );

  const step = useCallback(
    function tick(now) {
      const a = animRef.current;
      if (!a) return;
      const t = Math.min(1, (now - a.start) / SHOW_FLOW);
      if (t >= 1) {
        drawStill(a.to);
        animRef.current = null;
        setFlowing(false);
        return;
      }
      drawFrame(a.from, a.to, easeInOut(t), a.dir);
      syncBg();
      rafRef.current = requestAnimationFrame(tick);
    },
    [drawFrame, drawStill, syncBg]
  );

  const flowTo = useCallback(
    (to, dir) => {
      if (!dataRef.current || animRef.current || to === indexRef.current) return;
      const from = indexRef.current;
      indexRef.current = to;
      setIndex(to);
      if (reduced) {
        drawStill(to);
        return;
      }
      animRef.current = { from, to, dir, start: performance.now() };
      setFlowing(true);
      rafRef.current = requestAnimationFrame(step);
    },
    [reduced, drawStill, step]
  );

  const next = useCallback(
    () => flowTo((indexRef.current + 1) % TEAM.length, 1),
    [flowTo]
  );
  const prev = useCallback(
    () => flowTo((indexRef.current - 1 + TEAM.length) % TEAM.length, -1),
    [flowTo]
  );

  /* ---- load images and prepare the mosaic levels ---- */
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      TEAM.map(
        (person) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `${PUBLIC}/clients/${person.file}`;
          })
      )
    )
      .then((imgs) => {
        if (cancelled) return;
        const W = imgs[0].naturalWidth;
        const H = imgs[0].naturalHeight;
        const canvas = canvasRef.current;
        canvas.width = W;
        canvas.height = H;

        const items = imgs.map((img) => ({
          img,
          levels: LEVELS.map((b) => {
            const small = document.createElement("canvas");
            small.width = Math.ceil(W / b);
            small.height = Math.ceil(H / b);
            const sctx = small.getContext("2d");
            sctx.imageSmoothingEnabled = true;
            sctx.imageSmoothingQuality = "high";
            sctx.drawImage(img, 0, 0, small.width, small.height);
            return small;
          }),
        }));

        const cells = [];
        for (let y = 0; y < H; y += CELL) {
          for (let x = 0; x < W; x += CELL) {
            const noise = Math.abs((Math.sin((x / CELL) * 12.9898 + (y / CELL) * 78.233) * 43758.5453) % 1);
            cells.push({ x, y, w: Math.min(CELL, W - x), h: Math.min(CELL, H - y), n: noise });
          }
        }

        dataRef.current = {
          W,
          H,
          items,
          cells,
          ctx: canvas.getContext("2d"),
          bgCtx: bgRef.current.getContext("2d"),
        };
        drawStill(indexRef.current);
        setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawStill]);

  /* ---- autoplay ---- */
  useEffect(() => {
    if (!ready || !running || flowing) return undefined;
    const timer = window.setTimeout(next, reduced ? 6000 : SHOW_HOLD);
    return () => window.clearTimeout(timer);
  }, [ready, running, flowing, index, next, reduced]);

  /* ---- keyboard, scroll lock, initial focus ---- */
  useEffect(() => {
    const onKey = (event) => {
      if (!["ArrowRight", "ArrowLeft", "Escape"].includes(event.key)) return;
      event.stopPropagation(); // keep the guided-tour shortcuts quiet while this is open
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [next, prev, onClose]);

  const person = TEAM[index];

  return (
    <div className="showcase" role="dialog" aria-modal="true" aria-label="Client spotlight">
      <canvas ref={bgRef} className="showcase-bg" width={BG_W} height={BG_H} aria-hidden="true" />
      <div className="showcase-vignette" aria-hidden="true" />

      <div className="showcase-top">
        <b>♛ EDP Data Metro</b>
        <div className="showcase-actions">
          <button type="button" onClick={prev} aria-label="Previous person">←</button>
          <button type="button" onClick={next} aria-label="Next person">→</button>
          <button type="button" onClick={() => setRunning((v) => !v)}>
            {running ? "Ⅱ Pause" : "▶ Play"}
          </button>
          <button type="button" ref={closeRef} onClick={onClose}>✕ Close</button>
        </div>
      </div>

      <div className="showcase-frame">
        <canvas
          ref={canvasRef}
          className="showcase-canvas"
          role="img"
          aria-label={`${person.name}, ${person.role}`}
        />
        {!ready && !failed && <p className="showcase-msg">Loading photos…</p>}
        {failed && (
          <p className="showcase-msg">
            Couldn&apos;t load the photos. Check that they are in public/clients.
          </p>
        )}
      </div>

      <div className="showcase-foot">
        {TEAM.map((member, i) => (
          <button
            type="button"
            key={member.file}
            className={i === index ? "on" : ""}
            aria-current={i === index}
            onClick={() => flowTo(i, i > indexRef.current ? 1 : -1)}
          >
            {member.name.split(" ")[0]}
            {i === index && !flowing && ready && (
              <i
                key={`${index}-${running}`}
                className="show-progress"
                style={{
                  animationDuration: `${SHOW_HOLD}ms`,
                  animationPlayState: running ? "running" : "paused",
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeamSpotlight() {
  const [pos, setPos] = useState({ index: 0, prev: null });
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showcase, setShowcase] = useState(null); // null = closed, otherwise start index
  const enteredFs = useRef(false);
  const paused = userPaused || hovered || showcase !== null;
  const reduced = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const advance = useCallback(
    () => setPos((p) => ({ index: (p.index + 1) % TEAM.length, prev: p.index })),
    []
  );
  const goTo = (next) =>
    setPos((p) => (p.index === next ? p : { index: next, prev: p.index }));

  const openShowcase = () => {
    setShowcase(pos.index);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          enteredFs.current = true;
        })
        .catch(() => {});
    }
  };

  const closeShowcase = useCallback(() => {
    setShowcase(null);
    if (enteredFs.current && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    enteredFs.current = false;
  }, []);

  // If the browser leaves full screen (for example the person pressed Esc), close the showcase too.
  useEffect(() => {
    if (showcase === null) return undefined;
    const onChange = () => {
      if (!document.fullscreenElement && enteredFs.current) {
        enteredFs.current = false;
        setShowcase(null);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [showcase]);

  // Normal case: the progress bar's animationend moves to the next person, so the
  // bar and the swap always stay in sync (including pause/resume).
  // Reduced-motion case: animations are off, so use a plain timer instead.
  useEffect(() => {
    if (!reduced || paused) return undefined;
    const timer = window.setTimeout(advance, TEAM_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [reduced, paused, pos.index, advance]);

  const current = TEAM[pos.index];

  return (
    <section
      className={`team ${paused ? "is-paused" : ""}`}
      aria-label="Welcome"
      style={{ "--iv": `${TEAM_INTERVAL}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <span className="team-tag">Welcome</span>
      <div className="team-stage" onClick={openShowcase}>
        {TEAM.map((person, i) => (
          <img
            key={person.file}
            src={`${PUBLIC}/clients/${person.file}`}
            alt={i === pos.index ? `${person.name}, ${person.role}` : ""}
            className={`team-img ${i === pos.index ? "active" : ""} ${i === pos.prev ? "prev" : ""}`}
            decoding="async"
            draggable="false"
          />
        ))}
        <span key={pos.index} className="team-sweep" aria-hidden="true" />
        <button
          type="button"
          className="team-expand"
          aria-label="View photos full screen"
          onClick={(event) => {
            event.stopPropagation();
            openShowcase();
          }}
        >
          ⤢
        </button>
      </div>
      <div className="team-foot">
        <div className="team-dots">
          {TEAM.map((person, i) => (
            <button
              type="button"
              key={person.file}
              className={i === pos.index ? "on" : ""}
              aria-label={`Show ${person.name}`}
              aria-current={i === pos.index}
              onClick={() => goTo(i)}
            >
              <i
                className="fill"
                onAnimationEnd={i === pos.index && !reduced ? advance : undefined}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="team-pause"
          aria-label={userPaused ? "Resume slideshow" : "Pause slideshow"}
          onClick={() => setUserPaused((v) => !v)}
        >
          {userPaused ? "▶" : "Ⅱ"}
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {current.name}, {current.role}
      </span>
      {showcase !== null &&
        createPortal(
          <PixelShowcase startIndex={showcase} onClose={closeShowcase} />,
          document.body
        )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

/* ------------------------------------------------------------------ */
/*  APP                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const journeyRef = useRef(null);
  const videoRef = useRef(null);

  const [selectedId, setSelectedId] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [running, setRunning] = useState(true);
  const [position, setPosition] = useState(0);
  const [pinnedLayer, setPinnedLayer] = useState(null);
  const [tourStep, setTourStep] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sourceCount = useCountUp(SOURCES.length);
  const layerCount = useCountUp(LAYERS.length);

  const selectedSource = useMemo(
    () => SOURCES.find((source) => source.id === selectedId),
    [selectedId]
  );

  const activeFlow = useMemo(
    () => selectedSource?.flow ?? LAYERS.map((layer) => layer.id),
    [selectedSource]
  );

  const currentLayer = activeFlow[position] ?? activeFlow[0];
  const currentLayerIndex = Math.max(
    0,
    LAYERS.findIndex((layer) => layer.id === currentLayer)
  );

  const lastFlowIndex = Math.max(
    0,
    LAYERS.findIndex((layer) => layer.id === activeFlow[activeFlow.length - 1])
  );
  const endsEarly = Boolean(selectedSource) && activeFlow[activeFlow.length - 1] !== "curated";

  const visibleSources = useMemo(
    () => (typeFilter === "all" ? SOURCES : SOURCES.filter((s) => s.type === typeFilter)),
    [typeFilter]
  );

  // Layer shown in the detail panel: a clicked station wins, otherwise follow the train.
  const detailLayerId = pinnedLayer ?? (selectedSource ? currentLayer : null);
  const detailLayer = LAYERS.find((layer) => layer.id === detailLayerId);
  const detailSources = detailLayer
    ? SOURCES.filter((source) => source.flow.includes(detailLayer.id))
    : [];

  /* ---- source selection ---- */
  const chooseSource = useCallback((id) => {
    setSelectedId(id);
    setPinnedLayer(null);
  }, []);

  useEffect(() => {
    setPosition(0);
    setRunning(true);
  }, [selectedId]);

  useEffect(() => {
    if (!running || activeFlow.length < 2) return undefined;
    const timer = window.setInterval(
      () => setPosition((current) => (current + 1) % activeFlow.length),
      2400
    );
    return () => window.clearInterval(timer);
  }, [running, activeFlow]);

  /* ---- hero video ---- */
  useEffect(() => {
    videoRef.current?.play().catch(() => {
      /* autoplay blocked - poster image stays visible */
    });
  }, []);

  /* ---- guided tour ---- */
  const goToTarget = (target) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showTourStep = useCallback((index) => {
    const step = TOUR[index];
    setTourStep(index);
    setSelectedId(step.source);
    setPinnedLayer(step.layer ?? null);
    goToTarget(step.target);
  }, []);

  const startTour = () => showTourStep(0);
  const endTour = useCallback(() => setTourStep(null), []);

  useEffect(() => {
    if (tourStep === null) return undefined;
    const onKey = (event) => {
      if (event.key === "ArrowRight") showTourStep(Math.min(TOUR.length - 1, tourStep + 1));
      if (event.key === "ArrowLeft") showTourStep(Math.max(0, tourStep - 1));
      if (event.key === "Escape") endTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourStep, showTourStep, endTour]);

  /* ---- fullscreen ---- */
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const routeText = selectedSource
    ? selectedSource.flow
        .map((id) => LAYERS.find((layer) => layer.id === id)?.name)
        .join(" → ")
    : "Select a source above to isolate its exact flow.";

  const step = tourStep !== null ? TOUR[tourStep] : null;

  return (
    <div className={`app ${running ? "" : "paused"}`}>
      {/* ============================ HERO ============================ */}
      <section
        id="home"
        className="hero"
        style={{ backgroundImage: `url(${PUBLIC}/edp-data-metro-hero.png)` }}
      >
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={`${PUBLIC}/edp-data-metro-hero.png`}
        >
          <source src={`${PUBLIC}/edp-data-metro-hero.mp4`} type="video/mp4" />
        </video>

        <div className="shade" />

        <div className="fx" aria-hidden="true">
          {[0, 1, 2].map((lane) => (
            <div key={lane} className={`particle-stream s${lane}`}>
              {PARTICLES.filter((particle) => particle.lane === lane).map((particle) => (
                <i
                  key={particle.id}
                  style={{
                    "--d": particle.delay,
                    "--t": particle.duration,
                    "--z": particle.size,
                  }}
                />
              ))}
            </div>
          ))}
          <div className="beam">
            <span className="core" />
            <span className="halo" />
            <b className="ring r1" />
            <b className="ring r2" />
            <div>
              {BEAM_PARTICLES.map((particle) => (
                <i
                  key={particle.id}
                  style={{ "--bd": particle.delay, "--bl": particle.left }}
                />
              ))}
            </div>
          </div>
          <div className="out-stream">
            {PARTICLES.slice(0, 12).map((particle) => (
              <i
                key={particle.id}
                style={{
                  "--d": particle.delay,
                  "--t": particle.duration,
                  "--z": particle.size,
                }}
              />
            ))}
          </div>
        </div>

        <header>
          <a href="#home">♛ <b>EDP Data Metro</b></a>
          <nav>
            <a href="#home">Home</a>
            <a href="#sources">Sources</a>
            <a href="#journey">EDP Journey</a>
            <a href="#consumption">Consumption</a>
          </nav>
        </header>

        <div className="copy">
          <small>ENTERPRISE DATA PLATFORM</small>
          <h1 className="wave-title" aria-label="EDP Data Metro">
            {"EDP Data Metro".split("").map((character, index) => (
              <span
                key={`${character}-${index}`}
                aria-hidden="true"
                className={index < 3 ? "edp-letter" : ""}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {character === " " ? "\u00A0" : character}
              </span>
            ))}
          </h1>
          <h2>
            Connecting Source Systems
            <br />
            Transforming Data
            <br />
            Delivering Business Value
          </h2>
          <p>
            Integrating enterprise source systems through the Enterprise Data
            Platform to power analytics, reporting, AI and business decisions.
          </p>
          <div className="cta-row">
            <button type="button" onClick={startTour}>
              ▶ Start guided tour
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => journeyRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore on my own →
            </button>
          </div>
        </div>

        <TeamSpotlight />

        <div className="metrics">
          <div>▤ <b>{sourceCount}</b><small>Source Systems</small></div>
          <div>☁ <b>Unified Data Platform</b><small>Source-specific governed flows</small></div>
          <div>⌘ <b>{layerCount} EDP Layers</b><small>Raw to Curated</small></div>
          <div>▥ <b>Business Consumption</b><small>Insights &amp; Decision Making</small></div>
        </div>
      </section>

      {/* =========================== JOURNEY ========================== */}
      <section id="journey" ref={journeyRef} className="journey">
        <header>
          <b>♛ ROYAL LONDON</b>
          <div>
            <h2>EDP DATA METRO</h2>
            <p>Source-specific journeys to trusted data products</p>
          </div>
          <div className="head-actions">
            <button type="button" onClick={tourStep === null ? startTour : endTour}>
              {tourStep === null ? "▶ Tour" : "✕ End tour"}
            </button>
            <button type="button" onClick={toggleFullscreen}>
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
          </div>
        </header>

        <main>
          <section id="sources" className="sources">
            <div className="sources-head">
              <h2>{SOURCES.length} source systems</h2>
              <div className="chips" role="group" aria-label="Filter by flow type">
                <button
                  type="button"
                  className={typeFilter === "all" ? "chip on" : "chip"}
                  onClick={() => setTypeFilter("all")}
                >
                  All ({SOURCES.length})
                </button>
                {Object.entries(LINES).map(([key, line]) => (
                  <button
                    type="button"
                    key={key}
                    className={typeFilter === key ? "chip on" : "chip"}
                    style={{ "--lc": line.color }}
                    onClick={() => setTypeFilter(key)}
                  >
                    <i className="dot" /> {line.label} ({countByType(key)})
                  </button>
                ))}
              </div>
            </div>

            <div className="source-grid">
              <button
                type="button"
                className={selectedId === "all" ? "on" : ""}
                onClick={() => chooseSource("all")}
              >
                <span>All sources</span>
              </button>
              {visibleSources.map((source) => (
                <button
                  type="button"
                  key={source.id}
                  className={`${selectedId === source.id ? "on" : ""} has-line`}
                  style={{ "--lc": source.line.color }}
                  onClick={() => chooseSource(source.id)}
                  aria-pressed={selectedId === source.id}
                >
                  <span>{source.name}</span>
                  <em>{source.line.label}</em>
                  {source.note && <small>{source.note}</small>}
                </button>
              ))}
            </div>
          </section>

          <section className="route" aria-live="polite">
            <small>SELECTED ROUTE</small>
            <h2>{selectedSource?.name ?? "All source journeys"}</h2>
            <p>{routeText}</p>
            {selectedSource?.note && (
              <strong className="route-note">Destination / status: {selectedSource.note}</strong>
            )}
            {selectedSource && endsEarly && (
              <strong className="route-note">
                This route currently ends at {LAYERS[lastFlowIndex].name}.
              </strong>
            )}
          </section>

          <section className="map">
            <div className="track" />
            {selectedSource && (
              <div
                className="track-lit"
                style={{
                  "--lc": selectedSource.line.color,
                  left: "14%",
                  width: `${lastFlowIndex * 18}%`,
                }}
              />
            )}
            {selectedSource && (
              <div className="train" style={{ left: `${14 + currentLayerIndex * 18}%` }}>
                <small>{selectedSource.name}</small>
                <span>▰▰▰</span>
              </div>
            )}
            <div className="stations">
              {LAYERS.map((layer, layerIndex) => {
                const enabled = selectedSource ? activeFlow.includes(layer.id) : true;
                const isEnd = endsEarly && layerIndex === lastFlowIndex;
                return (
                  <button
                    type="button"
                    key={layer.id}
                    className={`${enabled ? "enabled" : "disabled"} ${
                      selectedSource && currentLayer === layer.id ? "current" : ""
                    } ${detailLayerId === layer.id ? "picked" : ""}`}
                    style={{ "--c": layer.color }}
                    aria-pressed={detailLayerId === layer.id}
                    onClick={() => setPinnedLayer(pinnedLayer === layer.id ? null : layer.id)}
                  >
                    <b>{layer.name}</b>
                    <i>{layer.icon}</i>
                    {isEnd && <span className="end-tag">Route ends here</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="detail" aria-live="polite">
            {detailLayer ? (
              <>
                <div className="detail-main" style={{ "--c": detailLayer.color }}>
                  <small>LAYER</small>
                  <h3>
                    <i>{detailLayer.icon}</i> {detailLayer.name}
                  </h3>
                  <p>{detailLayer.summary}</p>
                  <ul>
                    {detailLayer.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="detail-sources">
                  <small>
                    {detailSources.length} of {SOURCES.length} sources pass through this layer
                  </small>
                  <div>
                    {detailSources.map((source) => (
                      <button
                        type="button"
                        key={source.id}
                        style={{ "--lc": source.line.color }}
                        className={selectedId === source.id ? "on" : ""}
                        onClick={() => chooseSource(source.id)}
                      >
                        {source.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="detail-empty">
                Click any station to see what happens in that layer and which sources pass through it.
              </p>
            )}
          </section>

          <section id="consumption" className="consumption">
            <h2>BUSINESS CONSUMPTION &amp; INSIGHTS</h2>
            <div>
              {CONSUMERS.map((item) => (
                <article key={item}>▥ <b>{item}</b></article>
              ))}
            </div>
          </section>

          <section className="controls">
            <button type="button" onClick={() => setRunning(true)}>▶ Play</button>
            <button type="button" onClick={() => setRunning(false)}>Ⅱ Pause</button>
            <select
              value={selectedId}
              onChange={(event) => chooseSource(event.target.value)}
              aria-label="Select source system"
            >
              <option value="all">All Sources</option>
              {SOURCES.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </section>
        </main>
      </section>

      {/* ========================= TOUR BAR ========================== */}
      {step && (
        <aside className="tour" role="dialog" aria-label="Guided tour">
          <div className="tour-text">
            <small>
              Step {tourStep + 1} of {TOUR.length}
            </small>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
          <div className="tour-actions">
            <button
              type="button"
              onClick={() => showTourStep(tourStep - 1)}
              disabled={tourStep === 0}
            >
              ← Back
            </button>
            {tourStep < TOUR.length - 1 ? (
              <button type="button" className="primary" onClick={() => showTourStep(tourStep + 1)}>
                Next →
              </button>
            ) : (
              <button type="button" className="primary" onClick={endTour}>
                Finish
              </button>
            )}
            <button type="button" className="ghost" onClick={endTour}>
              Exit
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
