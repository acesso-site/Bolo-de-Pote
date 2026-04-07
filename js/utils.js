// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

// DOM helper
const $ = (id) => document.getElementById(id);

// Formatar preço
function formatPrice(n) {
    return Number(n).toFixed(2).replace('.', ',');
}

// Formatar data
function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Toast notifications
function showToast(msg, duration = 3000) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

// Loading state em botões
function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn._orig = btn._orig || btn.textContent;
    btn.textContent = loading ? '⏳ Aguarde...' : btn._orig;
}

// Traduzir erros do Supabase
function translateError(msg) {
    if (!msg) return 'Erro desconhecido';
    if (msg.includes('Invalid login')) return 'E-mail ou senha incorretos';
    if (msg.includes('already registered')) return 'E-mail já cadastrado';
    if (msg.includes('Password should')) return 'Senha fraca (mínimo 6 caracteres)';
    if (msg.includes('Estoque insuficiente')) return 'Estoque insuficiente para este pedido';
    if (msg.includes('JWT')) return 'Sessão expirada. Faça login novamente.';
    return msg;
}

// Navegação entre páginas
function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const targetPage = $(`page-${page}`);
    if (targetPage) targetPage.classList.remove('hidden');
    
    const userMenu = $('#user-menu');
    if (userMenu) userMenu.classList.add('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Disparar evento para os módulos saberem que a página mudou
    document.dispatchEvent(new CustomEvent('pageChange', { detail: { page } }));
}

// Mostrar/Esconder telas
function showScreen(name) {
    const app = $('#app');
    const authScreen = $('#auth-screen');
    
    document.querySelectorAll('.screen, #app, #auth-screen').forEach(el => {
        if (el) el.classList.add('hidden');
    });
    
    if (name === 'app' && app) {
        app.classList.remove('hidden');
    } else if (name === 'auth' && authScreen) {
        authScreen.classList.remove('hidden');
    }
}

// Esconder loading
function hideLoading() {
    setTimeout(() => {
        const ls = $('#loading-screen');
        if (ls) {
            ls.style.opacity = '0';
            ls.style.transition = 'opacity 0.4s';
            setTimeout(() => ls.classList.add('hidden'), 400);
        }
    }, 800);
}

// Abrir WhatsApp
function openWhatsApp(msg, phone) {
    const whatsapp = phone || APP_CONFIG.whatsappDefault;
    const url = `https://wa.me/${whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
    window.open(url, '_blank');
}

// Exportar para uso global
window.$ = $;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.setLoading = setLoading;
window.translateError = translateError;
window.navigate = navigate;
window.showScreen = showScreen;
window.hideLoading = hideLoading;
window.openWhatsApp = openWhatsApp;