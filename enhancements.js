/* ============================================================
   RMKAAV Enhancements — Showcase features
   ------------------------------------------------------------
   Each feature is wrapped in a flag. Flip to false to disable
   instantly without removing any code.
   ============================================================ */

const FEATURES = {
    tiltCards:     true,   // Session 1 — Vanilla Tilt JS on service cards
    coverflow:     true,   // Session 2 — 3D coverflow testimonials
    scrollRocket:  true,   // Session 3 — scroll-driven rocket on process timeline
    heroLaptop:    false,
    siteBuilds:    true,   // Session 5 — "site builds itself" terminal intro
    dragPricing:   true,   // Session 6 — drag-to-build physics pricing (Matter.js lazy)
    signatureWall: true,   // Session 7 — visitor signature wall (Firebase/localStorage)
};

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const IS_TOUCH       = window.matchMedia('(hover: none)').matches;

/* ------------------------------------------------------------
   FEATURE 1 — Tilt Service Cards (Vanilla Tilt JS)
   Library: https://micku7zu.github.io/vanilla-tilt.js/
   Loaded from CDN in index.html before this script.
   ------------------------------------------------------------ */
function initTiltCards() {
    if (!FEATURES.tiltCards) return;
    // REDUCED_MOTION intentionally NOT checked here — this site IS the
    // animation showcase, so tilt runs regardless of user preference.
    if (IS_TOUCH) return;

    if (typeof VanillaTilt === 'undefined') {
        console.warn('[tilt] VanillaTilt library not loaded');
        return;
    }

    const cards = document.querySelectorAll('.services-grid .service-card');
    if (!cards.length) return;

    cards.forEach((c) => c.classList.add('js-tilt'));

    VanillaTilt.init(cards, {
        max: 18,                // max tilt rotation in degrees
        speed: 600,             // speed of the enter/exit transition
        perspective: 1000,      // 3D perspective
        scale: 1.04,            // slight zoom on hover
        glare: true,            // moving light reflection
        'max-glare': 0.35,      // intensity of glare
        'glare-prerender': false,
        gyroscope: false,       // disable mobile gyroscope (we hide on touch)
        reset: true,            // reset to neutral on mouseleave
        easing: 'cubic-bezier(0.03, 0.98, 0.52, 0.99)',
    });

    console.log('[tilt] VanillaTilt initialized on', cards.length, 'cards');
}

/* ------------------------------------------------------------
   FEATURE 2 — Coverflow 3D Testimonials
   ------------------------------------------------------------
   Layers a 3D iTunes-style coverflow on top of the existing
   carousel in script.js WITHOUT editing it. Strategy:
     1. Add `.coverflow` class to `.testimonial-carousel` — CSS
        overrides the track's translateX and lays cards out in 3D.
     2. Watch the `.carousel-dot.active` class via MutationObserver
        to learn the current slide index.
     3. For each card, compute its offset from the visual center
        and assign one of: cf-center / cf-left-1 / cf-right-1 /
        cf-left-2 / cf-right-2 / cf-hidden.
     4. Clicking a side card triggers the matching dot.
   REDUCED_MOTION intentionally not checked (showcase site).
   ------------------------------------------------------------ */
function initCoverflow() {
    if (!FEATURES.coverflow) return;

    const carousel = document.getElementById('testimonialCarousel');
    const track    = document.getElementById('testimonialTrack');
    const dotsWrap = document.getElementById('carouselDots');
    if (!carousel || !track || !dotsWrap) {
        console.warn('[coverflow] carousel nodes missing');
        return;
    }

    const cards = Array.from(track.querySelectorAll('.testimonial-card'));
    if (!cards.length) return;

    function perView() {
        const w = window.innerWidth;
        if (w <= 768) return 1;
        if (w <= 1024) return 2;
        return 3;
    }

    function activeDotIndex() {
        const dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));
        const i = dots.findIndex((d) => d.classList.contains('active'));
        return i < 0 ? 0 : i;
    }

    function centerCardIndex() {
        // script.js sets currentSlide = leftmost visible card of a
        // perView-sized window. The visual center is the middle of
        // that window.
        return activeDotIndex() + Math.floor(perView() / 2);
    }

    const POS_CLASSES = [
        'cf-center', 'cf-left-1', 'cf-right-1',
        'cf-left-2', 'cf-right-2', 'cf-hidden',
    ];

    function layout() {
        const center = centerCardIndex();
        cards.forEach((card, i) => {
            POS_CLASSES.forEach((c) => card.classList.remove(c));
            const d = i - center;
            if (d === 0)       card.classList.add('cf-center');
            else if (d === -1) card.classList.add('cf-left-1');
            else if (d ===  1) card.classList.add('cf-right-1');
            else if (d === -2) card.classList.add('cf-left-2');
            else if (d ===  2) card.classList.add('cf-right-2');
            else               card.classList.add('cf-hidden');
        });
    }

    function clickDotForCenter(targetCenterIdx) {
        // invert centerCardIndex()
        const dotIdx = targetCenterIdx - Math.floor(perView() / 2);
        const dots = Array.from(dotsWrap.querySelectorAll('.carousel-dot'));
        if (!dots.length) return;
        const clamped = Math.max(0, Math.min(dotIdx, dots.length - 1));
        dots[clamped].click();
    }

    // Click a side card → jump to it
    cards.forEach((card, i) => {
        card.addEventListener('click', () => {
            if (card.classList.contains('cf-center')) return;
            clickDotForCenter(i);
        });
    });

    // Watch dots for active changes
    const dotObserver = new MutationObserver(() => layout());
    dotObserver.observe(dotsWrap, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
        childList: true,
    });

    // Re-layout on resize (perView changes)
    let resizeT;
    window.addEventListener('resize', () => {
        clearTimeout(resizeT);
        resizeT = setTimeout(layout, 120);
    });

    // Turn on coverflow. Wait a tick so script.js has built dots.
    function enable() {
        carousel.classList.add('coverflow');
        layout();
    }
    if (dotsWrap.children.length) {
        enable();
    } else {
        // poll briefly for script.js to finish building dots
        let tries = 0;
        const poll = setInterval(() => {
            if (dotsWrap.children.length || ++tries > 40) {
                clearInterval(poll);
                enable();
            }
        }, 50);
    }

    console.log('[coverflow] initialized on', cards.length, 'testimonials');
}

/* ------------------------------------------------------------
   FEATURE 3 — Scroll-driven rocket on process timeline
   ------------------------------------------------------------
   Creates a track + fill + rocket emoji overlay on the process
   timeline. As the user scrolls through the section, the rocket
   flies from start to end of the track; each step glows as the
   rocket reaches it.

   - Desktop (>1024): horizontal (matches the top line layout).
   - Mobile (<=768): vertical track down the left of stacked steps.
   - Tablet: disabled (existing grid wraps to 2 rows).
   - Uses rAF + scroll listener (passive). Falls back cleanly if
     IntersectionObserver is unavailable.
   ------------------------------------------------------------ */
function initScrollRocket() {
    if (!FEATURES.scrollRocket) return;

    const timeline = document.querySelector('.process-timeline');
    if (!timeline) return;

    const steps = Array.from(timeline.querySelectorAll('.process-step'));
    if (!steps.length) return;

    function currentMode() {
        const w = window.innerWidth;
        if (w >= 1025) return 'horizontal';
        if (w <= 768)  return 'vertical';
        return 'off';
    }

    // Build track + rocket DOM (once)
    const track = document.createElement('div');
    track.className = 'rocket-track';
    const base = document.createElement('div');
    base.className = 'rocket-track-base';
    const fill = document.createElement('div');
    fill.className = 'rocket-track-fill';
    track.appendChild(base);
    track.appendChild(fill);

    const rocket = document.createElement('div');
    rocket.className = 'rocket-ship';
    rocket.textContent = '🚀';
    rocket.setAttribute('aria-hidden', 'true');

    timeline.appendChild(track);
    timeline.appendChild(rocket);
    timeline.classList.add('rocket-enabled');

    function applyMode() {
        const mode = currentMode();
        track.classList.remove('horizontal', 'vertical');
        rocket.classList.remove('horizontal', 'vertical');
        if (mode === 'off') {
            track.style.display = 'none';
            rocket.style.display = 'none';
            return;
        }
        track.style.display = '';
        rocket.style.display = '';
        track.classList.add(mode);
        rocket.classList.add(mode);
    }
    applyMode();

    // Compute scroll progress: 0 when section top hits 85% viewport,
    // 1 when section bottom hits 25% viewport.
    function progress() {
        const rect = timeline.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * 0.85;
        const end   = vh * 0.25;
        const top = rect.top;
        const bottom = rect.bottom;
        // As user scrolls, section moves up. We want 0 when top = start,
        // 1 when bottom = end.
        const travel = (start - top) / ((start - end) + (rect.height));
        return Math.max(0, Math.min(1, travel));
    }

    function render() {
        const mode = currentMode();
        if (mode === 'off') return;
        const p = progress();

        if (mode === 'horizontal') {
            fill.style.width = (p * 100) + '%';
            fill.style.height = '';
            const trackRect = track.getBoundingClientRect();
            const x = p * trackRect.width;
            rocket.style.transform = 'translateX(' + (x - 0) + 'px) translateX(-50%) rotate(90deg)';
        } else {
            fill.style.height = (p * 100) + '%';
            fill.style.width = '';
            const trackRect = track.getBoundingClientRect();
            const y = p * trackRect.height;
            rocket.style.transform = 'translate(-50%, ' + y + 'px) rotate(0deg)';
        }

        // Glow steps the rocket has reached. Distribute evenly.
        steps.forEach((s, i) => {
            const threshold = (i + 0.5) / steps.length;
            s.classList.toggle('rocket-reached', p >= threshold);
        });
    }

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { render(); ticking = false; });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { applyMode(); render(); });
    render();

    console.log('[rocket] initialized on process timeline, mode=' + currentMode());
}

/* ------------------------------------------------------------
   FEATURE 5 — "Site builds itself" terminal intro
   ------------------------------------------------------------
   Drops a fullscreen terminal overlay (z above stock preloader)
   on first visit only. ~4 second fake build sequence, then fades
   out. localStorage flag `rmkaav_intro_seen` makes it once-only.
   Skip button visible from frame 1. After it ends (or on repeat
   visits) a small "▶ replay intro" pill appears bottom-left.
   ------------------------------------------------------------ */
function initSiteBuilds() {
    if (!FEATURES.siteBuilds) return;

    const STORAGE_KEY = 'rmkaav_intro_seen';

    const SCRIPT = [
        { t: 0,    html: '<span class="tprompt">rmkaav$</span> ./build-experience --client=visitor' },
        { t: 380,  html: '<span class="tdim">[boot]</span> initializing rmkaav runtime...' },
        { t: 780,  html: '&gt; mounting hero stage................. <span class="tok">[ok]</span>' },
        { t: 1140, html: '&gt; loading 3D robot model.............. <span class="tok">[ok]</span>' },
        { t: 1500, html: '&gt; attaching tilt cards (×3)........... <span class="tok">[ok]</span>' },
        { t: 1860, html: '&gt; assembling coverflow testimonials... <span class="tok">[ok]</span>' },
        { t: 2220, html: '&gt; arming scroll-driven rocket......... <span class="tok">[ok]</span>' },
        { t: 2580, html: '&gt; warming pricing physics engine...... <span class="tok">[ok]</span>' },
        { t: 2940, html: '&gt; opening signature wall canvas....... <span class="tok">[ok]</span>' },
        { t: 3200, html: '' },
        { t: 3300, html: '<span class="taccent">✓ system online</span> — welcome to <span class="taccent">RMKAAV</span>' },
        { t: 3650, html: '<span class="tprompt">rmkaav$</span><span class="terminal-cursor"></span>' },
    ];
    const FINISH_AT = 4200;

    function buildOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'terminal-intro';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Site initialization');
        overlay.innerHTML = (
            '<div class="terminal-header">' +
                '<span class="terminal-dot r"></span>' +
                '<span class="terminal-dot y"></span>' +
                '<span class="terminal-dot g"></span>' +
                '<span class="terminal-title">rmkaav@solutions: ~/site — build</span>' +
            '</div>' +
            '<div class="terminal-body" data-term-body></div>' +
            '<button type="button" class="terminal-skip">skip ▶</button>'
        );
        document.body.appendChild(overlay);
        return overlay;
    }

    function play(overlay) {
        const body = overlay.querySelector('[data-term-body]');
        body.innerHTML = '';
        const timers = [];
        SCRIPT.forEach((step) => {
            timers.push(setTimeout(() => {
                const line = document.createElement('div');
                line.className = 'terminal-line';
                line.innerHTML = step.html || '&nbsp;';
                body.appendChild(line);
                body.scrollTop = body.scrollHeight;
            }, step.t));
        });
        const finish = setTimeout(() => close(overlay), FINISH_AT);
        overlay.querySelector('.terminal-skip').addEventListener('click', () => {
            timers.forEach(clearTimeout);
            clearTimeout(finish);
            close(overlay);
        });
    }

    function close(overlay) {
        overlay.classList.add('hidden');
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
        const stockPre = document.getElementById('preloader');
        if (stockPre) stockPre.classList.add('hidden');
        setTimeout(() => overlay.remove(), 700);
        showReplay();
    }

    function showReplay() {
        if (document.querySelector('.intro-replay')) return;
        const btn = document.createElement('button');
        btn.className = 'intro-replay';
        btn.type = 'button';
        btn.textContent = '▶ replay intro';
        btn.addEventListener('click', () => {
            const o = buildOverlay();
            requestAnimationFrame(() => play(o));
        });
        document.body.appendChild(btn);
        requestAnimationFrame(() => btn.classList.add('show'));
    }

    let seen = false;
    try { seen = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) {}
    if (seen) {
        showReplay();
        return;
    }
    const overlay = buildOverlay();
    play(overlay);

    console.log('[intro] terminal intro started');
}

/* ------------------------------------------------------------
   FEATURE 6 — Drag-to-Build Physics Pricing
   ------------------------------------------------------------
   A 4th pricing tab ("🧩 Build Your Own"). Users drag feature
   pills into a basket; physics blocks tumble + stack there.
   Total updates live. "Get this package" pre-fills contact form.

   Implementation:
   - Matter.js (~80KB) lazy-loaded from /vendor only when the tab
     is opened the first time (no init cost if user never visits).
   - Pills HTML5-dragged into the canvas. Once dropped, a matter
     body is spawned at the drop location and the pill grays out.
   - Mobile (≤768px): physics canvas is hidden via CSS. Pills
     become tap-to-toggle checkboxes that drive the same state.
   ------------------------------------------------------------ */
function initDragPricing() {
    if (!FEATURES.dragPricing) return;

    const CATALOG = [
        { id: 'logo',    label: 'Logo Design',       price: 5000,  color: '#f59e0b' },
        { id: 'bizcard', label: 'Business Cards',    price: 2000,  color: '#ec4899' },
        { id: 'landing', label: 'Landing Page',      price: 15000, color: '#6366f1' },
        { id: 'website', label: '5-Page Website',    price: 35000, color: '#8b5cf6' },
        { id: 'seo',     label: 'SEO Setup',         price: 8000,  color: '#10b981' },
        { id: 'smm',     label: 'SMM (1 month)',     price: 12000, color: '#06b6d4' },
        { id: 'ads',     label: 'Google Ads Setup',  price: 7000,  color: '#ef4444' },
        { id: 'chatbot', label: 'AI Chatbot',        price: 20000, color: '#d2a8ff' },
        { id: 'email',   label: 'Email Automation',  price: 6000,  color: '#f97316' },
        { id: 'hosting', label: '1-yr Hosting',      price: 3000,  color: '#84cc16' },
    ];

    const tab = document.querySelector('.pricing-tab[data-tab="custom"]');
    const grid = document.getElementById('tab-custom');
    const pool = document.getElementById('builderPool');
    const basket = document.getElementById('builderBasket');
    const canvas = document.getElementById('builderCanvas');
    const totalEl = document.getElementById('builderTotal');
    const cta = document.getElementById('builderCta');
    const clearBtn = document.getElementById('builderClear');
    if (!tab || !grid || !pool || !basket || !canvas || !totalEl || !cta) return;

    const INR = (n) => '₹' + n.toLocaleString('en-IN');
    const selected = new Set(); // set of item ids currently in basket

    // Build pool pills
    CATALOG.forEach((item) => {
        const pill = document.createElement('div');
        pill.className = 'builder-pill';
        pill.setAttribute('draggable', 'true');
        pill.dataset.id = item.id;
        pill.style.setProperty('--pill-color', item.color);
        pill.innerHTML = '<span>' + item.label + '</span><span class="price">' + INR(item.price) + '</span>';
        pool.appendChild(pill);
    });

    function updateTotal() {
        let sum = 0;
        selected.forEach((id) => {
            const item = CATALOG.find((c) => c.id === id);
            if (item) sum += item.price;
        });
        totalEl.textContent = INR(sum);
        totalEl.classList.add('bump');
        setTimeout(() => totalEl.classList.remove('bump'), 320);
        cta.disabled = selected.size === 0;
        if (clearBtn) clearBtn.disabled = selected.size === 0;
        basket.classList.toggle('has-items', selected.size > 0);
    }

    function removeItem(id) {
        if (!selected.has(id)) return;
        selected.delete(id);
        const pill = pool.querySelector('.builder-pill[data-id="' + id + '"]');
        if (pill) { pill.classList.remove('in-basket'); pill.classList.remove('checked'); }
        // Remove matter body if present
        const body = bodies.get(id);
        if (body && engine) {
            Matter.World.remove(engine.world, body);
            bodies.delete(id);
        }
        updateTotal();
    }

    function clearBasket() {
        [...selected].forEach(removeItem);
    }

    if (clearBtn) clearBtn.addEventListener('click', clearBasket);

    // CTA: scroll to contact + prefill textarea
    cta.addEventListener('click', () => {
        const items = [...selected].map((id) => {
            const it = CATALOG.find((c) => c.id === id);
            return it.label + ' (' + INR(it.price) + ')';
        });
        let total = 0;
        selected.forEach((id) => { total += CATALOG.find((c) => c.id === id).price; });
        const message =
            "Hi! I'd like to get a custom package with the following:\n\n• " +
            items.join('\n• ') +
            "\n\nEstimated total: " + INR(total) + " + 18% GST.\n\nPlease get in touch.";
        const textarea = document.querySelector('#contactForm textarea, textarea[name="message"]');
        if (textarea) {
            textarea.value = message;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const section = document.getElementById('contact');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // --- Mobile: checkbox-style toggle, no physics ---
    function isMobile() { return window.innerWidth <= 768; }
    function wireMobileToggle() {
        pool.addEventListener('click', (e) => {
            if (!isMobile()) return;
            const pill = e.target.closest('.builder-pill');
            if (!pill) return;
            const id = pill.dataset.id;
            if (selected.has(id)) {
                selected.delete(id);
                pill.classList.remove('checked');
            } else {
                selected.add(id);
                pill.classList.add('checked');
            }
            updateTotal();
        });
    }
    wireMobileToggle();

    // --- Desktop: lazy-load Matter.js on first tab open ---
    let matterReady = false;
    let matterLoading = false;
    let engine, world, runner, render, mouseConstraint;
    const bodies = new Map(); // id -> { body, el }

    function loadMatter() {
        if (matterReady) return Promise.resolve();
        if (matterLoading) {
            return new Promise((res) => {
                const check = setInterval(() => {
                    if (matterReady) { clearInterval(check); res(); }
                }, 30);
            });
        }
        matterLoading = true;
        return new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'vendor/matter.min.js';
            s.onload = () => { matterReady = true; res(); };
            s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    function setupPhysics() {
        const { Engine, World, Bodies, Runner, Render, Mouse, MouseConstraint, Composite } = Matter;
        const w = basket.clientWidth;
        const h = basket.clientHeight;
        canvas.width = w;
        canvas.height = h;

        engine = Engine.create();
        engine.gravity.y = 1;
        world = engine.world;

        render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: w, height: h,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio || 1,
            },
        });
        Render.run(render);

        runner = Runner.create();
        Runner.run(runner, engine);

        // Walls
        const wallOpts = { isStatic: true, render: { visible: false } };
        World.add(world, [
            Bodies.rectangle(w / 2, h + 20, w + 40, 40, wallOpts),     // floor
            Bodies.rectangle(-20, h / 2, 40, h * 2, wallOpts),         // left
            Bodies.rectangle(w + 20, h / 2, 40, h * 2, wallOpts),      // right
            Bodies.rectangle(w / 2, -20, w + 40, 40, wallOpts),        // ceiling
        ]);

        // Click (without drag) on a body → remove that item
        let mouseDownPos = null;
        canvas.addEventListener('mousedown', (e) => {
            const r = canvas.getBoundingClientRect();
            mouseDownPos = { x: e.clientX - r.left, y: e.clientY - r.top, t: Date.now() };
        });
        canvas.addEventListener('mouseup', (e) => {
            if (!mouseDownPos) return;
            const r = canvas.getBoundingClientRect();
            const upX = e.clientX - r.left, upY = e.clientY - r.top;
            const dx = upX - mouseDownPos.x, dy = upY - mouseDownPos.y;
            const dist = Math.hypot(dx, dy);
            const held = Date.now() - mouseDownPos.t;
            mouseDownPos = null;
            if (dist < 6 && held < 350) {
                // Treat as a click — find body at this point
                const hits = Matter.Query.point(Composite.allBodies(engine.world), { x: upX, y: upY });
                for (const body of hits) {
                    if (body.isStatic) continue;
                    if (bodies.has(body.label)) {
                        removeItem(body.label);
                        break;
                    }
                }
            }
        });

        // Mouse drag
        const mouse = Mouse.create(canvas);
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false },
            },
        });
        World.add(world, mouseConstraint);
        render.mouse = mouse;

        // Handle resize
        window.addEventListener('resize', () => {
            if (!engine) return;
            const nw = basket.clientWidth;
            const nh = basket.clientHeight;
            render.bounds.max.x = nw;
            render.bounds.max.y = nh;
            render.options.width = nw;
            render.options.height = nh;
            Render.setPixelRatio(render, window.devicePixelRatio || 1);
            canvas.width = nw;
            canvas.height = nh;
        });
    }

    function spawnBlock(item, xRel, yRel) {
        if (!matterReady || !engine) return;
        const { Bodies, World } = Matter;
        // Size ~ log-scaled by price
        const baseW = 90 + Math.min(80, item.price / 500);
        const box = Bodies.rectangle(xRel, yRel, baseW, 44, {
            restitution: 0.35,
            friction: 0.4,
            chamfer: { radius: 10 },
            render: {
                fillStyle: item.color,
                strokeStyle: 'rgba(255,255,255,0.25)',
                lineWidth: 1,
            },
            label: item.id,
        });
        // Overlay label via canvas post-render
        World.add(engine.world, box);
        bodies.set(item.id, box);

        // Draw labels on top every frame
        if (!spawnBlock._hooked) {
            spawnBlock._hooked = true;
            Matter.Events.on(render, 'afterRender', () => {
                const ctx = render.context;
                ctx.save();
                ctx.font = '600 12px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                bodies.forEach((body, id) => {
                    const item = CATALOG.find((c) => c.id === id);
                    if (!item) return;
                    ctx.save();
                    ctx.translate(body.position.x, body.position.y);
                    ctx.rotate(body.angle);
                    ctx.fillStyle = 'rgba(255,255,255,0.98)';
                    ctx.fillText(item.label, 0, -5);
                    ctx.font = '500 10px Inter, sans-serif';
                    ctx.fillStyle = 'rgba(255,255,255,0.75)';
                    ctx.fillText(INR(item.price), 0, 9);
                    ctx.font = '600 12px Inter, sans-serif';
                    ctx.restore();
                });
                ctx.restore();
            });
        }
    }

    // HTML5 drag-and-drop from pool → basket
    pool.addEventListener('dragstart', (e) => {
        if (isMobile()) return;
        const pill = e.target.closest('.builder-pill');
        if (!pill || pill.classList.contains('in-basket')) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/plain', pill.dataset.id);
        e.dataTransfer.effectAllowed = 'copy';
    });

    basket.addEventListener('dragover', (e) => {
        if (isMobile()) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        basket.classList.add('drag-over');
    });
    basket.addEventListener('dragleave', () => basket.classList.remove('drag-over'));

    basket.addEventListener('drop', async (e) => {
        e.preventDefault();
        basket.classList.remove('drag-over');
        const id = e.dataTransfer.getData('text/plain');
        const item = CATALOG.find((c) => c.id === id);
        if (!item || selected.has(id)) return;

        await loadMatter();
        if (!engine) setupPhysics();

        const rect = basket.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spawnBlock(item, Math.max(40, Math.min(rect.width - 40, x)), Math.max(30, y));

        selected.add(id);
        const pill = pool.querySelector('.builder-pill[data-id="' + id + '"]');
        if (pill) pill.classList.add('in-basket');
        updateTotal();
    });

    // When user clicks the tab, pre-warm Matter.js so first drop is instant
    tab.addEventListener('click', () => {
        if (isMobile()) return;
        loadMatter().then(() => {
            if (!engine) setupPhysics();
        });
    });

    console.log('[drag-pricing] builder wired, catalog size=' + CATALOG.length);
}

/* ------------------------------------------------------------
   FEATURE 7 — Signature Wall
   ------------------------------------------------------------
   Visitors draw their mark on a canvas; the most recent 50
   signatures display above the footer.

   Storage strategy:
   - If Firebase is configured (window.db exists), use Firestore
     collection `signatures`. Writes also live-update other tabs
     via onSnapshot. 24h client-side filter on reads.
   - Otherwise, fall back to localStorage (demo mode) so the
     feature still works in dev without a backend.

   Rate limit: 1 signature per browser per hour
   (`rmkaav_last_sig_ts` in localStorage).

   Signatures are stored as SVG-path-like strings: series of
   "M x,y L x,y L x,y" normalized to a 0..1 coordinate space so
   they scale cleanly in the gallery tiles.
   ------------------------------------------------------------ */
function initSignatureWall() {
    if (!FEATURES.signatureWall) return;

    const section = document.getElementById('signatureWall');
    if (!section) return;

    const gallery   = document.getElementById('sigwallGallery');
    const counter   = document.getElementById('sigwallCounter');
    const openBtn   = document.getElementById('sigwallOpen');
    const modal     = document.getElementById('sigwallModal');
    const closeBtn  = document.getElementById('sigwallClose');
    const pad       = document.getElementById('sigwallPad');
    const nameInput = document.getElementById('sigwallName');
    const clearBtn  = document.getElementById('sigwallClear');
    const submitBtn = document.getElementById('sigwallSubmit');
    const note      = document.getElementById('sigwallNote');

    const RATE_KEY    = 'rmkaav_last_sig_ts';
    const RATE_MS     = 60 * 60 * 1000;   // 1 hour
    const WINDOW_MS   = 24 * 60 * 60 * 1000; // 24h client-side filter
    const MAX_SHOWN   = 50;
    const LS_KEY      = 'rmkaav_sigwall_demo';

    const hasFirestore = !!(window.firebase && window.db && typeof window.db.collection === 'function');

    // --- Drawing logic ---
    const ctx = pad.getContext('2d');
    const strokes = []; // array of arrays of [xNorm, yNorm]
    let current = null;
    let drawing = false;

    function resizePad() {
        const ratio = window.devicePixelRatio || 1;
        const rect = pad.getBoundingClientRect();
        pad.width  = Math.round(rect.width  * ratio);
        pad.height = Math.round(rect.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        redraw();
    }

    function getPt(e) {
        const rect = pad.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : null;
        const cx = touch ? touch.clientX : e.clientX;
        const cy = touch ? touch.clientY : e.clientY;
        return {
            x: (cx - rect.left) / rect.width,  // normalized 0..1
            y: (cy - rect.top)  / rect.height,
        };
    }

    function drawStrokes(strokesArr, targetCtx, w, h) {
        targetCtx.clearRect(0, 0, w, h);
        targetCtx.lineWidth = 2.5;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';
        targetCtx.strokeStyle = '#e5e7eb';
        strokesArr.forEach((stroke) => {
            if (stroke.length < 2) return;
            targetCtx.beginPath();
            targetCtx.moveTo(stroke[0][0] * w, stroke[0][1] * h);
            for (let i = 1; i < stroke.length; i++) {
                targetCtx.lineTo(stroke[i][0] * w, stroke[i][1] * h);
            }
            targetCtx.stroke();
        });
    }

    function redraw() {
        const rect = pad.getBoundingClientRect();
        drawStrokes(strokes, ctx, rect.width, rect.height);
    }

    function start(e) {
        e.preventDefault();
        drawing = true;
        current = [];
        const p = getPt(e);
        current.push([p.x, p.y]);
        strokes.push(current);
    }
    function move(e) {
        if (!drawing) return;
        e.preventDefault();
        const p = getPt(e);
        current.push([p.x, p.y]);
        redraw();
    }
    function end() { drawing = false; current = null; }

    pad.addEventListener('mousedown', start);
    pad.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    pad.addEventListener('touchstart', start, { passive: false });
    pad.addEventListener('touchmove',  move,  { passive: false });
    pad.addEventListener('touchend',   end);

    clearBtn.addEventListener('click', () => {
        strokes.length = 0;
        redraw();
        note.textContent = '';
        note.className = 'sigwall-modal-note';
    });

    // --- Gallery rendering ---
    function strokesToSvg(strokesArr) {
        const paths = strokesArr.map((s) => {
            if (!s.length) return '';
            return 'M ' + s.map(([x, y]) => (x * 200).toFixed(1) + ',' + (y * 100).toFixed(1)).join(' L ');
        }).join(' ');
        return '<svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet"><path d="' + paths + '"/></svg>';
    }

    function formatTime(ts) {
        const diff = Date.now() - ts;
        if (diff < 60_000) return 'just now';
        if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm';
        return Math.floor(diff / 3_600_000) + 'h';
    }

    function renderGallery(items) {
        const fresh = items
            .filter((i) => Date.now() - (i.ts || 0) < WINDOW_MS)
            .slice(0, MAX_SHOWN);
        gallery.querySelectorAll('.sigwall-item').forEach((n) => n.remove());
        if (!fresh.length) {
            gallery.classList.remove('has-items');
            counter.textContent = '';
            return;
        }
        gallery.classList.add('has-items');
        counter.textContent = fresh.length + ' signature' + (fresh.length === 1 ? '' : 's') + ' in last 24h';
        fresh.forEach((sig) => {
            const el = document.createElement('div');
            el.className = 'sigwall-item';
            el.innerHTML =
                strokesToSvg(sig.strokes || []) +
                '<div class="sig-meta">' +
                    '<span class="sig-name">' + escapeHTML(sig.name || 'Anonymous') + '</span>' +
                    '<span>' + formatTime(sig.ts) + '</span>' +
                '</div>';
            gallery.appendChild(el);
        });
    }

    function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, (c) =>
            ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    // --- Storage abstractions ---
    function loadDemo() {
        try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
    }
    function saveDemo(arr) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, MAX_SHOWN))); } catch {}
    }

    async function loadAll() {
        if (hasFirestore) {
            try {
                const snap = await window.db.collection('signatures')
                    .orderBy('ts', 'desc')
                    .limit(MAX_SHOWN)
                    .get();
                return snap.docs.map((d) => d.data());
            } catch (e) {
                console.warn('[sigwall] Firestore read failed, using demo mode', e);
                return loadDemo();
            }
        }
        return loadDemo();
    }

    async function saveOne(sig) {
        if (hasFirestore) {
            try {
                await window.db.collection('signatures').add({
                    name: sig.name,
                    strokes: JSON.stringify(sig.strokes),
                    ts: sig.ts,
                });
                return true;
            } catch (e) {
                console.warn('[sigwall] Firestore write failed, saving locally', e);
            }
        }
        const arr = loadDemo();
        arr.unshift(sig);
        saveDemo(arr);
        return true;
    }

    // Firestore docs stringify strokes; parse on read
    function normalize(sig) {
        if (typeof sig.strokes === 'string') {
            try { sig.strokes = JSON.parse(sig.strokes); } catch { sig.strokes = []; }
        }
        return sig;
    }

    // --- Modal lifecycle ---
    function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(resizePad);
        note.textContent = '';
        note.className = 'sigwall-modal-note';
        // Check rate limit on open
        const last = +localStorage.getItem(RATE_KEY) || 0;
        const remaining = (last + RATE_MS) - Date.now();
        if (remaining > 0) {
            note.textContent = 'You already signed recently — try again in ' +
                Math.ceil(remaining / 60_000) + ' min.';
            note.className = 'sigwall-modal-note error';
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
        }
    }
    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        strokes.length = 0;
        if (nameInput) nameInput.value = '';
    }
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    // --- Submit ---
    submitBtn.addEventListener('click', async () => {
        if (!strokes.length || strokes.every((s) => s.length < 2)) {
            note.textContent = 'Please draw something first.';
            note.className = 'sigwall-modal-note error';
            return;
        }
        const last = +localStorage.getItem(RATE_KEY) || 0;
        if (Date.now() - last < RATE_MS) {
            note.textContent = 'Rate limit: one signature per hour.';
            note.className = 'sigwall-modal-note error';
            return;
        }
        submitBtn.disabled = true;
        const sig = {
            name: (nameInput.value || '').trim().slice(0, 40),
            strokes: strokes.map((s) => s.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)])),
            ts: Date.now(),
        };
        await saveOne(sig);
        try { localStorage.setItem(RATE_KEY, String(sig.ts)); } catch {}
        note.textContent = '✓ Signed! Thanks for leaving your mark.';
        note.className = 'sigwall-modal-note success';
        const items = (await loadAll()).map(normalize);
        items.unshift(sig); // optimistic merge in case Firestore lag
        renderGallery(dedupe(items));
        setTimeout(closeModal, 900);
    });

    function dedupe(items) {
        const seen = new Set();
        return items.filter((i) => {
            const k = i.ts + '|' + (i.name || '');
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    }

    // --- Initial load ---
    (async function () {
        const items = (await loadAll()).map(normalize);
        renderGallery(items);
    })();

    // Live updates from Firestore if available
    if (hasFirestore) {
        try {
            window.db.collection('signatures')
                .orderBy('ts', 'desc')
                .limit(MAX_SHOWN)
                .onSnapshot((snap) => {
                    const items = snap.docs.map((d) => normalize(d.data()));
                    renderGallery(items);
                });
        } catch (e) { /* ignore */ }
    }

    window.addEventListener('resize', () => {
        if (modal.classList.contains('open')) resizePad();
    });

    console.log('[sigwall] initialized (mode=' + (hasFirestore ? 'firestore' : 'demo/localStorage') + ')');
}

function initEnhancements() {
    initSiteBuilds();   // FIRST — covers the screen before other inits run
    initTiltCards();
    initCoverflow();
    initScrollRocket();
    initDragPricing();
    initSignatureWall();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
    initEnhancements();
}
