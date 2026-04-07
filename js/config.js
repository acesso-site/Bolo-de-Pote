// ============================================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================================

// Configurações do Supabase
const SUPABASE_URL = 'https://ugtqlfxbtufryqwqthhw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndHFsZnhidHVmcnlxd3F0aGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTI4NTMsImV4cCI6MjA5MTA2ODg1M30.w0r0gBeA7K7-2AzXm6CT1qO6fmbIcDTf14GxgF6kvpE';

// Configurações do app
const APP_CONFIG = {
    storeName: 'Docinho da Vó',
    version: '2.0.0',
    whatsappDefault: '5511999999999',
    cartStorageKey: 'docinho_cart'
};

// Inicializar Supabase (será usado por todos os módulos)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);