/* =============================================================
   RMKAAV Solutions — main site script
   Libraries expected on window: Lenis, gsap, ScrollTrigger, THREE.
   ============================================================= */

(function () {
    "use strict";

    const body = document.body;

    /* ---------- 1. Guards + plugin registration ---------- */
    if (!window.gsap || !window.ScrollTrigger) {
        console.warn("[mont] GSAP or ScrollTrigger missing — animations disabled.");
        body.classList.add("mont-ready");
        return;
    }
    gsap.registerPlugin(ScrollTrigger);
    // Ignore mobile URL-bar resize to stop refresh thrash.
    ScrollTrigger.config({ ignoreMobileResize: true });

    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

    /* ---------- Watchdog: force-ready after 4s no matter what ---------- */
    const readyWatchdog = setTimeout(() => {
        if (!body.classList.contains("mont-ready")) {
            console.warn("[mont] preloader watchdog fired — forcing ready");
            body.classList.add("mont-ready");
            if (lenis) lenis.start();
            const overlay = document.getElementById("montPreloader");
            if (overlay) overlay.style.display = "none";
            ScrollTrigger.refresh();
        }
    }, 4000);
    const markReady = () => {
        clearTimeout(readyWatchdog);
        body.classList.add("mont-ready");
    };

    /* ---------- Resolve palette for color tweens ---------- */
    const rootStyles = getComputedStyle(document.documentElement);
    const accent = (rootStyles.getPropertyValue("--accent") || "#c8a97e").trim();
    const creamMuted = (rootStyles.getPropertyValue("--cream-muted") || "#8a7f6d").trim();

    /* ---------- 2. Lenis init + ScrollTrigger wiring ----------
       Modern Lenis (v1+) preserves native window.scrollY, so
       ScrollTrigger sees real scroll events without scrollerProxy.
       We only need to forward Lenis's scroll tick to ST.update
       and drive Lenis from GSAP's single ticker. */
    let lenis = null;
    if (window.Lenis) {
        lenis = new Lenis({
            lerp: 0.08,
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.4
        });

        lenis.on("scroll", ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        // Lock Lenis until preloader finishes.
        lenis.stop();
    }

    /* ---------- 7. Throttled resize → refresh pins ---------- */
    let resizeRaf = null;
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (resizeRaf) cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
        }, 200);
    });

    /* ---------- 8. Fonts ready → refresh pins ---------- */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    /* =============================================================
       SECTION INITS
       ============================================================= */

    /* ---------- Preloader ---------- */
    function initPreloader() {
        const overlay = document.getElementById("montPreloader");
        const count = document.getElementById("mpCount");
        if (!overlay || !count) {
            markReady();
            if (lenis) lenis.start();
            return;
        }
        const line = overlay.querySelector(".mp-line");

        const obj = { v: 0 };
        const tl = gsap.timeline({
            onComplete: () => {
                markReady();
                if (lenis) {
                    lenis.start();
                    lenis.scrollTo(0, { immediate: true });
                }
                ScrollTrigger.refresh();
            }
        });

        tl.to(line, { scaleX: 1, duration: 1.6, ease: "expo.inOut" }, 0)
          .to(obj, {
              v: 100,
              duration: 1.6,
              ease: "expo.inOut",
              onUpdate: () => {
                  count.textContent = String(Math.round(obj.v)).padStart(2, "0");
              }
          }, 0)
          .to(overlay, {
              yPercent: -100,
              duration: 1,
              ease: "expo.inOut"
          }, "+=0.15");
    }

    /* ---------- Nav ---------- */
    function initNav() {
        const nav = document.getElementById("montNav");
        if (!nav) return;
        ScrollTrigger.create({
            start: 80,
            end: 99999,
            onEnter: () => nav.classList.add("scrolled"),
            onLeaveBack: () => nav.classList.remove("scrolled")
        });
    }

    /* ---------- Hero pin ---------- */
    function initHero() {
        const hero = document.getElementById("hero");
        if (!hero) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "+=100%",
                pin: true,
                pinSpacing: true,
                scrub: true
            }
        });

        tl.to(".mh-tagline, .mh-sub", { opacity: 0, ease: "none", duration: 0.4 }, 0)
          .to(".mh-scroll", { opacity: 0, ease: "none", duration: 0.2 }, 0)
          .to(".mh-word", { scale: 1.15, y: -80, ease: "none", duration: 0.6 }, 0.4);

        // Phase 4 — drift parallax
        gsap.utils.toArray(".mh-drift").forEach((blob, i) => {
            gsap.to(blob, {
                y: () => window.innerHeight * 0.3 * (i === 0 ? 1 : -0.7),
                ease: "none",
                scrollTrigger: {
                    trigger: hero,
                    start: "top top",
                    end: "bottom top",
                    scrub: true,
                    invalidateOnRefresh: true
                }
            });
        });
    }

    /* ---------- Mission word reveal ---------- */
    function initMission() {
        const section = document.getElementById("mission");
        if (!section) return;
        const words = section.querySelectorAll(".word");
        if (!words.length) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 75%",
                end: "bottom 45%",
                scrub: 0.6
            }
        });

        words.forEach((w, i) => {
            tl.to(w, {
                clipPath: "inset(0 0% 0 0)",
                duration: 0.22,
                ease: "none"
            }, i * 0.04);
        });
    }

    /* ---------- Services horizontal scroll ---------- */
    function initServices() {
        const section = document.getElementById("services");
        const track = document.getElementById("servicesTrack");
        if (!section || !track) return;

        if (isMobile()) return; // stacked via CSS, no pin

        const panels = track.querySelectorAll(".mo-panel");
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

        const horizTween = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => "+=" + distance(),
                pin: true,
                pinSpacing: true,
                scrub: 1,
                invalidateOnRefresh: true,
                anticipatePin: 1
            }
        });

        panels.forEach((panel) => {
            const num = panel.querySelector(".mo-num");
            const visual = panel.querySelector(".mo-visual");
            if (num) {
                gsap.fromTo(num,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1, y: 0, ease: "none",
                        scrollTrigger: {
                            trigger: panel,
                            containerAnimation: horizTween,
                            start: "left 80%",
                            end: "left 45%",
                            scrub: true
                        }
                    });
            }
            if (visual) {
                gsap.fromTo(visual,
                    { scale: 0.9 },
                    {
                        scale: 1, ease: "none",
                        scrollTrigger: {
                            trigger: panel,
                            containerAnimation: horizTween,
                            start: "left 90%",
                            end: "left 30%",
                            scrub: true
                        }
                    });
            }
        });
    }

    /* ---------- Work — cinematic full-bleed strip ---------- */
    function initWork() {
        const stages = document.querySelectorAll(".mw-stage");
        if (!stages.length) return;
        if (isMobile()) return; // stacked via CSS

        // Intro fade-in
        const intro = document.querySelector(".mw-intro");
        if (intro) {
            gsap.from(intro.children, {
                opacity: 0,
                y: 40,
                duration: 1,
                ease: "expo.out",
                stagger: 0.08,
                scrollTrigger: {
                    trigger: intro,
                    start: "top 80%",
                    toggleActions: "play none none none"
                }
            });
        }

        stages.forEach((stage) => {
            const frame = stage.querySelector(".mw-frame");
            const shape = stage.querySelector(".mw-shape");
            const specimen = stage.querySelector(".mw-specimen");
            const caseTag = stage.querySelector(".mw-case");
            const nameInner = stage.querySelector(".mw-stage-name span");
            const metas = stage.querySelectorAll(".mw-meta-item");

            // Initial state: offset + hidden
            gsap.set(frame, { xPercent: 28, opacity: 0 });
            gsap.set(shape, { xPercent: 40, opacity: 0 });
            gsap.set(specimen, { opacity: 0, y: 10 });
            gsap.set(caseTag, { opacity: 0, y: 16 });
            gsap.set(nameInner, { yPercent: 110 });
            gsap.set(metas, { opacity: 0, y: 18 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: stage,
                    start: "top top",
                    end: "+=120%",
                    pin: true,
                    pinSpacing: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    anticipatePin: 1
                }
            });

            // Entrance: 0 → 0.35
            tl.to(frame, { xPercent: 0, opacity: 1, ease: "none", duration: 0.3 }, 0)
              .to(shape, { xPercent: 0, opacity: 1, ease: "none", duration: 0.35 }, 0.05)
              .to(specimen, { opacity: 1, y: 0, ease: "none", duration: 0.15 }, 0.12)
              .to(caseTag, { opacity: 1, y: 0, ease: "none", duration: 0.15 }, 0.1)
              .to(nameInner, { yPercent: 0, ease: "none", duration: 0.32 }, 0.08)
              .to(metas, { opacity: 1, y: 0, ease: "none", duration: 0.22, stagger: 0.025 }, 0.18);

            // Hold 0.35 → 0.7 (no tweens)

            // Exit: 0.7 → 1 — subtle parallax + fade the frame toward the next stage
            tl.to(frame, { xPercent: -18, opacity: 0.6, ease: "none", duration: 0.3 }, 0.7)
              .to(shape, { xPercent: -30, opacity: 0.4, ease: "none", duration: 0.3 }, 0.7)
              .to(nameInner, { yPercent: -110, ease: "none", duration: 0.3 }, 0.7)
              .to([caseTag, specimen, metas], { opacity: 0, ease: "none", duration: 0.25 }, 0.72);
        });
    }

    /* ---------- Process steps (entrance via Motion spring, scroll-scrub line via GSAP) ---------- */
    function initProcess() {
        const steps = document.querySelectorAll(".mont-process .mp-step");
        if (!steps.length) return;

        const motion = window.Motion;
        const useMotion = motion && motion.animate;

        steps.forEach((step) => {
            const num = step.querySelector(".mp-num");
            const line = step.querySelector(".mp-line");

            ScrollTrigger.create({
                trigger: step,
                start: "top 82%",
                once: true,
                onEnter: () => {
                    if (useMotion) {
                        motion.animate(
                            step,
                            { opacity: 1, y: 0 },
                            { type: "spring", stiffness: 140, damping: 16, mass: 1 }
                        );
                    } else {
                        gsap.to(step, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" });
                    }
                }
            });

            if (line) {
                gsap.to(line, {
                    scaleX: 1,
                    duration: 1.2,
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: step,
                        start: "top 85%",
                        end: "bottom 55%",
                        scrub: 0.8
                    }
                });
            }

            if (num) {
                ScrollTrigger.create({
                    trigger: step,
                    start: "top 70%",
                    onEnter: () => gsap.to(num, { color: accent, duration: 0.6, ease: "expo.out" }),
                    onLeaveBack: () => gsap.to(num, { color: creamMuted, duration: 0.5, ease: "expo.out" })
                });
            }
        });
    }

    /* ---------- Stats count-up + Motion scale-pop ---------- */
    function initStats() {
        const motion = window.Motion;
        const useMotion = motion && motion.animate;

        const nums = document.querySelectorAll(".mt-num[data-count]");
        nums.forEach((el, i) => {
            const target = parseInt(el.dataset.count, 10);
            if (!Number.isFinite(target)) return;

            const obj = { v: 0 };
            ScrollTrigger.create({
                trigger: el,
                start: "top 88%",
                once: true,
                onEnter: () => {
                    gsap.to(obj, {
                        v: target,
                        duration: 1.6,
                        ease: "expo.out",
                        delay: i * 0.04,
                        onUpdate: () => {
                            el.textContent = Math.round(obj.v);
                        }
                    });
                    if (useMotion) {
                        motion.animate(
                            el,
                            { scale: [0.8, 1] },
                            { type: "spring", stiffness: 220, damping: 14, mass: 0.7, delay: i * 0.04 }
                        );
                    }
                }
            });
        });

        if (useMotion) {
            const inf = document.querySelector(".mt-num-inf");
            if (inf) {
                ScrollTrigger.create({
                    trigger: inf,
                    start: "top 88%",
                    once: true,
                    onEnter: () => {
                        motion.animate(
                            inf,
                            { scale: [0.8, 1] },
                            { type: "spring", stiffness: 220, damping: 14, mass: 0.7, delay: nums.length * 0.04 }
                        );
                    }
                });
            }
        }
    }

    /* ---------- CTA word reveal ---------- */
    function initCta() {
        const line = document.getElementById("ctaLine");
        if (!line) return;
        const words = line.querySelectorAll(".word");
        const section = document.getElementById("cta");

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 75%",
                end: "bottom 55%",
                scrub: 0.6
            }
        });

        words.forEach((w, i) => {
            tl.to(w, {
                clipPath: "inset(0 0% 0 0)",
                duration: 0.22,
                ease: "none"
            }, i * 0.05);
        });
    }

    /* =============================================================
       UI UPGRADE
       ============================================================= */

    /* ---------- Split hero word into chars for per-char hover ---------- */
    function initHeroChars() {
        const row = document.querySelector(".mh-word-row");
        if (!row) return;
        const text = row.textContent;
        row.textContent = "";
        [...text].forEach((ch) => {
            const span = document.createElement("span");
            span.className = "mh-char";
            span.textContent = ch;
            row.appendChild(span);
        });
    }

    /* ---------- Custom cursor ---------- */
    function initCursor() {
        const cursor = document.getElementById("montCursor");
        if (!cursor) return;
        const hasHover = window.matchMedia("(hover: hover)").matches;
        if (!hasHover || isMobile()) return;

        body.classList.add("mont-cursor-on");

        const ring = cursor.querySelector(".mc-ring");
        const dot = cursor.querySelector(".mc-dot");

        const motion = window.Motion;

        if (motion && motion.animate) {
            const { animate } = motion;
            let latestX = window.innerWidth / 2;
            let latestY = window.innerHeight / 2;
            let pending = false;

            window.addEventListener("mousemove", (e) => {
                latestX = e.clientX;
                latestY = e.clientY;
                if (pending) return;
                pending = true;
                requestAnimationFrame(() => {
                    animate(ring, { x: latestX, y: latestY }, { type: "spring", stiffness: 220, damping: 28, mass: 0.6 });
                    animate(dot, { x: latestX, y: latestY }, { type: "spring", stiffness: 600, damping: 40, mass: 0.3 });
                    pending = false;
                });
            }, { passive: true });
        } else {
            let targetX = window.innerWidth / 2;
            let targetY = window.innerHeight / 2;
            let ringX = targetX, ringY = targetY;
            let dotX = targetX, dotY = targetY;

            const setXRing = gsap.quickSetter(ring, "x", "px");
            const setYRing = gsap.quickSetter(ring, "y", "px");
            const setXDot = gsap.quickSetter(dot, "x", "px");
            const setYDot = gsap.quickSetter(dot, "y", "px");

            window.addEventListener("mousemove", (e) => {
                targetX = e.clientX;
                targetY = e.clientY;
            }, { passive: true });

            gsap.ticker.add(() => {
                ringX += (targetX - ringX) * 0.18;
                ringY += (targetY - ringY) * 0.18;
                dotX += (targetX - dotX) * 0.42;
                dotY += (targetY - dotY) * 0.42;
                setXRing(ringX);
                setYRing(ringY);
                setXDot(dotX);
                setYDot(dotY);
            });
        }

        const linkSelector = "a, button, .mn-cta, .mc-btn, .mw-apply";
        document.querySelectorAll(linkSelector).forEach((el) => {
            el.addEventListener("mouseenter", () => body.classList.add("mont-cursor-link"));
            el.addEventListener("mouseleave", () => body.classList.remove("mont-cursor-link"));
        });
    }

    /* ---------- Scroll progress bar ---------- */
    function initProgressBar() {
        const bar = document.querySelector(".mont-progress span");
        if (!bar) return;
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? (window.scrollY / max) : 0;
            bar.style.width = (p * 100).toFixed(2) + "%";
        };
        if (lenis) {
            lenis.on("scroll", update);
        } else {
            window.addEventListener("scroll", update, { passive: true });
        }
        update();
    }

    /* ---------- Magnetic buttons (Motion spring physics + press feedback) ---------- */
    function initMagnetic() {
        if (!window.matchMedia("(hover: hover)").matches) return;
        const motion = window.Motion;
        const useMotion = motion && motion.animate;
        const targets = document.querySelectorAll(".mn-cta, .mc-btn, .mw-apply");
        targets.forEach((el) => {
            const strength = 0.3;
            let pressed = false;

            el.addEventListener("mousemove", (e) => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const dx = (e.clientX - cx) * strength;
                const dy = (e.clientY - cy) * strength;
                if (useMotion) {
                    motion.animate(el, { x: dx, y: dy }, { type: "spring", stiffness: 250, damping: 18, mass: 0.8 });
                } else {
                    gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: "power3.out" });
                }
            });
            el.addEventListener("mouseleave", () => {
                if (useMotion) {
                    motion.animate(el, { x: 0, y: 0, scale: 1 }, { type: "spring", stiffness: 180, damping: 14, mass: 0.8 });
                } else {
                    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
                }
                pressed = false;
            });
            el.addEventListener("mousedown", () => {
                pressed = true;
                if (useMotion) {
                    motion.animate(el, { scale: 0.95 }, { type: "spring", stiffness: 500, damping: 25 });
                } else {
                    gsap.to(el, { scale: 0.95, duration: 0.15, ease: "power2.out" });
                }
            });
            el.addEventListener("mouseup", () => {
                if (!pressed) return;
                pressed = false;
                if (useMotion) {
                    motion.animate(el, { scale: 1 }, { type: "spring", stiffness: 400, damping: 12 });
                } else {
                    gsap.to(el, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
                }
            });
        });
    }

    /* ---------- Realistic Earth (Three.js, scroll-reactive) ----------
       Cinematic continent tour: Asia → Europe → Americas → Oceania,
       with zoom-ins at each stop and a full-view reset at the end.
       Atmospheric fresnel shell + idle spin + cursor parallax. */
    function initScene3D() {
        const canvas = document.getElementById("m3dEarth");
        if (!canvas) return;
        if (!window.THREE) {
            console.warn("[mont] three.js missing — earth disabled.");
            canvas.parentElement.style.display = "none";
            return;
        }

        const wrap = canvas.parentElement;
        const glow = document.querySelector(".m3d-earth-glow");

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        const scene = new THREE.Scene();
        // FOV + z fixed so the sphere ALWAYS renders as a complete circle
        // inside the canvas (no edge clipping). "Zoom" is done via CSS scale
        // on the wrap — the sphere stays perfectly round at every tour step.
        const camera = new THREE.PerspectiveCamera(
            44,
            wrap.clientWidth / wrap.clientHeight,
            0.1,
            100
        );
        camera.position.z = 6.2;

        // Textures — bundled locally under /assets/earth/
        const loader = new THREE.TextureLoader();
        const TEX_BASE = "assets/earth/";
        const earthTex = loader.load(TEX_BASE + "earth_atmos_2048.jpg");
        const bumpTex  = loader.load(TEX_BASE + "earth_normal_2048.jpg");
        const specTex  = loader.load(TEX_BASE + "earth_specular_2048.jpg");
        const cloudTex = loader.load(TEX_BASE + "earth_clouds_1024.png");
        earthTex.colorSpace = THREE.SRGBColorSpace;
        earthTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        bumpTex.anisotropy = earthTex.anisotropy;

        // Group so axial tilt applies to both surface + clouds together
        const earthGroup = new THREE.Group();
        earthGroup.rotation.z = 0.41; // ~23.5° axial tilt
        scene.add(earthGroup);

        // Earth surface
        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(2, 128, 128),
            new THREE.MeshPhongMaterial({
                map: earthTex,
                normalMap: bumpTex,
                normalScale: new THREE.Vector2(0.85, 0.85),
                specularMap: specTex,
                specular: new THREE.Color(0x334466),
                shininess: 18
            })
        );
        earthGroup.add(earth);

        // Cloud layer
        const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(2.025, 128, 128),
            new THREE.MeshPhongMaterial({
                map: cloudTex,
                transparent: true,
                opacity: 0.48,
                depthWrite: false
            })
        );
        earthGroup.add(clouds);

        // Atmosphere fresnel shell (slightly larger, back-side, additive)
        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 128, 128),
            new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }`,
                fragmentShader: `
                    varying vec3 vNormal;
                    void main() {
                        float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
                        vec3 col = mix(vec3(0.39, 0.4, 0.95), vec3(0.55, 0.36, 0.93), 0.5);
                        gl_FragColor = vec4(col, 1.0) * intensity;
                    }`,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            })
        );
        earthGroup.add(atmosphere);

        // Lighting — strong directional sun + violet rim + soft ambient
        scene.add(new THREE.AmbientLight(0x404066, 0.55));
        const sun = new THREE.DirectionalLight(0xffffff, 1.6);
        sun.position.set(5, 1.6, 4);
        scene.add(sun);
        const rim = new THREE.DirectionalLight(0x8b5cf6, 0.55);
        rim.position.set(-4, 0.5, -3);
        scene.add(rim);
        const fill = new THREE.PointLight(0xec4899, 0.25, 0, 0);
        fill.position.set(-3, 3, 5);
        scene.add(fill);

        // ---- Continent tour keyframes ----
        // Three.js sphere texture: ry=0 shows prime meridian (Europe/Africa);
        // +π/2 rotates Asia to the front; -π/2 rotates Americas to front.
        // Tour — sphere stays fully round at every step. `scale` enlarges
        // the whole wrap (CSS transform) for zoom without clipping the shape.
        // Centered deep-zoom keyframes (x=0,y=0) at each continent; drift
        // keyframes in between with smaller scale so earth stays in view.
        const tour = [
            { p: 0.00, x:   0, y:   0, scale: 1.00, ry:  1.55, rx: 0.22 }, // intro: full view
            { p: 0.08, x: -10, y:  -5, scale: 1.10, ry:  1.50, rx: 0.22 }, // drift up-left
            { p: 0.18, x:   0, y:   0, scale: 1.75, ry:  1.30, rx: 0.24 }, // ZOOM on Asia, centered
            { p: 0.30, x:  16, y:   8, scale: 1.20, ry:  0.85, rx: 0.28 }, // drift right-down
            { p: 0.42, x:   0, y:   0, scale: 1.80, ry:  0.10, rx: 0.30 }, // ZOOM on Africa, centered
            { p: 0.54, x: -18, y:  -4, scale: 1.20, ry: -0.55, rx: 0.30 }, // drift left
            { p: 0.64, x:   0, y:   0, scale: 1.85, ry: -1.30, rx: 0.32 }, // ZOOM on Americas
            { p: 0.76, x:  14, y:  12, scale: 1.15, ry: -2.30, rx: 0.12 }, // drift right-down
            { p: 0.86, x:   0, y:   0, scale: 1.70, ry: -2.90, rx: 0.00 }, // ZOOM on Pacific/Oceania
            { p: 0.95, x:  -8, y:  -6, scale: 1.10, ry: -3.60, rx: 0.15 }, // pulling back
            { p: 1.00, x:   0, y:   0, scale: 1.00, ry: -3.95, rx: 0.22 }  // outro: full view
        ];
        const smoothstep = (t) => t * t * (3 - 2 * t);
        const sampleTour = (p) => {
            if (p <= tour[0].p) return tour[0];
            if (p >= tour[tour.length - 1].p) return tour[tour.length - 1];
            for (let i = 0; i < tour.length - 1; i++) {
                const a = tour[i], b = tour[i + 1];
                if (p >= a.p && p <= b.p) {
                    const t = smoothstep((p - a.p) / (b.p - a.p));
                    return {
                        x:     a.x     + (b.x     - a.x)     * t,
                        y:     a.y     + (b.y     - a.y)     * t,
                        scale: a.scale + (b.scale - a.scale) * t,
                        ry:    a.ry    + (b.ry    - a.ry)    * t,
                        rx:    a.rx    + (b.rx    - a.rx)    * t
                    };
                }
            }
            return tour[tour.length - 1];
        };

        // Scroll tracking
        const state = { progress: 0 };
        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => { state.progress = self.progress; }
        });

        // Idle cursor parallax (desktop)
        let mx = 0, my = 0, tx = 0, ty = 0;
        if (window.matchMedia("(hover: hover)").matches) {
            window.addEventListener("mousemove", (e) => {
                mx = (e.clientX / window.innerWidth - 0.5) * 0.12;
                my = (e.clientY / window.innerHeight - 0.5) * 0.08;
            }, { passive: true });
        }

        // Render loop — single GSAP ticker drives Lenis + earth
        // Idle spin: fades out as the user starts scrolling so tour keyframes
        // take over cleanly, but gives a visible "alive" rotation at the top.
        let idleSpin = 0;
        gsap.ticker.add(() => {
            tx += (mx - tx) * 0.04;
            ty += (my - ty) * 0.04;
            // Idle spin fades in the first 15% of scroll then disappears.
            const idleStrength = Math.max(0, 1 - state.progress / 0.15);
            idleSpin += 0.0018 * idleStrength;

            const s = sampleTour(state.progress);

            // Earth group rotates on Y (continent pan); tilt on X (hemisphere bias)
            earthGroup.rotation.y = s.ry + idleSpin + tx;
            earthGroup.rotation.x = s.rx + ty;
            // Clouds drift slower than surface for parallax depth
            clouds.rotation.y = idleSpin * 0.55;

            // Camera z stays fixed — sphere is ALWAYS a full round circle
            // in its canvas. Visual zoom is achieved via CSS scale below.

            // Earth position + scale transform
            const px = s.x * window.innerWidth / 100;
            const py = s.y * window.innerHeight / 100;
            wrap.style.transform =
                `translate(-50%, -50%) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) scale(${s.scale.toFixed(3)})`;
            if (glow) {
                // Glow follows earth position + softens at high zoom
                const gx = px + Math.sin(state.progress * Math.PI) * 40;
                const gy = py - Math.sin(state.progress * Math.PI) * 30;
                const gscale = 1 + (s.scale - 1) * 0.4;
                glow.style.transform =
                    `translate(-50%, -50%) translate(${gx.toFixed(1)}px, ${gy.toFixed(1)}px) scale(${gscale.toFixed(3)})`;
            }

            renderer.render(scene, camera);
        });

        // Resize handling (debounced)
        const resize = () => {
            const w = wrap.clientWidth;
            const h = wrap.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        };
        window.addEventListener("resize", () => {
            clearTimeout(initScene3D._rt);
            initScene3D._rt = setTimeout(resize, 150);
        });
    }

    /* ---------- Active section → nav link highlight ---------- */
    function initActiveNav() {
        const map = [
            { sel: "#hero", href: "#hero" },
            { sel: "#services", href: "#services" },
            { sel: "#work", href: "#work" },
            { sel: "#process", href: "#process" },
            { sel: "#cta", href: "#cta" }
        ];
        const links = document.querySelectorAll(".mn-links a");
        const setActive = (href) => {
            links.forEach((a) => {
                a.classList.toggle("is-active", a.getAttribute("href") === href);
            });
        };
        map.forEach(({ sel, href }) => {
            const el = document.querySelector(sel);
            if (!el) return;
            ScrollTrigger.create({
                trigger: el,
                start: "top 45%",
                end: "bottom 45%",
                onToggle: (self) => { if (self.isActive) setActive(href); }
            });
        });
    }

    /* =============================================================
       BOOT
       ============================================================= */
    function boot() {
        initHeroChars();
        initPreloader();
        initNav();
        initHero();
        initMission();
        initServices();
        initWork();
        initProcess();
        initStats();
        initCta();
        initCursor();
        initProgressBar();
        initMagnetic();
        initActiveNav();
        initScene3D();
        // Final refresh after all triggers registered.
        requestAnimationFrame(() => ScrollTrigger.refresh());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
