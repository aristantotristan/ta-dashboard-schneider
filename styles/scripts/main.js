// =======================================================
// scripts/main.js
// Logika Inti, Variabel Global, dan Manajemen Tampilan
// =======================================================

// --- KONFIGURASI GLOBAL ---
const MAX_SLAVE_ID = 18; 
// Menyimpan referensi baris tabel untuk pembaruan realtime
// Dideklarasikan di sini agar dapat diakses oleh realtime.js
const devices = {}; 
const dataMap = [
    { key: 'V', class: 'col-v' }, { key: 'I1', class: 'col-i' }, { key: 'I2', class: 'col-i' }, 
    { key: 'I3', class: 'col-i' }, { key: 'P', class: 'col-power' }, { key: 'Q', class: 'col-power' }, 
    { key: 'S', class: 'col-power' }, { key: 'PF', class: 'col-pf' }, { key: 'Hz', class: 'col-pf' }, 
    { key: 'OpH', class: 'col-pf' }, { key: 'EaT', class: 'col-energy' }, { key: 'ErT', class: 'col-energy' }, 
    { key: 'EaP', class: 'col-energy' }, { key: 'ErP', class: 'col-energy' }
];

// --- KONFIGURASI SUPABASE (Ganti dengan kunci Anda) ---
const SUPABASE_URL = 'https://[your-project-ref].supabase.co'; 
const SUPABASE_ANON_KEY = '[your-anon-public-key]'; 
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- FUNGSI UTILITY ---

/**
 * Mengonversi total jam (decimal) menjadi format Hari dan Jam.
 */
function formatOperatingTime(totalHours) {
    if (totalHours === undefined || totalHours === null || isNaN(totalHours) || totalHours < 0) {
        return '---';
    }
    const totalMinutes = Math.round(parseFloat(totalHours) * 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutes = totalMinutes % (24 * 60);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    let result = '';
    if (days > 0) result += `${days} Hari `;
    if (hours > 0 || days === 0) {
        result += `${hours} Jam`;
        if (minutes > 0) result += ` ${minutes} Mnt`;
    } else if (minutes > 0) {
        result += `${minutes} Mnt`;
    }
    return result.trim() || '0 Jam'; 
}


// --- FUNGSI MANAJEMEN TAMPILAN ---

/**
 * Mengganti tampilan antara Realtime dan Tarif.
 */
function showView(viewName) {
    // 1. Update Class Tombol Navigasi
    document.getElementById('btn-realtime').classList.remove('active');
    document.getElementById('btn-tarif').classList.remove('active');
    document.getElementById('btn-' + viewName).classList.add('active');

    // 2. Tampilkan Konten yang sesuai (Fungsi didefinisikan di file terpisah)
    if (viewName === 'realtime') {
        createRealtimeView(); // Dari realtime.js
    } else if (viewName === 'tarif') {
        createTarifView(); // Dari tarif.js
    }
}

// --- INISIASI APLIKASI ---
document.addEventListener('DOMContentLoaded', () => {
    // Tampilkan tampilan Realtime secara default saat pertama kali dimuat
    showView('realtime'); 
    // Mulai koneksi MQTT
    mqttClient.init(); // Dari realtime.js
});
