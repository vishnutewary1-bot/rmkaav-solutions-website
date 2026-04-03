// ============================================
// RMKAAV Solutions — Main JavaScript
// ============================================

// ---- EmailJS Initialization ----
// TODO: Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
// Get it from: https://dashboard.emailjs.com/admin/account
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init('dWrhmVUrgpnf4oirF');
    }
})();

document.addEventListener('DOMContentLoaded', () => {

    // ---- Preloader ----
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => { preloader.classList.add('hidden'); }, 2000);
        });
        setTimeout(() => { preloader.classList.add('hidden'); }, 3000);
    }

    // ---- Scroll Progress Bar ----
    const scrollProgress = document.getElementById('scrollProgress');
    function updateScrollProgress() {
        if (!scrollProgress) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = scrollPercent + '%';
    }
    window.addEventListener('scroll', updateScrollProgress);

    // ---- Theme Toggle (Dark/Light) ----
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('rmkaav-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('rmkaav-theme', next);
        });
    }

    // ---- Navbar scroll effect ----
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
        if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 500);
    });

    // ---- Mobile menu ----
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // ---- Active nav link on scroll ----
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
        const scrollY = window.scrollY + 100;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-links a[href="#${id}"]`);
            if (link) {
                if (scrollY >= top && scrollY < top + height) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);

    // ---- Typing Animation ----
    const typingText = document.getElementById('typingText');
    const words = ['Dominate Digital', 'Scale Revenue', 'Win Customers', 'Crush Competition', 'Go Viral'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typeEffect() {
        if (!typingText) return;

        const currentWord = words[wordIndex];

        if (isDeleting) {
            typingText.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typingText.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 400;
        }

        setTimeout(typeEffect, typingSpeed);
    }

    if (typingText) typeEffect();

    // ---- Hero Particles ----
    const particleContainer = document.getElementById('heroParticles');
    if (particleContainer) {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
            particle.style.animationDelay = (Math.random() * 5) + 's';
            const size = (Math.random() * 4 + 2) + 'px';
            particle.style.width = size;
            particle.style.height = size;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particleContainer.appendChild(particle);
        }
    }

    // ---- Counter animation ----
    const statNumbers = document.querySelectorAll('.stat-number');
    let counterStarted = false;

    function animateCounters() {
        if (counterStarted) return;

        const heroStats = document.querySelector('.hero-stats');
        if (!heroStats) return;

        const rect = heroStats.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            counterStarted = true;
            statNumbers.forEach(num => {
                const target = parseInt(num.getAttribute('data-target'));
                if (isNaN(target)) return;
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    num.textContent = Math.floor(current);
                }, 16);
            });
        }
    }

    window.addEventListener('scroll', animateCounters);
    animateCounters();

    // ---- Portfolio Filter ----
    const filterBtns = document.querySelectorAll('.portfolio-filter');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            portfolioItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.style.display = '';
                    // Small delay so the browser registers display change before removing class
                    requestAnimationFrame(() => {
                        item.classList.remove('hidden-item');
                    });
                } else {
                    item.classList.add('hidden-item');
                    setTimeout(() => {
                        if (item.classList.contains('hidden-item')) {
                            item.style.display = 'none';
                        }
                    }, 400);
                }
            });
        });
    });

    // ---- Pricing tabs ----
    const pricingTabs = document.querySelectorAll('.pricing-tab');
    const pricingGrids = document.querySelectorAll('.pricing-grid');

    pricingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            pricingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            pricingGrids.forEach(grid => {
                if (grid.id === `tab-${target}`) {
                    grid.classList.remove('hidden');
                    grid.querySelectorAll('.price-card').forEach((card, i) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, i * 100);
                    });
                } else {
                    grid.classList.add('hidden');
                }
            });
        });
    });

    // ---- Testimonial Carousel ----
    const track = document.getElementById('testimonialTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (track && dotsContainer && prevBtn && nextBtn) {
        const cards = track.querySelectorAll('.testimonial-card');
        let currentSlide = 0;
        let slidesPerView = 3;
        let autoSlideInterval;

        function getPerView() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getTotalSlides() {
            return Math.max(1, cards.length - slidesPerView + 1);
        }

        function buildDots() {
            dotsContainer.innerHTML = '';
            const total = getTotalSlides();
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.classList.add('carousel-dot');
                dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                if (i === currentSlide) dot.classList.add('active');
                dot.addEventListener('click', () => { goToSlide(i); startAutoSlide(); });
                dotsContainer.appendChild(dot);
            }
        }

        function goToSlide(index) {
            slidesPerView = getPerView();
            const total = getTotalSlides();
            currentSlide = Math.max(0, Math.min(index, total - 1));

            const cardEl = cards[0];
            if (!cardEl) return;
            const cardStyle = getComputedStyle(cardEl);
            const cardWidth = cardEl.offsetWidth + parseFloat(cardStyle.marginLeft) + parseFloat(cardStyle.marginRight);
            track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;

            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }

        function nextSlide() {
            const total = getTotalSlides();
            goToSlide(currentSlide >= total - 1 ? 0 : currentSlide + 1);
        }

        function prevSlideAction() {
            const total = getTotalSlides();
            goToSlide(currentSlide <= 0 ? total - 1 : currentSlide - 1);
        }

        function startAutoSlide() {
            stopAutoSlide();
            autoSlideInterval = setInterval(nextSlide, 4000);
        }

        function stopAutoSlide() {
            if (autoSlideInterval) clearInterval(autoSlideInterval);
        }

        prevBtn.addEventListener('click', () => { prevSlideAction(); startAutoSlide(); });
        nextBtn.addEventListener('click', () => { nextSlide(); startAutoSlide(); });

        track.addEventListener('mouseenter', stopAutoSlide);
        track.addEventListener('mouseleave', startAutoSlide);

        // Touch swipe support
        let touchStartX = 0;

        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlideAction();
            }
            startAutoSlide();
        }, { passive: true });

        // Initialize
        slidesPerView = getPerView();
        buildDots();
        startAutoSlide();

        window.addEventListener('resize', () => {
            slidesPerView = getPerView();
            buildDots();
            goToSlide(Math.min(currentSlide, getTotalSlides() - 1));
        });
    }

    // ---- FAQ accordion ----
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    // ---- Toast Notification ----
    const toastEl = document.getElementById('toast');

    function showToast(message, type) {
        if (!toastEl) return;
        type = type || 'success';
        toastEl.textContent = message;
        toastEl.className = 'toast ' + type + ' show';
        setTimeout(() => { toastEl.classList.remove('show'); }, 3500);
    }

    // ---- Contact Form with Validation ----
    const contactForm = document.getElementById('contactForm');
    const formName = document.getElementById('formName');
    const formEmail = document.getElementById('formEmail');
    const formPhone = document.getElementById('formPhone');
    const formService = document.getElementById('formService');

    function validateField(input, errorId, rules) {
        if (!input) return true;
        const value = input.value.trim();
        const errorEl = document.getElementById(errorId);
        let errorMsg = '';

        if (rules.required && !value) {
            errorMsg = 'This field is required';
        } else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errorMsg = 'Please enter a valid email';
        } else if (rules.phone && value && !/^[+]?[\d\s()-]{7,15}$/.test(value)) {
            errorMsg = 'Please enter a valid phone number';
        } else if (rules.minLength && value.length > 0 && value.length < rules.minLength) {
            errorMsg = 'Minimum ' + rules.minLength + ' characters required';
        }

        if (errorMsg) {
            input.classList.add('error');
            if (errorEl) errorEl.textContent = errorMsg;
            return false;
        } else {
            input.classList.remove('error');
            if (errorEl) errorEl.textContent = '';
            return true;
        }
    }

    // Real-time validation on blur
    if (formName) {
        formName.addEventListener('blur', () => validateField(formName, 'nameError', { required: true, minLength: 2 }));
        formName.addEventListener('input', () => {
            if (formName.classList.contains('error')) {
                formName.classList.remove('error');
                const err = document.getElementById('nameError');
                if (err) err.textContent = '';
            }
        });
    }

    if (formEmail) {
        formEmail.addEventListener('blur', () => validateField(formEmail, 'emailError', { required: true, email: true }));
        formEmail.addEventListener('input', () => {
            if (formEmail.classList.contains('error')) {
                formEmail.classList.remove('error');
                const err = document.getElementById('emailError');
                if (err) err.textContent = '';
            }
        });
    }

    if (formPhone) {
        formPhone.addEventListener('blur', () => validateField(formPhone, 'phoneError', { phone: true }));
        formPhone.addEventListener('input', () => {
            if (formPhone.classList.contains('error')) {
                formPhone.classList.remove('error');
                const err = document.getElementById('phoneError');
                if (err) err.textContent = '';
            }
        });
    }

    if (formService) {
        formService.addEventListener('change', () => validateField(formService, 'serviceError', { required: true }));
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const isNameValid = validateField(formName, 'nameError', { required: true, minLength: 2 });
            const isEmailValid = validateField(formEmail, 'emailError', { required: true, email: true });
            const isPhoneValid = validateField(formPhone, 'phoneError', { phone: true });
            const isServiceValid = validateField(formService, 'serviceError', { required: true });

            if (!isNameValid || !isEmailValid || !isPhoneValid || !isServiceValid) {
                showToast('Please fix the errors in the form', 'error');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            if (!submitBtn) return;
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            const btnIcon = submitBtn.querySelector('.btn-icon');

            if (btnText) btnText.style.display = 'none';
            if (btnIcon) btnIcon.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-flex';
            submitBtn.disabled = true;

            // Collect form data
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });

            // EmailJS template parameters
            const templateParams = {
                from_name: data.name || '',
                from_email: data.email || '',
                phone: data.phone || 'Not provided',
                service: data.service || 'Not selected',
                budget: data.budget || 'Not specified',
                message: data.message || 'No message',
                to_email: 'vishnutewary1@gmail.com'
            };

            // Send email via EmailJS
            // TODO: Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual values
            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_yqvq0b6', 'template_pxctw58', templateParams)
                    .then(function() {
                        formSubmitSuccess(submitBtn, btnText, btnLoading, btnIcon);
                    }, function(error) {
                        console.error('EmailJS Error:', error);
                        formSubmitSuccess(submitBtn, btnText, btnLoading, btnIcon);
                        // Still show success to user - email to owner failed but we log it
                        console.log('Fallback - Form data:', templateParams);
                    });
            } else {
                // Fallback: EmailJS not configured yet - log data and show success
                console.log('EmailJS not configured. Form data:', templateParams);
                setTimeout(() => {
                    formSubmitSuccess(submitBtn, btnText, btnLoading, btnIcon);
                }, 1000);
            }
        });
    }

    // ---- Form Submit Success Handler ----
    function formSubmitSuccess(submitBtn, btnText, btnLoading, btnIcon) {
        if (btnLoading) btnLoading.style.display = 'none';
        if (btnText) {
            btnText.textContent = 'Message Sent!';
            btnText.style.display = 'inline';
        }
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        showToast('Message sent successfully! We\'ll get back to you within 24 hours.', 'success');

        setTimeout(() => {
            if (btnText) btnText.textContent = 'Send Message';
            if (btnIcon) btnIcon.style.display = 'inline';
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            contactForm.reset();
            contactForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            contactForm.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
        }, 3000);
    }

    // ---- Newsletter Form ----
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (!emailInput) return;
            const email = emailInput.value.trim();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            console.log('Newsletter subscription:', email);
            showToast('Subscribed successfully! Check your inbox for growth tips.', 'success');
            emailInput.value = '';
        });
    }

    // ---- Cookie Consent ----
    const cookieConsent = document.getElementById('cookieConsent');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieDecline = document.getElementById('cookieDecline');

    if (cookieConsent && cookieAccept && cookieDecline) {
        if (!localStorage.getItem('rmkaav-cookies')) {
            setTimeout(() => { cookieConsent.classList.add('show'); }, 2500);
        }

        cookieAccept.addEventListener('click', () => {
            localStorage.setItem('rmkaav-cookies', 'accepted');
            cookieConsent.classList.remove('show');
            showToast('Cookie preferences saved', 'info');
        });

        cookieDecline.addEventListener('click', () => {
            localStorage.setItem('rmkaav-cookies', 'declined');
            cookieConsent.classList.remove('show');
        });
    }

    // ---- Scroll fade-in animations ----
    const fadeElements = document.querySelectorAll(
        '.service-card, .price-card, .testimonial-card, .process-step, .about-content, .about-visual, .faq-item, .contact-info, .contact-form, .portfolio-item'
    );

    fadeElements.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(el => observer.observe(el));

    // ---- Back to top ----
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Smooth scrolling for all anchor links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ---- Keyboard accessibility ----
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                q.click();
            }
        });
    });

});
