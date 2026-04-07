// ============================================================
// APP PRINCIPAL - DOCINHO DA VÓ
// Inicialização e orquestração dos módulos
// ============================================================

// Inicialização principal
async function init() {
    // Carregar carrinho
    loadCart();
    
    // Inicializar autenticação
    await initAuth();
    
    // Bind de eventos globais
    bindGlobalEvents();
    
    // Bind de eventos específicos
    bindAuthEvents();
    bindCartEvents();
    bindProductsEvents();
    bindAdminProductsEvents();
    bindAdminOrdersEvents();
    bindSettingsEvents();
    bindOrdersEvents();
    
    // Ouvir mudanças de página
    document.addEventListener('pageChange', async (e) => {
        const page = e.detail.page;
        
        switch(page) {
            case 'shop':
                await loadProducts();
                break;
            case 'cart':
                renderCart();
                break;
            case 'orders':
                await loadMyOrders();
                break;
            case 'admin':
                const profile = window.currentProfile();
                if (!profile?.is_admin) { 
                    showToast('Acesso negado ❌'); 
                    navigate('shop'); 
                    return; 
                }
                await loadAdminProducts();
                await loadAdminOrders();
                break;
        }
    });
}

// Eventos globais (menu do usuário)
function bindGlobalEvents() {
    const btnUserMenu = $('#btn-user-menu');
    const userMenu = $('#user-menu');
    
    if (btnUserMenu) {
        btnUserMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            if (userMenu) userMenu.classList.toggle('hidden');
        });
    }
    
    document.addEventListener('click', () => {
        if (userMenu) userMenu.classList.add('hidden');
    });
    
    // Tabs do admin
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.atab;
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
            const targetPanel = $(`atab-${target}`);
            if (targetPanel) targetPanel.classList.remove('hidden');
        });
    });
}

// Iniciar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);