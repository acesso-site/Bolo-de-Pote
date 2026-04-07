// ============================================================
// ADMIN - CONFIGURAÇÕES DA LOJA
// ============================================================

let storeSettings = {};

// Carregar configurações
async function loadSettings() {
    const { data, error } = await db.from('store_settings').select('*').eq('id', 1).single();
    
    if (error) {
        console.error('Error loading settings:', error);
        return;
    }
    
    if (data) {
        storeSettings = data;
        
        // Atualizar título da página
        if (data.store_name) {
            document.title = data.store_name + ' · Bolo de Pote';
            const topbarName = document.querySelector('.topbar-name');
            const authTitle = document.querySelector('.auth-title');
            const heroTitle = $('#hero-title');
            
            if (topbarName) topbarName.textContent = data.store_name;
            if (authTitle) authTitle.textContent = data.store_name;
            if (heroTitle) heroTitle.textContent = data.store_name;
        }
        
        // Atualizar slogan
        if (data.slogan) {
            const heroSubtitle = $('#hero-subtitle');
            const authSubtitle = document.querySelector('.auth-subtitle');
            
            if (heroSubtitle) heroSubtitle.textContent = data.slogan;
            if (authSubtitle) authSubtitle.textContent = data.slogan;
        }
        
        // Atualizar informações de entrega
        const infoEl = $('#store-info-cards');
        if (infoEl && data.delivery_info) {
            infoEl.innerHTML = `
                <div class="info-card">
                    <h4>🚚 Entrega & Pedidos</h4>
                    <p>${escapeHtml(data.delivery_info)}</p>
                </div>
                <div class="info-card">
                    <h4>💬 Fale Conosco</h4>
                    <p>Dúvidas ou encomendas especiais? Fale pelo WhatsApp!</p>
                    <button class="btn-primary" style="margin-top:12px" onclick="openWhatsApp('')">Chamar no WhatsApp</button>
                </div>
            `;
        }
        
        // Preencher formulário de configurações
        const storeNameInput = $('#set-store-name');
        const sloganInput = $('#set-store-slogan');
        const whatsappInput = $('#set-whatsapp');
        const deliveryInfoInput = $('#set-delivery-info');
        
        if (storeNameInput) storeNameInput.value = data.store_name || '';
        if (sloganInput) sloganInput.value = data.slogan || '';
        if (whatsappInput) whatsappInput.value = data.whatsapp || '';
        if (deliveryInfoInput) deliveryInfoInput.value = data.delivery_info || '';
    }
}

// Salvar configurações
async function saveSettings() {
    const profile = window.currentProfile();
    if (!profile?.is_admin) return;
    
    const storeNameInput = $('#set-store-name');
    const sloganInput = $('#set-store-slogan');
    const whatsappInput = $('#set-whatsapp');
    const deliveryInfoInput = $('#set-delivery-info');
    
    const payload = {
        store_name: storeNameInput ? storeNameInput.value.trim() : '',
        slogan: sloganInput ? sloganInput.value.trim() : '',
        whatsapp: whatsappInput ? whatsappInput.value.trim() : '',
        delivery_info: deliveryInfoInput ? deliveryInfoInput.value.trim() : ''
    };
    
    const btnSave = $('#btn-save-settings');
    setLoading(btnSave, true);
    
    const { error } = await db.from('store_settings').update(payload).eq('id', 1);
    
    setLoading(btnSave, false);
    
    if (error) {
        showToast('Erro ao salvar ❌');
        console.error('saveSettings error:', error);
    } else {
        showToast('Configurações salvas! ✅');
        await loadSettings();
    }
}

// Bind eventos do admin de configurações
function bindSettingsEvents() {
    const btnSaveSettings = $('#btn-save-settings');
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveSettings);
}

// Exportar para uso global
window.storeSettings = storeSettings;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.bindSettingsEvents = bindSettingsEvents;