// ============================================================
// PRODUTOS E VITRINE
// ============================================================

// Buscar quantidade reservada de um produto
async function getReservedQuantity(productId) {
    try {
        const { data, error } = await db.rpc('get_reserved_quantity', { 
            product_id: productId 
        });
        if (error) {
            console.error('Erro ao buscar reserva:', error);
            return 0;
        }
        return data || 0;
    } catch (err) {
        console.error('Erro:', err);
        return 0;
    }
}

// Carregar produtos
async function loadProducts() {
    let query = db.from('products').select('*').order('created_at');
    
    const profile = window.currentProfile();
    if (!profile?.is_admin) {
        query = query.eq('available', true);
    }

    const { data, error } = await query;
    const grid = $('#products-grid');

    if (error) {
        grid.innerHTML = '<p style="color:var(--text-light);padding:20px 0;grid-column:1/-1">Erro ao carregar produtos.</p>';
        console.error('loadProducts error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-light);padding:20px 0;grid-column:1/-1">Nenhum produto cadastrado ainda.</p>';
        return;
    }

    // Buscar quantidades reservadas para cada produto
    const productsWithReservation = await Promise.all(data.map(async (p) => {
        const reserved = await getReservedQuantity(p.id);
        const available = Math.max(0, (p.stock || 0) - reserved);
        return { ...p, reserved_quantity: reserved, available_quantity: available };
    }));

    grid.innerHTML = productsWithReservation.map(p => {
        const hasStock = p.available_quantity > 0 && p.available;
        const reservedText = p.reserved_quantity > 0 ? `🔒 ${p.reserved_quantity} reservado` : '';
        const availableText = `${p.available_quantity} disponível${p.reserved_quantity > 0 ? ` · ${p.stock} total` : ''}`;
        
        return `
            <div class="product-card ${!hasStock ? 'product-unavailable' : ''}" data-id="${p.id}">
                <div class="product-img">
                    ${p.image_url 
                        ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" />` 
                        : `<span>${p.emoji || '🍫'}</span>`}
                    ${p.reserved_quantity > 0 ? `<div class="reserved-badge">🔒 ${p.reserved_quantity} reservado</div>` : ''}
                    ${p.available_quantity <= 0 ? '<div class="stock-badge out-of-stock">Esgotado</div>' : 
                      (p.available_quantity < 5 ? `<div class="stock-badge low-stock">Últimos ${p.available_quantity}</div>` : '')}
                </div>
                <div class="product-info">
                    <div class="product-name">${escapeHtml(p.name)}</div>
                    ${p.description ? `<div class="product-desc">${escapeHtml(p.description)}</div>` : ''}
                    <div class="product-footer">
                        <div>
                            <span class="product-price">R$ ${formatPrice(p.price)}</span>
                            <div class="stock-info">📦 ${availableText}</div>
                            ${reservedText ? `<div class="reserved-info">${reservedText}</div>` : ''}
                        </div>
                        ${p.available && p.available_quantity > 0
                            ? `<button class="btn-add-cart" onclick="addToCart('${p.id}','${escapeHtml(p.name)}',${p.price},'${p.emoji || '🍫'}', ${p.available_quantity})">+ Carrinho</button>`
                            : `<span class="badge-unavailable">${p.available_quantity <= 0 ? 'Esgotado' : 'Indisponível'}</span>`}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function bindProductsEvents() {
    // Eventos relacionados a produtos podem ser adicionados aqui
    // Por enquanto não há necessidade
}

// Exportar para uso global
window.loadProducts = loadProducts;
window.getReservedQuantity = getReservedQuantity;
window.bindProductsEvents = bindProductsEvents;