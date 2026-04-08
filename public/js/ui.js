// UI components and interactions

export function initNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
        });
    }

    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (document.body.classList.contains('nav-open')) {
                document.body.classList.remove('nav-open');
            }
        });
    });
}

export function initStickyNav() {
    let lastScrollTop = 0;
    const stickyNav = document.querySelector('.sticky-nav');
    window.addEventListener('scroll', function(){
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > stickyNav.offsetHeight){
            stickyNav.style.top = "-100px";
        } else {
            stickyNav.style.top = "0";
        }
        lastScrollTop = scrollTop;
    });
}

export function initScrollReveal() {
    if (typeof ScrollReveal !== 'undefined') {
        const sr = ScrollReveal({
            distance: '50px',
            duration: 1500,
            easing: 'cubic-bezier(0.5, 0, 0, 1)',
            reset: false
        });
        sr.reveal('[data-scrollreveal]', { interval: 150 });
    }
}

export function initIsotope() {
    // Lightweight native filtering (replaces Isotope) to avoid layout conflicts
    const grid = document.querySelector('.tattoos-grid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.grid-item'));
    const filterContainer = document.querySelector('.filters');

    const applyFilter = (filterValue) => {
        const cls = filterValue === '*' ? null : filterValue.replace(/^\./, '');
        items.forEach(item => {
            if (!cls) {
                item.style.display = '';
            } else {
                if (item.classList.contains(cls)) item.style.display = '';
                else item.style.display = 'none';
            }
        });
    };

    if (filterContainer) {
        filterContainer.addEventListener('click', function (event) {
            if (!event.target.matches('.filter-btn')) return;
            const filterValue = event.target.getAttribute('data-filter') || '*';
            applyFilter(filterValue);

            // Update active button state
            const filterButtons = filterContainer.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        });

        // Initialize: show all or the active filter
        const active = filterContainer.querySelector('.filter-btn.active');
        if (active) applyFilter(active.getAttribute('data-filter') || '*');
        else applyFilter('*');
    }
}

export function initModal() {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById("modal-image");
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const closeModal = document.querySelector(".close-modal");

    if (modal && modalImg && portfolioItems.length > 0 && closeModal) {
        portfolioItems.forEach(item => {
            item.addEventListener('click', () => {
                modal.style.display = "block";
                modalImg.src = item.src;
            });
        });

        closeModal.addEventListener('click', () => {
            modal.style.display = "none";
        });

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    }
}

export function initSwiper() {
    if (typeof Swiper !== 'undefined') {
        const swiper = new Swiper('.swiper-container', {
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
        });
    }
}

export function initFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    faqItems.forEach(i => i.classList.remove('active'));
                    if (!isActive) {
                        item.classList.toggle('active');
                    }
                });
            }
        });
    }
}

export function initBackToTop() {
    const backToTopButton = document.querySelector('#back-to-top');
    if (backToTopButton) {
        const scrollHandler = debounce(() => {
            if (window.pageYOffset > 300) {
                backToTopButton.style.display = 'block';
            } else {
                backToTopButton.style.display = 'none';
            }
        }, 200);
        window.addEventListener('scroll', scrollHandler);

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

export function initTiltEffect() {
    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".grid-item"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.5,
        });
    }
}

export function initGalleryToggle() {
    const grid = document.querySelector('.tattoos-grid');
    const btn = document.getElementById('gallery-toggle');
    if (!grid || !btn) return;

    const updateButtonText = () => {
        if (grid.classList.contains('show-3x3')) {
            btn.textContent = 'Ver más';
        } else {
            btn.textContent = 'Ver menos';
        }
    };

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        grid.classList.toggle('show-3x3');
        updateButtonText();

        // Re-layout isotope if present so hidden/visible items are recalculated
        try {
            if (window.Isotope && grid._isotope) {
                grid._isotope.arrange();
            }
        } catch (err) {
            // ignore
        }
    });

    // Initialize button text correctly
    updateButtonText();
}

export function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
