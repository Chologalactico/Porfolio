// Static imports at the top - these will be bundled by Vite
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { initDemoShell } from "./shared/demo-shell.js";
import { prefersReducedMotion } from "./shared/a11y.js";

let initRetryCount = 0;
const MAX_RETRIES = 3;

async function init() {
  if (typeof window === "undefined") return;

  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, TextPlugin);

  // ── Demo Shell ──
  initDemoShell({
    title: "AI Engineer Portfolio",
    category: "pages",
    tech: ["canvas-2d", "gsap", "scrambletext", "lenis"]
  });

  // ── Lenis ──
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  let reduced = prefersReducedMotion();
  if (reduced) document.documentElement.classList.add("reduced-motion");

  window.addEventListener("motion-preference", (e) => {
    reduced = e.detail.reduced;
    document.documentElement.classList.toggle("reduced-motion", reduced);
    ScrollTrigger.refresh();
  });

  const dur = (d) => (reduced ? 0 : d);

  // ── Nav animation ──
  const navLogo = document.querySelector(".nav-logo");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const navToggle = document.querySelector(".nav-toggle");
  const navItems = [navLogo, navToggle, ...navLinks].filter(Boolean);

  if (navItems.length) {
    if (reduced) {
      navItems.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    } else {
      gsap.set(navItems, { opacity: 0, y: -10 });
      gsap.to(navItems, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.08,
        delay: 0.2
      });
    }
  }

  if (navToggle) {
    let lockScrollY = 0;
    const siteNav = document.querySelector(".site-nav");
    const setNavOpen = (open) => {
      navToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        lockScrollY = window.scrollY || window.pageYOffset || 0;
        document.body.style.top = `-${lockScrollY}px`;
      } else {
        document.body.style.top = "";
      }
      document.body.classList.toggle("nav-open", open);
      if (!open && lockScrollY) {
        window.scrollTo(0, lockScrollY);
      }
    };

    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setNavOpen(!isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => setNavOpen(false));
    });

    document.addEventListener("click", (event) => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      if (siteNav && siteNav.contains(event.target)) return;
      setNavOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) setNavOpen(false);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) setNavOpen(false);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1: Neural Network Canvas Background
  // ═══════════════════════════════════════════════════════════════════════

  const neuralCanvas = document.getElementById("neural-canvas");
  const nCtx = neuralCanvas.getContext("2d");
  let nodes = [];
  let connections = [];
  let pulses = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let neuralRAF = 0;

  function resizeNeuralCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    neuralCanvas.width = Math.floor(window.innerWidth * dpr);
    neuralCanvas.height = Math.floor(window.innerHeight * dpr);
    neuralCanvas.style.width = window.innerWidth + "px";
    neuralCanvas.style.height = window.innerHeight + "px";
    nCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNetwork();
  }

  function initNetwork() {
    nodes = [];
    connections = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const layers = 5;
    const nodesPerLayer = Math.floor(w < 600 ? 8 : 14);

    for (let l = 0; l < layers; l++) {
      const x = (w / (layers + 1)) * (l + 1);
      for (let n = 0; n < nodesPerLayer; n++) {
        const y = (h / (nodesPerLayer + 1)) * (n + 1);
        nodes.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 30,
          layer: l,
          baseAlpha: 0.15 + Math.random() * 0.15,
          alpha: 0.15,
          radius: 2 + Math.random() * 2
        });
      }
    }

    // Connect adjacent layers
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1) {
          if (Math.random() < 0.3) {
            connections.push({ from: i, to: j, alpha: 0.04 + Math.random() * 0.06 });
          }
        }
      }
    }
  }

  function spawnPulse() {
    if (connections.length === 0) return;
    const conn = connections[Math.floor(Math.random() * connections.length)];
    pulses.push({ conn, progress: 0, speed: 0.008 + Math.random() * 0.012 });
  }

  function renderNeural() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    nCtx.clearRect(0, 0, w, h);

    // Connections
    for (const c of connections) {
      const a = nodes[c.from];
      const b = nodes[c.to];
      nCtx.strokeStyle = `rgba(0, 255, 135, ${c.alpha})`;
      nCtx.lineWidth = 0.5;
      nCtx.beginPath();
      nCtx.moveTo(a.x, a.y);
      nCtx.lineTo(b.x, b.y);
      nCtx.stroke();
    }

    // Pulses
    if (!reduced) {
      if (Math.random() < 0.03) spawnPulse();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += p.speed;
        if (p.progress > 1) {
          pulses.splice(i, 1);
          continue;
        }
        const a = nodes[p.conn.from];
        const b = nodes[p.conn.to];
        const px = a.x + (b.x - a.x) * p.progress;
        const py = a.y + (b.y - a.y) * p.progress;
        const grad = nCtx.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, "rgba(0, 255, 135, 0.8)");
        grad.addColorStop(1, "rgba(0, 255, 135, 0)");
        nCtx.fillStyle = grad;
        nCtx.beginPath();
        nCtx.arc(px, py, 8, 0, Math.PI * 2);
        nCtx.fill();
      }
    }

    // Nodes
    for (const node of nodes) {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mouseInfluence = dist < 150 ? (1 - dist / 150) * 0.65 : 0;
      node.alpha = node.baseAlpha + mouseInfluence;

      nCtx.fillStyle = `rgba(0, 255, 135, ${node.alpha})`;
      nCtx.beginPath();
      nCtx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      nCtx.fill();

      if (mouseInfluence > 0.1) {
        const glowGrad = nCtx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4);
        glowGrad.addColorStop(0, `rgba(0, 255, 135, ${mouseInfluence * 0.3})`);
        glowGrad.addColorStop(1, "rgba(0, 255, 135, 0)");
        nCtx.fillStyle = glowGrad;
        nCtx.beginPath();
        nCtx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
        nCtx.fill();
      }
    }

    neuralRAF = requestAnimationFrame(renderNeural);
  }

  resizeNeuralCanvas();
  window.addEventListener("resize", resizeNeuralCanvas);
  neuralRAF = requestAnimationFrame(renderNeural);

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2: Hero Terminal ScrambleText
  // ═══════════════════════════════════════════════════════════════════════

  const scrambleChars = "01!<>-_\\/[]{}=+*^?#";

  // Wait for DOM elements to be available
  const cmdTextEl = document.querySelector(".cmd-text");
  const nameTextEl = document.querySelector(".name-text");
  const roleTextEl = document.querySelector(".role-text");
  const tagline1El = document.querySelector(".tagline1-text");
  const tagline2El = document.querySelector(".tagline2-text");
  const cursorEl = document.getElementById("cursor");
  const scrollHintEl = document.getElementById("scroll-hint");

  if (!cmdTextEl || !nameTextEl || !roleTextEl || !tagline1El || !tagline2El) {
    if (initRetryCount < MAX_RETRIES) {
      initRetryCount++;
      console.warn(`Terminal elements not found, retrying (${initRetryCount}/${MAX_RETRIES})...`);
      // Retry after a short delay
      setTimeout(() => {
        init().catch((error) => {
          console.error("Error initializing portfolio after retry:", error);
        });
      }, 300);
      return;
    } else {
      console.error("Terminal elements not found after multiple retries. Please check the HTML structure.");
      return;
    }
  }

  // Reset retry count on success
  initRetryCount = 0;

  if (reduced) {
    // Show text immediately in reduced motion
    cmdTextEl.textContent = "JJ.init()";
    nameTextEl.textContent = "Juan Castro";
    roleTextEl.textContent = "AI/Full Stack Engineer";
    tagline1El.textContent = "Building intelligent systems";
    tagline2El.textContent = "that understand the world.";
    if (cursorEl) cursorEl.style.display = "none";
    if (scrollHintEl) gsap.set(scrollHintEl, { opacity: 1 });
  } else {
    const heroTl = gsap.timeline({ delay: 0.5 });

    heroTl
      .to(cmdTextEl, {
        duration: 0.8,
        scrambleText: { text: "JJ.init()", chars: scrambleChars, speed: 0.4 }
      })
      .to(
        nameTextEl,
        {
          duration: 0.6,
          scrambleText: { text: "Juan Jose Castro", chars: scrambleChars, speed: 0.3 }
        },
        "+=0.3"
      )
      .to(
        roleTextEl,
        {
          duration: 0.5,
          scrambleText: { text: "AI/Full Stack Engineer", chars: scrambleChars, speed: 0.3 }
        },
        "+=0.1"
      )
      .to(
        tagline1El,
        {
          duration: 0.8,
          scrambleText: { text: "Building intelligent systems", chars: scrambleChars, speed: 0.3 }
        },
        "+=0.4"
      )
      .to(
        tagline2El,
        {
          duration: 0.7,
          scrambleText: { text: "that understand the world.", chars: scrambleChars, speed: 0.3 }
        },
        "+=0.1"
      );

    if (scrollHintEl) {
      heroTl.to(scrollHintEl, { opacity: 1, duration: 0.6, ease: "expo.out" }, "+=0.5");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3: About — Bio Text Reveal + Stat Counters
  // ═══════════════════════════════════════════════════════════════════════

  // Bio text — line reveal
  const bioText = document.querySelector(".bio-text");
  if (bioText) {
    const bioSplit = new SplitText(bioText, { type: "lines", linesClass: "line" });
    gsap.set(bioSplit.lines, { opacity: 0, x: reduced ? 0 : -40 });

    gsap.to(bioSplit.lines, {
      opacity: 1,
      x: 0,
      duration: dur(0.7),
      ease: "expo.out",
      stagger: { each: 0.1 },
      scrollTrigger: {
        trigger: ".about-section",
        start: "top 70%",
        toggleActions: "play none none reverse"
      }
    });
  }

  // Section label
  const aboutLabel = document.querySelector(".about-section .section-label");
  if (aboutLabel) {
    gsap.set(aboutLabel, { opacity: 0, y: reduced ? 0 : 15 });
    gsap.to(aboutLabel, {
      opacity: 1,
      y: 0,
      duration: dur(0.5),
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".about-section",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  }

  // Stat counters
  document.querySelectorAll(".stat-card").forEach((card, i) => {
    gsap.set(card, { opacity: 0, x: reduced ? 0 : 40 });

    gsap.to(card, {
      opacity: 1,
      x: 0,
      duration: dur(0.6),
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".about-section",
        start: "top 65%",
        toggleActions: "play none none reverse"
      },
      delay: i * 0.15
    });

    // Counter animation
    const numberEl = card.querySelector(".stat-number");
    const valueOverride = numberEl.dataset.value;
    if (valueOverride) {
      numberEl.textContent = valueOverride;
      return;
    }
    const target = parseInt(numberEl.dataset.target, 10);
    const suffix = numberEl.dataset.suffix || "";
    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: card,
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (reduced) {
          numberEl.textContent = target + suffix;
          return;
        }
        gsap.to(counter, {
          val: target,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            numberEl.textContent = Math.round(counter.val) + suffix;
          }
        });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4: Projects — Card Entrance + Canvas Visualizations
  // ═══════════════════════════════════════════════════════════════════════

  // Projects section label
  const projLabel = document.querySelector(".projects-section .section-label");
  if (projLabel) {
    gsap.set(projLabel, { opacity: 0, y: reduced ? 0 : 15 });
    gsap.to(projLabel, {
      opacity: 1,
      y: 0,
      duration: dur(0.5),
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".projects-section",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  }

  // Card entrance animations
  document.querySelectorAll(".project-card").forEach((card) => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: dur(0.8),
      ease: "expo.out",
      scrollTrigger: {
        trigger: card,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });
  });

  // ── Project Visualizations ──

  function setupVizCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    let animating = false;
    let raf = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    return {
      canvas,
      ctx,
      resize,
      get w() {
        return canvas.parentElement.getBoundingClientRect().width;
      },
      get h() {
        return canvas.parentElement.getBoundingClientRect().height;
      },
      start(renderFn) {
        if (animating) return;
        animating = true;
        const loop = () => {
          if (!animating) return;
          renderFn();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      },
      stop() {
        animating = false;
        cancelAnimationFrame(raf);
      }
    };
  }

  // ── Viz 1: NeuroVox — Audio Waveform ──

  const vizNV = setupVizCanvas("viz-neurovox");
  if (vizNV) {
    let nvTime = 0;

    function renderNeurovox() {
      const { ctx, w, h } = vizNV;
      ctx.clearRect(0, 0, w, h);
      nvTime += 0.03;

      const centerY = h / 2;
      const barCount = Math.floor(w / 6);

      for (let i = 0; i < barCount; i++) {
        const x = (i / barCount) * w;
        const freq1 = Math.sin(i * 0.15 + nvTime * 2) * 0.6;
        const freq2 = Math.sin(i * 0.08 + nvTime * 1.3) * 0.3;
        const freq3 = Math.cos(i * 0.22 + nvTime * 0.7) * 0.1;
        const amplitude = (freq1 + freq2 + freq3) * (h * 0.35);

        const barHeight = Math.abs(amplitude);
        const alpha = 0.3 + Math.abs(freq1) * 0.7;

        ctx.fillStyle = `rgba(0, 255, 135, ${alpha})`;
        ctx.fillRect(x, centerY - barHeight / 2, 3, barHeight);
      }
    }

    ScrollTrigger.create({
      trigger: "#viz-neurovox",
      start: "top 90%",
      end: "bottom 10%",
      onEnter: () => {
        vizNV.resize();
        vizNV.start(renderNeurovox);
      },
      onLeave: () => vizNV.stop(),
      onEnterBack: () => {
        vizNV.resize();
        vizNV.start(renderNeurovox);
      },
      onLeaveBack: () => vizNV.stop()
    });

    if (reduced) {
      // Render a single static frame
      vizNV.resize();
      renderNeurovox();
    }
  }

  // ── Viz 1b: Foodhy — Orbiting Nodes ──

  const vizFoodhy = setupVizCanvas("viz-foodhy");
  if (vizFoodhy) {
    let fhTime = 0;
    const fhNodes = Array.from({ length: 28 }, (_, i) => ({
      angle: (i / 28) * Math.PI * 2,
      radius: 30 + Math.random() * 70,
      speed: 0.004 + Math.random() * 0.01,
      size: 1.5 + Math.random() * 2.5
    }));

    function renderFoodhy() {
      const { ctx, w, h } = vizFoodhy;
      ctx.clearRect(0, 0, w, h);
      fhTime += 0.02;

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) / 220;

      ctx.strokeStyle = "rgba(0, 255, 135, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 90 * scale, 50 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      fhNodes.forEach((node, index) => {
        const angle = node.angle + fhTime * node.speed * (index % 2 === 0 ? 1 : -1);
        const r = node.radius * scale;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.7;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
        glow.addColorStop(0, "rgba(0, 255, 135, 0.7)");
        glow.addColorStop(1, "rgba(0, 255, 135, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, node.size * scale * 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ScrollTrigger.create({
      trigger: "#viz-foodhy",
      start: "top 90%",
      end: "bottom 10%",
      onEnter: () => {
        vizFoodhy.resize();
        vizFoodhy.start(renderFoodhy);
      },
      onLeave: () => vizFoodhy.stop(),
      onEnterBack: () => {
        vizFoodhy.resize();
        vizFoodhy.start(renderFoodhy);
      },
      onLeaveBack: () => vizFoodhy.stop()
    });

    if (reduced) {
      vizFoodhy.resize();
      renderFoodhy();
    }
  }

  // ── Viz 1c: OpenCart — Scanning Blocks ──

  const vizOpenCart = setupVizCanvas("viz-opencart");
  if (vizOpenCart) {
    let ocTime = 0;
    const columns = 16;

    function renderOpenCart() {
      const { ctx, w, h } = vizOpenCart;
      ctx.clearRect(0, 0, w, h);
      ocTime += 0.03;

      const colW = w / columns;
      for (let i = 0; i < columns; i++) {
        const wave = Math.sin(ocTime + i * 0.5);
        const blocks = 3 + Math.floor((wave + 1) * 2);
        for (let b = 0; b < blocks; b++) {
          const y = ((b + 1) / (blocks + 1)) * h;
          const pulse = 0.2 + Math.abs(Math.sin(ocTime + b + i)) * 0.6;
          ctx.fillStyle = `rgba(255, 184, 0, ${pulse})`;
          ctx.fillRect(i * colW + colW * 0.2, y, colW * 0.6, 6);
        }
      }

      ctx.strokeStyle = "rgba(255, 184, 0, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(12, 12, w - 24, h - 24);
      ctx.stroke();
    }

    ScrollTrigger.create({
      trigger: "#viz-opencart",
      start: "top 90%",
      end: "bottom 10%",
      onEnter: () => {
        vizOpenCart.resize();
        vizOpenCart.start(renderOpenCart);
      },
      onLeave: () => vizOpenCart.stop(),
      onEnterBack: () => {
        vizOpenCart.resize();
        vizOpenCart.start(renderOpenCart);
      },
      onLeaveBack: () => vizOpenCart.stop()
    });

    if (reduced) {
      vizOpenCart.resize();
      renderOpenCart();
    }
  }

  // ── Viz 2: DeepSight — Particle Eye Cluster ──

  const vizDS = setupVizCanvas("viz-deepsight");
  if (vizDS) {
    let dsTime = 0;
    const dsParticles = [];
    const particleCount = 200;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 80;
      dsParticles.push({
        baseAngle: angle,
        baseRadius: radius,
        speed: 0.002 + Math.random() * 0.008,
        size: 1 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    function renderDeepsight() {
      const { ctx, w, h } = vizDS;
      ctx.clearRect(0, 0, w, h);
      dsTime += 0.02;

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) / 250;

      for (const p of dsParticles) {
        // Eye shape: elliptical orbit squashed vertically
        const angle = p.baseAngle + dsTime * p.speed;
        const r = p.baseRadius * scale;
        const eyeSquash = 0.4 + Math.sin(angle * 2) * 0.15;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * eyeSquash;

        const pulse = 0.5 + Math.sin(dsTime * 2 + p.phase) * 0.3;

        ctx.fillStyle = `rgba(255, 184, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * scale * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central "pupil" glow
      const pupilGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15 * scale);
      pupilGrad.addColorStop(0, "rgba(255, 184, 0, 0.6)");
      pupilGrad.addColorStop(0.5, "rgba(255, 184, 0, 0.15)");
      pupilGrad.addColorStop(1, "rgba(255, 184, 0, 0)");
      ctx.fillStyle = pupilGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 15 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ScrollTrigger.create({
      trigger: "#viz-deepsight",
      start: "top 90%",
      end: "bottom 10%",
      onEnter: () => {
        vizDS.resize();
        vizDS.start(renderDeepsight);
      },
      onLeave: () => vizDS.stop(),
      onEnterBack: () => {
        vizDS.resize();
        vizDS.start(renderDeepsight);
      },
      onLeaveBack: () => vizDS.stop()
    });

    if (reduced) {
      vizDS.resize();
      renderDeepsight();
    }
  }

  // ── Viz 3: SynthMind — Cellular Automata Grid ──

  const vizSM = setupVizCanvas("viz-synthmind");
  if (vizSM) {
    let smTime = 0;

    function renderSynthmind() {
      const { ctx, w, h } = vizSM;
      ctx.clearRect(0, 0, w, h);
      smTime += 0.04;

      const cellSize = 12;
      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const x = col * cellSize;
          const y = row * cellSize;

          // Wave pattern across the grid
          const wave1 = Math.sin(col * 0.3 + smTime) * 0.5 + 0.5;
          const wave2 = Math.cos(row * 0.25 + smTime * 0.7) * 0.5 + 0.5;
          const wave3 = Math.sin((col + row) * 0.15 + smTime * 1.3) * 0.5 + 0.5;

          const intensity = (wave1 * wave2 + wave3) / 2;
          const alpha = intensity * 0.5;

          if (alpha > 0.08) {
            ctx.fillStyle = `rgba(74, 158, 255, ${alpha})`;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          }
        }
      }
    }

    ScrollTrigger.create({
      trigger: "#viz-synthmind",
      start: "top 90%",
      end: "bottom 10%",
      onEnter: () => {
        vizSM.resize();
        vizSM.start(renderSynthmind);
      },
      onLeave: () => vizSM.stop(),
      onEnterBack: () => {
        vizSM.resize();
        vizSM.start(renderSynthmind);
      },
      onLeaveBack: () => vizSM.stop()
    });

    if (reduced) {
      vizSM.resize();
      renderSynthmind();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: Contact Terminal
  // ═══════════════════════════════════════════════════════════════════════

  const linkedinUrl = "https://www.linkedin.com/in/juan-jose-castro-sarria-418921251/";
  const githubUrl = "https://github.com/Chologalactico";
  const emailUrl = "mailto:jcastrosarria216@gmail.com";

  const contactItems = [
    { label: "Email:", value: "@jcastrosarria216@gmail.com", href: emailUrl },
    { label: "GitHub:", value: "@Chologalactico", href: githubUrl },
    { label: "LinkedIn:", value: "@Juan Jose Castro Sarria", href: linkedinUrl }
  ];

  function renderContactLine(textEl, item) {
    if (!textEl) return;
    if (item.href) {
      textEl.innerHTML = `<a href="${item.href}" target="_blank" rel="noopener noreferrer" class="contact-link">${item.label}</a> ${item.value}`;
      return;
    }
    textEl.textContent = `${item.label} ${item.value}`;
  }

  if (reduced) {
    const cmdEl = document.querySelector(".contact-cmd");
    if (cmdEl) cmdEl.textContent = "JJ.contact()";
    document.querySelectorAll(".contact-line").forEach((el, i) => {
      const textEl = el.querySelector(".contact-line-text");
      renderContactLine(textEl, contactItems[i]);
    });
  } else {
    ScrollTrigger.create({
      trigger: ".contact-section",
      start: "top 60%",
      once: true,
      onEnter: () => {
        const contactTl = gsap.timeline();

        contactTl.to(".contact-cmd", {
          duration: 0.6,
          scrambleText: { text: "JJ.contact()", chars: scrambleChars, speed: 0.4 }
        });

        document.querySelectorAll(".contact-line").forEach((el, i) => {
          const textEl = el.querySelector(".contact-line-text");
          if (!textEl) return;
          contactTl.to(
            textEl,
            {
              duration: 0.5,
              scrambleText: {
                text: `${contactItems[i].label} ${contactItems[i].value}`,
                chars: scrambleChars,
                speed: 0.3
              },
              onComplete: () => {
                renderContactLine(textEl, contactItems[i]);
              }
            },
            `+=${i === 0 ? 0.3 : 0.1}`
          );
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6: Stack Terminal
  // ═══════════════════════════════════════════════════════════════════════

  function initTerminal() {
    const lines = document.querySelectorAll(".term-line, .term-output");

    if (reduced) {
      lines.forEach((line) => {
        line.style.opacity = "1";
        line.style.transform = "none";
      });
      document.querySelectorAll(".term-bar-fill").forEach((bar) => {
        bar.style.width = bar.style.getPropertyValue("--pct");
      });
      return;
    }

    ScrollTrigger.create({
      trigger: "#terminal-body",
      start: "top 82%",
      onEnter: () => {
        lines.forEach((line, i) => {
          const delay = i * 0.1;
          gsap.to(line, {
            opacity: 1,
            x: 0,
            duration: 0.4,
            delay,
            ease: "power2.out"
          });

          const bar = line.querySelector(".term-bar-fill");
          if (bar) {
            const targetPct = bar.style.getPropertyValue("--pct");
            gsap.to(bar, {
              width: targetPct,
              duration: 1.0,
              delay: delay + 0.15,
              ease: "power2.out"
            });
          }
        });
      }
    });
  }

  initTerminal();
}

// Auto-initialize when DOM is ready
if (typeof window !== "undefined") {
  const runInit = () => {
    // Wait a bit longer to ensure all elements are rendered
    setTimeout(() => {
      init().catch((error) => {
        console.error("Error initializing portfolio:", error);
      });
    }, 200);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInit);
  } else {
    // DOM is already ready, but wait a bit more for Astro hydration
    runInit();
  }
}

export default init;
