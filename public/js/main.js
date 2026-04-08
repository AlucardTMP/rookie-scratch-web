import { initAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en admin, inicializar admin
    if (document.getElementById('admin-container')) {
        initAdmin();
    }

    // Si estamos en la tienda, inicializar productos
    if (document.getElementById('productos-container')) {
        renderTienda();
    }
});

async function renderTienda() {
    const container = document.getElementById('productos-container');
    const res = await fetch('/api/products');
    const products = await res.json();

    if (products.length === 0) {
        container.innerHTML = "<p>No hay productos disponibles por ahora.</p>";
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-image">
                <img src="${p.images[0]}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="price">$${p.price}</p>
                <p class="description">${p.description}</p>
                <button class="cta-primary">Añadir al Carrito</button>
            </div>
        </div>
    `).join('');
}