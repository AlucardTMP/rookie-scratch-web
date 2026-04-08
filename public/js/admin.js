export async function initAdmin() {
    const addForm = document.getElementById('admin-add-product');
    const galleryForm = document.getElementById('admin-gallery-form');
    const galleryFilter = document.getElementById('admin-gallery-filter');

    // Cargar productos al iniciar
    renderAdminProducts();

    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('admin-save');
            btn.disabled = true;

            const name = document.getElementById('prod-name').value;
            const price = document.getElementById('prod-price').value;
            const desc = document.getElementById('prod-desc').value;
            const imageFiles = document.getElementById('prod-images').files;

            let images = [];
            if (imageFiles.length > 0) {
                const formData = new FormData();
                for (const f of imageFiles) formData.append('images', f);
                const resUpload = await fetch('/api/uploads', { method: 'POST', body: formData });
                const dataUpload = await resUpload.json();
                images = dataUpload.filePaths;
            }

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, price, description: desc, images })
            });

            if (res.ok) {
                alert('Producto creado');
                addForm.reset();
                renderAdminProducts();
            }
            btn.disabled = false;
        });
    }

    if (galleryForm) {
        galleryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const category = document.getElementById('gallery-category').value;
            const imageFile = document.getElementById('gallery-url').files[0];
            const alt = document.getElementById('gallery-alt').value;

            const formData = new FormData();
            formData.append('images', imageFile);
            const resUp = await fetch('/api/uploads', { method: 'POST', body: formData });
            const dataUp = await resUp.json();

            await fetch(`/api/galleries/${category}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: dataUp.filePaths[0], alt })
            });

            alert('Imagen añadida');
            renderGalleryList(category);
        });
    }

    if (galleryFilter) {
        galleryFilter.addEventListener('change', () => renderGalleryList(galleryFilter.value));
    }
}

async function renderAdminProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    const res = await fetch('/api/products');
    const products = await res.json();
    list.innerHTML = products.map(p => `
        <div style="display:flex; align-items:center; gap:10px; background:#222; padding:10px; margin-bottom:5px; border-radius:5px;">
            <img src="${p.images[0]}" style="width:50px; height:50px; object-fit:cover;">
            <div style="flex:1"><strong>${p.name}</strong> - $${p.price}</div>
            <button onclick="deleteProduct('${p.id}')" style="background:red; color:white; border:none; padding:5px; cursor:pointer;">Borrar</button>
        </div>
    `).join('');
}

// FUNCIONES GLOBALES PARA ONCLICK
window.deleteProduct = async (id) => {
    if (!confirm('¿Borrar producto?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) renderAdminProducts();
};

window.deleteGalleryItem = async (cat, id) => {
    if (!confirm('¿Borrar imagen?')) return;
    const res = await fetch(`/api/galleries/${cat}/${id}`, { method: 'DELETE' });
    if (res.ok) renderGalleryList(cat);
};

async function renderGalleryList(category) {
    const list = document.getElementById('admin-gallery-list');
    if (!list || category === 'all') return;
    const res = await fetch(`/api/galleries/${category}`);
    const items = await res.json();
    list.innerHTML = items.map(item => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
            <img src="${item.url}" style="width:40px;">
            <button onclick="deleteGalleryItem('${category}', '${item.id}')">✖</button>
        </div>
    `).join('');
}