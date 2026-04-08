// Shopping cart logic

export function initShoppingCart() {
    // Only bind to explicit add-to-cart controls to avoid intercepting generic CTAs
    const addToCartButtons = document.querySelectorAll('[data-add-to-cart]');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            let product = null;

            const target = event.currentTarget;
            // Prefer structured data attributes on the button if present
            const dataName = target.getAttribute('data-product-name');
            const dataPrice = target.getAttribute('data-product-price');
            const dataImage = target.getAttribute('data-product-image');

            if (dataName && dataPrice) {
                product = {
                    name: dataName,
                    price: dataPrice,
                    image: dataImage || (target.querySelector('img') && target.querySelector('img').src) || '',
                    quantity: 1
                };
            } else {
                // Fallback: infer from nearby product markup
                const productItem = target.closest('.product-item');
                const productDetailContainer = target.closest('.product-detail-container');

                if (productItem) {
                    const productNameEl = productItem.querySelector('h4');
                    const productPriceEl = productItem.querySelector('.product-price');
                    const productImgEl = productItem.querySelector('img');
                    if (productNameEl && productPriceEl) {
                        product = {
                            name: productNameEl.innerText,
                            price: productPriceEl.innerText,
                            image: productImgEl ? productImgEl.src : '',
                            quantity: 1
                        };
                    }
                } else if (productDetailContainer) {
                    const productNameEl = productDetailContainer.querySelector('.product-title');
                    const productPriceEl = productDetailContainer.querySelector('.product-price-detail');
                    const productImgEl = productDetailContainer.querySelector('#main-product-image');
                    if (productNameEl && productPriceEl) {
                        product = {
                            name: productNameEl.innerText,
                            price: productPriceEl.innerText,
                            image: productImgEl ? productImgEl.src : '',
                            quantity: 1
                        };
                    }
                }
            }

            if (product) {
                addToCart(product);
            }
        });
    });

    updateCartDisplay();
    renderCartItems();
}

export function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingProductIndex = cart.findIndex(item => item.name === product.name);

    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity++;
    } else {
        cart.push(product);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

export function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
        cartCounter.innerText = cart.reduce((acc, item) => acc + item.quantity, 0);
    }
}

export function renderCartItems() {
    const cartItemsContainer = document.querySelector('#cart-items-container');
    if (!cartItemsContainer) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>No hay productos en el carrito.</p>';
        return;
    }

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${item.price}</p>
                <div class="quantity-controls">
                    <button class="quantity-decrease">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-increase">+</button>
                </div>
            </div>
            <button class="remove-item">Eliminar</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    addCartItemEventListeners();
    updateCartTotal();
}

export function addCartItemEventListeners() {
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productName = event.target.closest('.cart-item').querySelector('h4').innerText;
            removeFromCart(productName);
        });
    });

    const quantityIncreaseButtons = document.querySelectorAll('.quantity-increase');
    quantityIncreaseButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productName = event.target.closest('.cart-item').querySelector('h4').innerText;
            updateQuantity(productName, 1);
        });
    });

    const quantityDecreaseButtons = document.querySelectorAll('.quantity-decrease');
    quantityDecreaseButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const productName = event.target.closest('.cart-item').querySelector('h4').innerText;
            updateQuantity(productName, -1);
        });
    });
}

export function removeFromCart(productName) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.name !== productName);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartDisplay();
}

export function updateQuantity(productName, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const productIndex = cart.findIndex(item => item.name === productName);

    if (productIndex > -1) {
        cart[productIndex].quantity += change;
        if (cart[productIndex].quantity <= 0) {
            cart.splice(productIndex, 1);
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartDisplay();
}

export function updateCartTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartTotal = document.querySelector('#cart-total');
    if (cartTotal) {
        const total = cart.reduce((acc, item) => {
            const price = parseFloat(item.price.replace('$', ''));
            return acc + (price * item.quantity);
        }, 0);
        cartTotal.innerText = `$${total.toFixed(2)}`;
    }
}

export function initCheckoutPage() {
    try {
        const orderItemsContainer = document.querySelector('#checkout-order-items');
        const subtotalEl = document.querySelector('#checkout-subtotal');
        const totalEl = document.querySelector('#checkout-total');
        const shippingEl = document.querySelector('#checkout-shipping');
        const placeOrderBtn = document.querySelector('#place-order');

        if (!orderItemsContainer || !subtotalEl || !totalEl) return;

        const render = () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            orderItemsContainer.innerHTML = '';
            if (cart.length === 0) {
                orderItemsContainer.innerHTML = '<p>No hay productos en el carrito.</p>';
            } else {
                cart.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'order-item';
                    div.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <div class="meta">
                            <h4>${item.name}</h4>
                            <p>${item.quantity} × ${item.price}</p>
                        </div>
                        <div class="item-price">${(parseFloat(item.price.replace('$','')) * item.quantity).toFixed(2)}</div>
                    `;
                    orderItemsContainer.appendChild(div);
                });
            }

            const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price.replace('$','')) * item.quantity), 0);
            const shipping = parseFloat((shippingEl && shippingEl.innerText.replace('$','')) || 0);
            subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
            totalEl.innerText = `$${(subtotal + shipping).toFixed(2)}`;
        };

        render();

        // Re-render when cart changes via storage events (other tabs) or when App updates
        window.addEventListener('storage', render);

        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const checkoutForm = document.querySelector('#checkout-form');
                if (checkoutForm) checkoutForm.requestSubmit();
            });
        }

        // Wire up checkout form submit to show a success message (simulated)
        const checkoutForm = document.querySelector('#checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e && e.preventDefault();
                // basic local validation
                const name = document.querySelector('#name');
                const email = document.querySelector('#email');
                const address = document.querySelector('#address');
                if (!name.value.trim() || !email.value.trim() || !address.value.trim()) {
                    // show simple messages
                    if (!name.value.trim()) this.showError(name, 'Completa tu nombre.');
                    if (!email.value.trim()) this.showError(email, 'Completa tu email.');
                    if (!address.value.trim()) this.showError(address, 'Completa la dirección.');
                    return;
                }

                // Simulate order placement
                const success = document.createElement('div');
                success.className = 'checkout-success';
                success.style.padding = '1rem';
                success.style.marginTop = '1rem';
                success.style.background = 'linear-gradient(90deg, rgba(0,128,0,0.08), rgba(0,128,0,0.03))';
                success.style.border = '1px solid rgba(0,128,0,0.12)';
                success.textContent = '¡Pedido recibido! Gracias — este es un pago simulado en este entorno.';
                checkoutForm.appendChild(success);

                // Clear cart
                localStorage.removeItem('cart');
                updateCartDisplay();
                render();
            });
        }
    } catch (err) {
        // tolerate failures
        console.error('initCheckoutPage failed', err);
    }
}
