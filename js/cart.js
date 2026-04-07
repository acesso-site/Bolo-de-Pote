// ============================================================
// CARRINHO DE COMPRAS
// ============================================================

let cart = [];

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem(APP_CONFIG.cartStorageKey, JSON.stringify(cart));
}

// Carregar carrinho do localStorage
function loadCart() {
    try {
        const saved = localStorage.getItem(APP_CONFIG.cartStorageKey);
        if (saved) cart = JSON.parse(saved);
    } catch (_) {
        cart = [];
    }
}

// Atualizar badge do carrinho
function updateCartBadge() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const badge = $('#cart-badge');
    if (badge) {
        badge.textContent = total;
        badge.classList.toggle('show', total > 0);
    }
}

// Adicionar ao carrinho
function addToCart(id, name, price, emoji, maxStock) {
    const currentQtyInCart = cart.find(i => i.id === id)?.qty || 0;
    
    if (currentQtyInCart >= maxStock) {
        showToast(`⚠️ Quantidade máxima disponível: ${maxStock}`);
        return;
    }
    
    const existing = cart.find(i => i.id === id);
    if (existing) {
        if (existing.qty + 1 <= maxStock) {
            existing.qty++;
        } else {
            showToast(`⚠️ Não é possível adicionar mais. Disponível: ${maxStock}`);
            return;
        }
    } else {
        cart.push({ id, name, price, emoji, qty: 1, maxStock });
    }
    saveCart();
    updateCartBadge();
    showToast('Adicionado ao carrinho 🛒');
}

// Mudar quantidade no carrinho
function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    const newQty = item.qty + delta;
    if (newQty < 1) {
        cart = cart.filter(i => i.id !== id);
    } else if (newQty <= item.maxStock) {
        item.qty = newQty;
    } else {
        showToast(`⚠️ Máximo ${item.maxStock} unidades disponíveis`);
        return;
    }
    
    saveCart();
    updateCartBadge();
    renderCart();
}

// Limpar carrinho
function clearCart() {
    cart = [];
    saveCart();
    updateCartBadge();
    renderCart();
}

// Renderizar carrinho
function renderCart() {
    const list = $('#cart-list');
    const footer = $('#cart-footer');
    const empty = $('#cart-empty');

    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        if (footer) footer.style.display = 'none';
        return;
    }
    
    if (empty) empty.classList.add('hidden');
    if (footer) footer.style.display = '';

    list.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-emoji">${item.emoji}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">R$ ${formatPrice(item.price)} cada</div>
                <div class="cart-item-stock">📦 Disponível: ${item.maxStock} unid.</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const totalEl = $('#cart-total-price');
    if (totalEl) totalEl.textContent = 'R$ ' + formatPrice(total);
}

// Construir mensagem do WhatsApp
function buildWhatsAppMsg(order, items, total, address, notes) {
    const storeName = window.storeSettings?.store_name || APP_CONFIG.storeName;
    const customerName = window.currentProfile?.name || window.currentUser?.email || 'Cliente';
    const customerPhone = window.currentProfile?.phone || '—';
    
    const lines = [
        `*Novo Pedido - ${storeName}*`,
        `Pedido #${order.id.slice(0, 8).toUpperCase()}`,
        '',
        '*Itens:*',
        ...items.map(i => `${i.emoji} ${i.name} x${i.qty} — R$ ${formatPrice(i.price * i.qty)}`),
        '',
        `*Total: R$ ${formatPrice(total)}*`,
        `*Endereço:* ${address}`,
        notes ? `*Obs:* ${notes}` : null,
        '',
        `*Cliente:* ${customerName}`,
        `*Tel:* ${customerPhone}`
    ].filter(Boolean);
    return lines.join('\n');
}

// Checkout
async function handleCheckout() {
    if (cart.length === 0) return;

    const user = window.currentUser();
    if (!user) { 
        showToast('Sessão expirada. Faça login novamente.'); 
        showScreen('auth'); 
        return; 
    }

    const address = $('#delivery-address').value.trim();
    const notes = $('#order-notes').value.trim();
    
    if (!address) { 
        showToast('Informe o endereço de entrega'); 
        return; 
    }

    // Verificar disponibilidade atualizada
    let hasStockIssue = false;
    for (const item of cart) {
        if (window.getReservedQuantity) {
            const reserved = await window.getReservedQuantity(item.id);
            const available = item.maxStock;
            if (item.qty > available) {
                showToast(`⚠️ "${item.name}" - Disponível: ${available}, Solicitado: ${item.qty}`);
                hasStockIssue = true;
            }
        }
    }
    
    if (hasStockIssue) {
        if (window.loadProducts) await window.loadProducts();
        return;
    }

    const items = cart.map(i => ({ 
        id: i.id, 
        name: i.name, 
        qty: i.qty, 
        price: i.price, 
        emoji: i.emoji 
    }));
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const btnCheckout = $('#btn-checkout');
    setLoading(btnCheckout, true);
    
    try {
        const { data, error } = await db.from('orders').insert({
            user_id: user.id,
            items,
            total,
            status: 'pendente',
            delivery_address: address,
            notes: notes || null
        }).select().single();

        if (error) {
            showToast('Erro ao registrar pedido ❌');
            console.error('Checkout error:', error);
            setLoading(btnCheckout, false);
            return;
        }

        // Limpar carrinho
        cart = [];
        saveCart();
        updateCartBadge();

        const whatsappMsg = buildWhatsAppMsg(data, items, total, address, notes);
        const whatsappPhone = window.storeSettings?.whatsapp || APP_CONFIG.whatsappDefault;
        openWhatsApp(whatsappMsg, whatsappPhone);
        
        showToast('Pedido registrado! ✅ Estoque reservado');
        navigate('orders');
        
        if (window.loadProducts) await window.loadProducts();
        if (window.renderCart) renderCart();
        
    } catch (err) {
        showToast('Erro ao processar pedido ❌');
        console.error(err);
    } finally {
        setLoading(btnCheckout, false);
    }
}

// Bind eventos do carrinho
function bindCartEvents() {
    const btnCart = $('#btn-cart');
    const btnCheckout = $('#btn-checkout');
    
    if (btnCart) btnCart.addEventListener('click', () => navigate('cart'));
    if (btnCheckout) btnCheckout.addEventListener('click', handleCheckout);
}

// Exportar para uso global
window.cart = cart;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.renderCart = renderCart;
window.updateCartBadge = updateCartBadge;
window.loadCart = loadCart;
window.saveCart = saveCart;
window.clearCart = clearCart;
window.bindCartEvents = bindCartEvents;