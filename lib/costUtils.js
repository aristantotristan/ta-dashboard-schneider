// lib/costUtils.js

/**
 * Mengonversi total jam (decimal) menjadi format Hari dan Jam/Menit.
 * Contoh: 76.5 jam -> "3 Hari 4 Jam 30 Mnt"
 * @param {number} totalHours - Total jam dari data mentah (OpH).
 * @returns {string} Format waktu yang mudah dibaca.
 */
export function formatOperatingTime(totalHours) {
    if (totalHours === undefined || totalHours === null || isNaN(totalHours) || totalHours < 0) {
        return '---';
    }
    
    // Konversi ke total menit untuk perhitungan presisi
    const totalMinutes = Math.round(parseFloat(totalHours) * 60);

    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutes = totalMinutes % (24 * 60);
    
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    
    let result = '';
    
    if (days > 0) result += `${days} Hari `;
    if (hours > 0 || (days === 0 && minutes > 0)) {
        result += `${hours} Jam`;
        if (minutes > 0) result += ` ${minutes} Mnt`;
    }
    
    return result.trim() || '0 Jam'; 
}


/**
 * Menghitung Biaya Energi Aktif dan Denda Reaktif berdasarkan data konsumsi.
 * @param {number} ea - Konsumsi Energi Aktif (kWh).
 * @param {number} er - Konsumsi Energi Reaktif (kVARh).
 * @param {object} config - Konfigurasi tarif dari DB (rate_lwbp, rate_wbp, dll.)
 * @param {number} currentHour - Jam saat ini (0-23) untuk menentukan WBP/LWBP.
 * @returns {object} { cost_aktif, cost_reaktif, total, tarif_mode }
 */
export function calculateCost(ea, er, config, currentHour) {
    // Gunakan default aman jika config gagal dimuat
    const rate_lwbp = config?.rate_lwbp || 1000;
    const rate_wbp = config?.rate_wbp || 1500;
    const rate_reaktif = config?.rate_reaktif || 800;
    const wbp_start = config?.wbp_start || 18; // 18:00
    const wbp_end = config?.wbp_end || 22;   // 22:00

    // 1. Tentukan Mode Tarif
    const isWBP = currentHour >= wbp_start && currentHour < wbp_end;
    const rate_aktif = isWBP ? rate_wbp : rate_lwbp;
    const mode_text = isWBP ? 'WBP' : 'LWBP';

    // 2. Biaya Energi Aktif (Est. menggunakan tarif saat ini)
    const cost_aktif = Math.round(ea * rate_aktif);

    // 3. Biaya Denda Reaktif: Denda jika kVARh > 50% dari kWh
    const batas_reaktif = ea * 0.5;
    const kelebihan_reaktif = Math.max(0, er - batas_reaktif);
    const cost_reaktif = Math.round(kelebihan_reaktif * rate_reaktif);
    
    const total = cost_aktif + cost_reaktif;

    return {
        cost_aktif,
        cost_reaktif,
        total,
        tarif_mode: mode_text,
        rate_aktif
    };
}
