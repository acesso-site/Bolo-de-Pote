// ============================================================
// PEDIDOS DO CLIENTE
// ============================================================

// Carregar pedidos do usuário atual
async function loadMyOrders() {
    const user = window.currentUser();
    if (!user) return;

    const { data, error } = await db.from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = $('#orders-list');
    const empty = $('#orders-empty');

    if (error) {
        if (list) list.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        console.error('loadMyOrders error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        if (list) list.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }

    if (empty) empty.classList.add('hidden');
    if (list) {
        list.innerHTML = data.map(o => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-date">${formatDate(o.created_at)}</div>
                        <div class="order-id">#${o.id.slice(0, 8).toUpperCase()}</div>
                    </div>
                    <span class="order-status status-${o.status}">${o.status}</span>
                </div>
                <div class="order-items">${o.items.map(i => `${i.emoji} ${i.name} x${i.qty}`).join(' · ')}</div>
                <div class="order-total">Total: R$ ${formatPrice(o.total)}</div>
            </div>
        `).join('');
    }
}

function bindOrdersEvents() {
    // Eventos relacionados a pedidos
}

// Exportar para uso global
window.loadMyOrders = loadMyOrders;
window.bindOrdersEvents = bindOrdersEvents;