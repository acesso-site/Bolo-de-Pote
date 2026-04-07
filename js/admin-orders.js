// ============================================================
// ADMIN - PEDIDOS
// ============================================================

let currentOrderId = null;

// Carregar pedidos para o admin
async function loadAdminOrders() {
    const { data, error } = await db
        .from('admin_orders_view')
        .select('*')
        .order('created_at', { ascending: false });

    const list = $('#admin-orders-list');

    if (error) {
        if (list) list.innerHTML = '<p style="color:var(--text-light)">Erro ao carregar pedidos.</p>';
        console.error('loadAdminOrders error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        if (list) list.innerHTML = '<p style="color:var(--text-light)">Nenhum pedido ainda.</p>';
        return;
    }

    if (list) {
        list.innerHTML = data.map(o => `
            <div class="admin-order-card" onclick="openOrderModal('${o.id}')">
                <div class="admin-order-header">
                    <span class="admin-order-client">👤 ${escapeHtml(o.customer_name || 'Cliente')}</span>
                    <span class="order-status status-${o.status}">${o.status}</span>
                </div>
                <div class="admin-order-summary">
                    ${o.items.map(i => `${i.emoji} ${i.name} x${i.qty}`).join(' · ')}
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:0.82rem">
                    <span style="color:var(--text-light)">${formatDate(o.created_at)}</span>
                    <span style="font-weight:700;color:var(--caramel)">R$ ${formatPrice(o.total)}</span>
                </div>
            </div>
        `).join('');
    }
}

// Abrir modal de detalhes do pedido
async function openOrderModal(id) {
    currentOrderId = id;
    
    const { data: o, error } = await db
        .from('admin_orders_view')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error || !o) { 
        showToast('Erro ao carregar pedido ❌'); 
        console.error('openOrderModal error:', error);
        return; 
    }

    const statusSelect = $('#order-status-select');
    const modalBody = $('#modal-order-body');
    
    if (statusSelect) statusSelect.value = o.status;
    
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="margin-bottom:16px">
                <strong>Pedido #${o.id.slice(0, 8).toUpperCase()}</strong><br>
                <span style="color:var(--text-light);font-size:0.85rem">${formatDate(o.created_at)}</span>
            </div>
            <div style="margin-bottom:12px">
                <strong>👤 Cliente:</strong> ${escapeHtml(o.customer_name || '—')}<br>
                <strong>📞 Telefone:</strong> ${escapeHtml(o.customer_phone || '—')}
            </div>
            <div style="margin-bottom:12px">
                <strong>🛒 Itens:</strong><br>
                ${o.items.map(i => `${i.emoji} ${escapeHtml(i.name)} x${i.qty} — R$ ${formatPrice(i.price * i.qty)}`).join('<br>')}
            </div>
            <div style="margin-bottom:12px"><strong>💰 Total: R$ ${formatPrice(o.total)}</strong></div>
            <div style="margin-bottom:12px"><strong>📍 Endereço:</strong> ${escapeHtml(o.delivery_address || '—')}</div>
            ${o.notes ? `<div><strong>📝 Obs:</strong> ${escapeHtml(o.notes)}</div>` : ''}
            <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border); font-size:0.85rem; color:var(--text-light)">
                ℹ️ Status "entregue" finaliza o pedido. Status "cancelado" devolve o estoque.
            </div>
        `;
    }
    
    const modal = $('#modal-order');
    if (modal) modal.classList.remove('hidden');
}

// Fechar modal de pedido
function closeOrderModal() {
    const modal = $('#modal-order');
    if (modal) modal.classList.add('hidden');
    currentOrderId = null;
}

// Atualizar status do pedido
async function updateOrderStatus() {
    if (!currentOrderId) return;
    
    const statusSelect = $('#order-status-select');
    const status = statusSelect ? statusSelect.value : 'pendente';
    
    const btnUpdate = $('#btn-update-order-status');
    setLoading(btnUpdate, true);
    
    const { error } = await db.from('orders').update({ status }).eq('id', currentOrderId);
    
    setLoading(btnUpdate, false);
    
    if (error) { 
        showToast('Erro ao atualizar ❌'); 
        console.error('updateOrderStatus error:', error.message);
    } else {
        let message = `Status atualizado para "${status}" ✅`;
        if (status === 'entregue') {
            message = '✅ Pedido entregue! Estoque debitado.';
        } else if (status === 'cancelado') {
            message = '🔄 Pedido cancelado! Estoque liberado.';
        }
        showToast(message);
        closeOrderModal();
        await loadAdminOrders();
        if (window.loadProducts) await window.loadProducts();
        if (window.loadAdminProducts) await window.loadAdminProducts();
    }
}

// Bind eventos do admin de pedidos
function bindAdminOrdersEvents() {
    const btnCloseOrderModal = $('#btn-close-order-modal');
    const btnUpdateStatus = $('#btn-update-order-status');
    
    if (btnCloseOrderModal) btnCloseOrderModal.addEventListener('click', closeOrderModal);
    if (btnUpdateStatus) btnUpdateStatus.addEventListener('click', updateOrderStatus);
}

// Exportar para uso global
window.loadAdminOrders = loadAdminOrders;
window.openOrderModal = openOrderModal;
window.updateOrderStatus = updateOrderStatus;
window.bindAdminOrdersEvents = bindAdminOrdersEvents;