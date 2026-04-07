// ============================================================
// AUTENTICAÇÃO (Login/Registro)
// ============================================================

// Estado global do usuário
let currentUser = null;
let currentProfile = null;

// Inicializar auth
async function initAuth() {
    const { data: { session } } = await db.auth.getSession();

    if (session) {
        await onUserLogin(session.user);
    } else {
        hideLoading();
        showScreen('auth');
    }

    db.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            if (!currentUser) {
                await onUserLogin(session.user);
            }
        }
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            currentProfile = null;
            if (window.cart) {
                window.cart = [];
                if (window.saveCart) window.saveCart();
            }
            showScreen('auth');
        }
    });
}

// Login
async function handleLogin() {
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    if (!email || !password) { 
        showToast('Preencha todos os campos'); 
        return; 
    }

    setLoading($('#btn-login'), true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setLoading($('#btn-login'), false);
    
    if (error) {
        showToast('Erro: ' + translateError(error.message));
    }
}

// Registro
async function handleRegister() {
    const name = $('#reg-name').value.trim();
    const phone = $('#reg-phone').value.trim();
    const email = $('#reg-email').value.trim();
    const password = $('#reg-password').value;

    if (!name || !email || !password) { 
        showToast('Preencha todos os campos'); 
        return; 
    }
    if (password.length < 6) { 
        showToast('Senha precisa ter 6+ caracteres'); 
        return; 
    }

    setLoading($('#btn-register'), true);
    const { error } = await db.auth.signUp({
        email, 
        password,
        options: { 
            data: { name, phone } 
        }
    });
    setLoading($('#btn-register'), false);

    if (error) {
        showToast('Erro: ' + translateError(error.message));
    } else {
        showToast('Conta criada! Verifique seu e-mail 📧');
        // Limpar formulário
        $('#reg-name').value = '';
        $('#reg-phone').value = '';
        $('#reg-email').value = '';
        $('#reg-password').value = '';
    }
}

// Logout
async function handleLogout() {
    await db.auth.signOut();
}

// Callback após login
async function onUserLogin(user) {
    currentUser = user;

    const { data, error } = await db.from('profiles').select('*').eq('id', user.id).single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
    }

    currentProfile = data || null;

    const userNameEl = $('#user-display-name');
    const userEmailEl = $('#user-display-email');
    const btnAdmin = $('#btn-go-admin');
    
    if (userNameEl) userNameEl.textContent = currentProfile?.name || user.email;
    if (userEmailEl) userEmailEl.textContent = user.email;
    if (btnAdmin && currentProfile?.is_admin) {
        btnAdmin.style.display = '';
    }

    if (window.loadSettings) await window.loadSettings();
    if (window.updateCartBadge) window.updateCartBadge();
    
    hideLoading();
    showScreen('app');
    navigate('shop');
}

// Bind eventos de autenticação
function bindAuthEvents() {
    // Tabs de autenticação
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            const tabLogin = $('#tab-login');
            const tabRegister = $('#tab-register');
            if (tabLogin) tabLogin.classList.toggle('hidden', target !== 'login');
            if (tabRegister) tabRegister.classList.toggle('hidden', target !== 'register');
        });
    });

    // Botões de autenticação
    const btnLogin = $('#btn-login');
    const btnRegister = $('#btn-register');
    const btnLogout = $('#btn-logout');
    const btnMyOrders = $('#btn-my-orders');
    const btnGoAdmin = $('#btn-go-admin');
    
    if (btnLogin) btnLogin.addEventListener('click', handleLogin);
    if (btnRegister) btnRegister.addEventListener('click', handleRegister);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
    if (btnMyOrders) btnMyOrders.addEventListener('click', () => navigate('orders'));
    if (btnGoAdmin) btnGoAdmin.addEventListener('click', () => navigate('admin'));

    // Enter key na tela de auth
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const authScreen = $('#auth-screen');
            if (authScreen && !authScreen.classList.contains('hidden')) {
                const activeTab = document.querySelector('.auth-tab.active');
                if (activeTab && activeTab.dataset.tab === 'login') {
                    handleLogin();
                } else {
                    handleRegister();
                }
            }
        }
    });
}

// Exportar para uso global
window.currentUser = () => currentUser;
window.currentProfile = () => currentProfile;
window.initAuth = initAuth;
window.bindAuthEvents = bindAuthEvents;