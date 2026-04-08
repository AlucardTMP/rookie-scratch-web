// Admin panel logic - Versión Segura 2026

export async function initAdmin() {
    try {
        const adminContainer = document.getElementById('admin-container');
        if (!adminContainer) return;

        const addForm = document.getElementById('admin-add-product');
        const galleryForm = document.getElementById('admin-gallery-form');
        const galleryFilter = document.getElementById('admin-gallery-filter');

        // --- 1. MANEJO DE PRODUCTOS (Tienda: Ropa, Pines, etc.) ---
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btnSave = document.getElementById('admin-save');
                btnSave.disabled = true;
                btnSave.textContent = 'Guardando...';

                const idField = document.getElementById('prod-id');
                const name = document.getElementById('prod-name').value;
                const price = document.getElementById('prod-price').value;
                const desc = document.getElementById('prod-desc').value;
                const imageFiles = document.getElementById('prod-images').files;

                const editingId = idField ? idField.value : null;
                let productData = { name, price, description: desc, images: [] };

                try {
                    // Subir imágenes del producto
                    if (imageFiles.length > 0) {
                        const formData = new FormData();
                        for (const file of imageFiles) {
                            formData.append('images', file);
                        }
                        const uploadRes = await fetch('/api/uploads', { method: 'POST', body: formData });
                        if (!uploadRes.ok) throw new Error('Error al subir imágenes');
                        const uploadResult = await uploadRes.json();
                        productData.images = uploadResult.filePaths;
                    }

                    const method = editingId ? 'PUT' : 'POST';
                    const url = editingId ? `/api/products/${editingId}` : '/api/products';

                    const res = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData)
                    });

                    if (res.ok) {
                        alert(editingId ? 'Producto actualizado' : 'Producto creado');
                        addForm.reset();
                        document.getElementById('image-preview-container').innerHTML = '';
                        renderAdminProducts();
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error en productos: ' + err.message);
                } finally {
                    btnSave.disabled = false;
                    btnSave.textContent = 'Guardar Producto';
                }
            });
        }

        // --- 2. GESTIÓN DE GALERÍAS (Tatuajes e Ilustraciones) ---
        if (galleryForm) {
            galleryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btnSave = document.getElementById('gallery-save');
                btnSave.disabled = true;
                btnSave.textContent = 'Subiendo...';

                const category = document.getElementById('gallery-category').value;
                const altText = document.getElementById('gallery-alt').value;
                const imageFile = document.getElementById('gallery-url').files[0];

                if (!imageFile) {
                    alert("Selecciona una imagen primero");
                    btnSave.disabled = false;
                    btnSave.textContent = 'Guardar Imagen';
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append('images', imageFile);

                    const uploadRes = await fetch('/api/uploads', { method: 'POST', body: formData });
                    const uploadData = await uploadRes.json();

                    const galleryRes = await fetch(`/api/galleries/${category}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: uploadData.filePaths[0],
                            alt: altText || category
                        })
                    });

                    if (galleryRes.ok) {
                        alert(`¡Imagen añadida a ${category}!`);
                        galleryForm.reset();
                        renderGalleryList(category);
                    }
                } catch (err) {
                    console.error(err);
                    alert("Error al subir a la galería");
                } finally {
                    btnSave.disabled = false;
                    btnSave.textContent = 'Guardar Imagen';
                }
            });
        }

        if (galleryFilter) {
            galleryFilter.addEventListener('change', () => {
                renderGalleryList(galleryFilter.value);
            });
        }

        // Cargar datos iniciales al entrar
        renderAdminProducts();

    } catch (err) {
        console.error('initAdmin failed', err);
    }
}

// --- FUNCIONES AUXILIARES (Fuera de initAdmin) ---

async function loadCatalog() {
    const response = await fetch('/api/products');
    return response.ok ? await response.json() : [];
}

async function renderAdminProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    const catalog = await loadCatalog();
    list.innerHTML = '';
    catalog.forEach(p => {
        const row = document.createElement('div');
        row.className = 'admin-product-row';
        const imageUrl = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/64';
        row.innerHTML = `
            <div style="display:flex;align-items:center;gap:0.8rem;width:100%;background:#222;padding:10px;border-radius:8px;margin-bottom:10px;">
                <img src="${imageUrl}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;">
                <div style="flex:1;">
                    <strong>${p.name}</strong>
                    <div style="color:#bbb;font-size:0.9rem">${p.price}</div>
                </div>
                <button onclick="deleteProduct('${p.id}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Eliminar</button>
            </div>
        `;
        list.appendChild(row);
    });
}

window.deleteProduct = async function(id) {
    if (!confirm('¿Seguro?')) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) renderAdminProducts();
};

async function renderGalleryList(category) {
    const list = document.getElementById('admin-gallery-list');
    if (!list || category === 'all') return;
    const res = await fetch(`/api/galleries/${category}`);
    const items = await res.json();
    list.innerHTML = `<h4>Mostrando: ${category}</h4>`;
    items.forEach(item => {
        const div = document.createElement('div');
        div.style = "display:flex; align-items:center; gap:10px; margin-bottom:10px; background:#222; padding:5px; border-radius:5px;";
        div.innerHTML = `
            <img src="${item.url}" style="width:50px; height:50px; object-fit:cover;">
            <span style="flex:1; font-size:0.8rem;">${item.alt}</span>
            <button onclick="deleteGalleryItem('${category}', '${item.id}')" style="color:red; background:none; border:none; cursor:pointer;">✖</button>
        `;
        list.appendChild(div);
    });
}

window.deleteGalleryItem = async function(category, id) {
    if (!confirm('¿Eliminar esta imagen de la galería?')) return;
    const res = await fetch(`/api/galleries/${category}/${id}`, { method: 'DELETE' });
    if (res.ok) renderGalleryList(category);
};