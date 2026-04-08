import {
    initNavigation,
    initStickyNav,
    initScrollReveal,
    initIsotope,
    initModal,
    initSwiper,
    initFaq,
    initBackToTop,
    initTiltEffect,
    initGalleryToggle,
} from '/js/ui.js';

import {
    initShoppingCart,
    initCheckoutPage,
} from '/js/cart.js';

import {
    initAdmin,
} from '/js/admin.js';

const App = {
    init() {
        // Event Listeners
        window.addEventListener('load', this.handleLoad);
        document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        // If the script is loaded after DOMContentLoaded fired (script placed at end of body),
        // call the DOMContentLoaded handler immediately so initializers still run.
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            try {
                this.handleDOMContentLoaded();
            } catch (e) {
                // fallback: call via App reference to preserve original behavior
                try { App.handleDOMContentLoaded(); } catch (err) { console.error('Immediate DOMContentLoaded handler failed', err); }
            }
        }
    },

    // --- HANDLERS --- //
    handleLoad() {
        const loader = document.querySelector('#loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }
    },

    handleDOMContentLoaded() {
        App.initComponents();
        initShoppingCart();
    },

    // --- INITIALIZERS ---
    initComponents() {
        // Ensure loader is hidden eventually (fallback) and attach image error listeners
        // before running other initializers so a single failing init doesn't block the UI.
        try {
            this.ensureLoaderHidden();
        } catch (e) {
            console.error('ensureLoaderHidden failed', e);
        }

        // Run initializers individually and tolerate failures so the page remains usable
        const initializers = [
            initNavigation,
            initScrollReveal,
            initIsotope,
            initGalleryToggle,
            initModal,
            initSwiper,
            initFaq,
            initBackToTop,
            this.initContactForm,
            initCheckoutPage,
            this.initStoreRenderer,
            initAdmin,
            this.initGalleryManager,
            initStickyNav,
            initTiltEffect,
            this.renderGalleryOnPage
        ];

        initializers.forEach(initializer => {
            try {
                if (typeof initializer === 'function') initializer();
            } catch (err) {
                console.error(`Initializer ${initializer.name} failed:`, err);
            }
        });
    },

    ensureLoaderHidden() {
        const loader = document.querySelector('#loader');
        if (!loader) return;

        // Fallback: hide loader after 3 seconds in case window.load doesn't fire
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }, 3000);

        // Attach image load/error listeners to help debug missing images
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', () => {
                try {
                    console.error('Image failed to load:', img.src);
                    img.style.outline = '3px solid #ff4d4d';
                    img.title = 'Error al cargar imagen';
                    // show alt text visibly if image fails
                    img.style.display = 'block';
                } catch (e) {
                    // ignore
                }
            });
            img.addEventListener('load', () => {
                console.log('Image loaded:', img.src);
            });
        });

        // After a short delay, log metrics for every image so we can see sizes and computed styles
        setTimeout(() => {
            document.querySelectorAll('img').forEach(img => {
                try {
                    const rect = img.getBoundingClientRect();
                    const cs = window.getComputedStyle(img);
                    console.log('IMG METRICS', img.src, { width: rect.width, height: rect.height, display: cs.display, visibility: cs.visibility, opacity: cs.opacity });
                } catch (e) {
                    // ignore
                }
            });
        }, 500);
    },

    initContactForm() {
        const contactForm = document.querySelector('#contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                let isValid = true;

                const nameInput = document.querySelector('#name');
                const emailInput = document.querySelector('#email');
                const messageInput = document.querySelector('#message');

                if (nameInput.value.trim() === '') {
                    this.showError(nameInput, 'El nombre es obligatorio.');
                    isValid = false;
                } else {
                    this.hideError(nameInput);
                }

                if (emailInput.value.trim() === '') {
                    this.showError(emailInput, 'El email es obligatorio.');
                    isValid = false;
                } else if (!this.isValidEmail(emailInput.value)) {
                    this.showError(emailInput, 'El email no es válido.');
                    isValid = false;
                } else {
                    this.hideError(emailInput);
                }

                if (messageInput.value.trim() === '') {
                    this.showError(messageInput, 'El mensaje es obligatorio.');
                    isValid = false;
                } else {
                    this.hideError(messageInput);
                }

                if (isValid) {
                    const formData = new FormData(contactForm);
                    const submitButton = contactForm.querySelector('button[type="submit"]');
                    const successMessage = document.createElement('p');
                    successMessage.style.color = 'var(--primary-color)';

                    fetch(contactForm.action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).then(response => {
                        if (response.ok) {
                            successMessage.textContent = '¡Gracias por tu mensaje! Te contactaré pronto.';
                            contactForm.reset();
                        } else {
                            response.json().then(data => {
                                if (Object.hasOwn(data, 'errors')) {
                                    successMessage.textContent = data["errors"].map(error => error["message"]).join(", ")
                                } else {
                                    successMessage.textContent = 'Oops! Hubo un problema al enviar tu mensaje.'
                                }
                            })
                        }
                    }).catch(error => {
                        successMessage.textContent = 'Oops! Hubo un problema al enviar tu mensaje.'
                    }).finally(() => {
                        contactForm.appendChild(successMessage);
                        setTimeout(() => {
                            successMessage.remove();
                        }, 5000);
                    });
                }
            });
        }
    },

    async initStoreRenderer() {
        try {
            const container = document.querySelector('#products-list');
            if (!container) return;

            const render = async () => {
                const list = await this.loadCatalog();
                container.innerHTML = '';
                if (!list || list.length === 0) {
                    container.innerHTML = '<p>No hay productos disponibles.</p>';
                    return;
                }
                list.forEach(p => {
                    const item = document.createElement('div');
                    item.className = 'product-item';

                    // Handle both new `images` array and old `image` string
                    let imageUrl = 'https://via.placeholder.com/300'; // Default placeholder
                    if (p.images && p.images.length > 0) {
                        imageUrl = p.images[0];
                    } else if (p.image) {
                        imageUrl = p.image;
                    }

                    const productPage = p.page || '#'; // Fallback for older products without a page

                    // Make sure the price format is consistent
                    const displayPrice = p.price.startsWith('$') ? p.price : `$${p.price}`;

                    item.innerHTML = `
                        <a href="${productPage}" class="product-link">
                            <img src="${imageUrl}" alt="${p.name}">
                            <h4>${p.name}</h4>
                        </a>
                        <p class="product-description">${p.description || ''}</p>
                        <p class="product-price">${displayPrice}</p>
                        <a href="#" data-add-to-cart data-product-name="${p.name}" data-product-price="${displayPrice}" data-product-image="${imageUrl}" class="add-to-cart cta-primary">Añadir al Carrito</a>
                    `;
                    container.appendChild(item);
                });

                // Re-bind shopping cart listeners for newly created buttons
                initShoppingCart();
            };

            await render();
        } catch (err) {
            console.error('initStoreRenderer failed', err);
        }
    },

    async initGalleryManager() {
        try {
            // This function should only attach event listeners ONCE.
            // The rendering logic is now in renderAdminGalleries.
            const galleryForm = document.getElementById('admin-gallery-form');
            if (!galleryForm) return; // Not on the right page or element not found

            this.renderAdminGalleries(); // Initial render

            // Attach listeners only if they haven't been attached before.
            if (galleryForm.dataset.initialized) return;
            galleryForm.dataset.initialized = 'true';

            const gallerySave = document.getElementById('gallery-save');
            const galleryCancel = document.getElementById('gallery-cancel');
            const galleryFilter = document.getElementById('admin-gallery-filter');
            const galleryUrlInput = document.getElementById('gallery-url');
            const previewHolder = document.getElementById('gallery-preview-holder');

            galleryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const idField = document.getElementById('gallery-id');
                const cat = document.getElementById('gallery-category').value;
                const imageFile = document.getElementById('gallery-url').files[0];
                const alt = document.getElementById('gallery-alt').value.trim();
                const tags = document.getElementById('gallery-tags').value.trim();
                
                const editingId = idField && idField.value ? idField.value : null;

                if (editingId) {
                    const imageData = { alt, tags };
                    await fetch(`/api/galleries/${cat}/${editingId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(imageData)
                    });
                } else {
                    let imageUrl = '';
                    if (imageFile) {
                        const formData = new FormData();
                        formData.append('images', imageFile);
                        const response = await fetch('/api/uploads', { method: 'POST', body: formData });
                        const uploadResult = await response.json();
                        imageUrl = uploadResult.filePaths[0];
                    }

                    if (!imageUrl) return;

                    const imageData = { url: imageUrl, alt, tags };
                    await fetch(`/api/galleries/${cat}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(imageData)
                    });
                }
                
                galleryForm.reset(); 
                if (idField) idField.value = '';
                if (gallerySave) gallerySave.textContent = 'Agregar Imagen';
                if (galleryCancel) galleryCancel.style.display = 'none';
                document.getElementById('gallery-url').style.display = 'block';
                this.showAdminToast(editingId ? 'Cambios guardados' : 'Imagen agregada');
                this.renderAdminGalleries(galleryFilter.value);
            });

            if (galleryCancel) {
                galleryCancel.addEventListener('click', (e) => {
                    e.preventDefault();
                    galleryForm.reset();
                    const idField = document.getElementById('gallery-id'); if (idField) idField.value = '';
                    if (gallerySave) gallerySave.textContent = 'Agregar Imagen';
                    galleryCancel.style.display = 'none';
                    document.getElementById('gallery-url').style.display = 'block';
                });
            }

            if (galleryFilter) {
                galleryFilter.addEventListener('change', () => {
                    this.renderAdminGalleries(galleryFilter.value);
                });
            }

            if (galleryUrlInput && previewHolder) {
                const img = document.createElement('img');
                img.style.width = '48px'; img.style.height = '48px'; img.style.objectFit = 'cover'; img.style.borderRadius = '6px'; img.style.display = 'none';
                previewHolder.appendChild(img);
                let timeout;
                galleryUrlInput.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        const v = galleryUrlInput.value.trim();
                        if (!v) { img.style.display = 'none'; return; }
                        img.src = v;
                        img.onerror = () => { img.style.display = 'none'; };
                        img.onload = () => { img.style.display = 'inline-block'; };
                    }, 300);
                });
            }
        } catch (err) {
            console.error('initGalleryManager failed', err);
        }
    },

    async renderGalleryOnPage() {
        try {
            const tatuajesSection = document.getElementById('tatuajes');
            const ilustracionSection = document.getElementById('ilustracion');

            const render = async (container, category) => {
                if (container) {
                    const imgs = await this.loadGallery(category);
                    imgs.forEach(img => {
                        const tags = img.tags ? img.tags.split(',').map(t => t.trim()).join(' ') : '';
                        const div = document.createElement('div');
                        div.className = `grid-item ${tags}`;
                        div.innerHTML = `<img src="${img.url}" alt="${img.alt || ''}" class="portfolio-item" loading="lazy">`;
                        container.appendChild(div);
                    });
                }
            };

            if (tatuajesSection) {
                const container = tatuajesSection.querySelector('.tattoos-grid');
                await render(container, 'tatuajes');
            }
            if (ilustracionSection) {
                const container = ilustracionSection.querySelector('.tattoos-grid');
                await render(container, 'ilustracion');
            }

            // Re-initialize filters and modals after dynamic content is loaded
            initIsotope();
            initModal();

        } catch (err) {
            console.error('renderGalleryOnPage failed', err);
        }
    },

    showError(input, message) {
        const formGroup = input.parentElement;
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.innerText = message;
            errorMessage.style.display = 'block';
        }
    },

    hideError(input) {
        const formGroup = input.parentElement;
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    },

    isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },
};

App.init();
