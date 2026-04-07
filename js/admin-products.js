// ============================================================
// ADMIN - PRODUTOS
// ============================================================

let editingProductId = null;

// Carregar produtos para o admin
async function loadAdminProducts() {
    const { data, error } = await db.from('products').select('*').order('created_at');
    const list = $('#admin-products-list');

    if (error) {
        if (list) list.innerHTML = '<p style="color:var(--text-light)">Erro ao carregar produtos.</p>';
        console.error('loadAdminProducts error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        if (list) list.innerHTML = '<p style="color:var(--text-light)">Nenhum produto ainda.</p>';
        return;
    }

    // Buscar reservas para cada produto
    const productsWithReservations = await Promise.all(data.map(async (p) => {
        const reserved = await window.getReservedQuantity(p.id);
        return { ...p, reserved_quantity: reserved };
    }));

    if (list) {
        list.innerHTML = productsWithReservations.map(p => `
            <div class="admin-product-card">
                <div class="admin-product-emoji">${p.emoji || '🍫'}</div>
                <div class="admin-product-info">
                    <div class="admin-product-name">${escapeHtml(p.name)}</div>
                    <div class="admin-product-price">R$ ${formatPrice(p.price)}</div>
                    <div class="admin-product-stock">📦 Estoque: ${p.stock || 0} unidade${p.stock !== 1 ? 's' : ''}</div>
                    ${p.reserved_quantity > 0 ? `<div class="admin-product-reserved">🔒 Reservado: ${p.reserved_quantity} unidade${p.reserved_quantity !== 1 ? 's' : ''}</div>` : ''}
                    ${!p.available ? '<div class="admin-product-badge">❌ Indisponível</div>' : ''}
                </div>
                <div class="admin-product-actions">
                    <button class="btn-edit" onclick="openEditProductModal('${p.id}')">✏️</button>
                    <button class="btn-delete" onclick="deleteProduct('${p.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

// Abrir modal para novo produto
function openNewProductModal() {
    editingProductId = null;
    const titleEl = $('#modal-product-title');
    const nameEl = $('#prod-name');
    const descEl = $('#prod-desc');
    const priceEl = $('#prod-price');
    const emojiEl = $('#prod-emoji');
    const imageEl = $('#prod-image');
    const stockEl = $('#prod-stock');
    const availableEl = $('#prod-available');
    
    if (titleEl) titleEl.textContent = 'Novo Produto';
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    if (priceEl) priceEl.value = '';
    if (emojiEl) emojiEl.value = '🍫';
    if (imageEl) imageEl.value = '';
    if (stockEl) stockEl.value = '0';
    if (availableEl) availableEl.checked = true;
    
    const modal = $('#modal-product');
    if (modal) modal.classList.remove('hidden');
}

// Abrir modal para editar produto
async function openEditProductModal(id) {
    editingProductId = id;
    const { data, error } = await db.from('products').select('*').eq('id', id).single();
    
    if (error || !data) { 
        showToast('Erro ao carregar produto ❌'); 
        return; 
    }
    
    const titleEl = $('#modal-product-title');
    const nameEl = $('#prod-name');
    const descEl = $('#prod-desc');
    const priceEl = $('#prod-price');
    const emojiEl = $('#prod-emoji');
    const imageEl = $('#prod-image');
    const stockEl = $('#prod-stock');
    const availableEl = $('#prod-available');
    
    if (titleEl) titleEl.textContent = 'Editar Produto';
    if (nameEl) nameEl.value = data.name;
    if (descEl) descEl.value = data.description || '';
    if (priceEl) priceEl.value = data.price;
    if (emojiEl) emojiEl.value = data.emoji || '🍫';
    if (imageEl) imageEl.value = data.image_url || '';
    if (stockEl) stockEl.value = data.stock || 0;
    if (availableEl) availableEl.checked = data.available;
    
    const modal = $('#modal-product');
    if (modal) modal.classList.remove('hidden');
}

// Fechar modal de produto
function closeProductModal() {
    const modal = $('#modal-product');
    if (modal) modal.classList.add('hidden');
    editingProductId = null;
}

// Salvar produto
async function saveProduct() {
    const nameEl = $('#prod-name');
    const descEl = $('#prod-desc');
    const priceEl = $('#prod-price');
    const emojiEl = $('#prod-emoji');
    const imageEl = $('#prod-image');
    const stockEl = $('#prod-stock');
    const availableEl = $('#prod-available');
    
    const payload = {
        name: nameEl ? nameEl.value.trim() : '',
        description: (descEl ? descEl.value.trim() : null) || null,
        price: parseFloat(priceEl ? priceEl.value : 0) || 0,
        emoji: (emojiEl ? emojiEl.value.trim() : '🍫') || '🍫',
        image_url: (imageEl ? imageEl.value.trim() : null) || null,
        stock: parseInt(stockEl ? stockEl.value : 0) || 0,
        available: availableEl ? availableEl.checked : true
    };
    
    if (!payload.name) { 
        showToast('Informe o nome do produto'); 
        return; 
    }
    if (payload.price < 0) { 
        showToast('Preço não pode ser negativo'); 
        return; 
    }
    if (payload.stock < 0) { 
        showToast('Estoque não pode ser negativo'); 
        return; 
    }

    const btnSave = $('#btn-save-product');
    setLoading(btnSave, true);
    
    let error;
    if (editingProductId) {
        ({ error } = await db.from('products').update(payload).eq('id', editingProductId));
    } else {
        ({ error } = await db.from('products').insert(payload));
    }
    
    setLoading(btnSave, false);

    if (error) { 
        showToast('Erro ao salvar ❌'); 
        console.error('saveProduct error:', error.message);
    } else {
        showToast('Produto salvo! ✅');
        closeProductModal();
        await loadAdminProducts();
        if (window.loadProducts) await window.loadProducts();
    }
}

// Deletar produto
async function deleteProduct(id) {
    if (!confirm('Remover este produto?')) return;
    
    const { error } = await db.from('products').delete().eq('id', id);
    
    if (error) { 
        showToast('Erro ao remover ❌'); 
        console.error('deleteProduct error:', error.message);
    } else { 
        showToast('Produto removido'); 
        await loadAdminProducts(); 
        if (window.loadProducts) await window.loadProducts();
    }
}

// Bind eventos do admin de produtos
function bindAdminProductsEvents() {
    const btnNewProduct = $('#btn-new-product');
    const btnSaveProduct = $('#btn-save-product');
    const btnCloseModal = $('#btn-close-modal');
    const btnCancelModal = $('#btn-cancel-modal');
    
    if (btnNewProduct) btnNewProduct.addEventListener('click', openNewProductModal);
    if (btnSaveProduct) btnSaveProduct.addEventListener('click', saveProduct);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeProductModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeProductModal);
}

// Exportar para uso global
window.loadAdminProducts = loadAdminProducts;
window.openEditProductModal = openEditProductModal;
window.deleteProduct = deleteProduct;
window.bindAdminProductsEvents = bindAdminProductsEvents;