// =======================================================
// !!! GANTI DENGAN KREDENSIAL SUPABASE ANDA !!!
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
// =======================================================

// Asumsi: Kita akan mengambil data tarif aktif dan data telemetri (konsumsi)
const TARIFF_TABLE = 'tariff_settings';
const TELEMETRY_TABLE = 'machine_telemetry';

async function fetchTariffData() {
    // 1. Ambil Tarif Aktif
    const tariffUrl = `${SUPABASE_URL}/rest/v1/${TARIFF_TABLE}?select=*&is_active=eq.true`;
    
    // 2. Ambil Konsumsi Energi (Kita ambil total Ea dari telemetri, kelompokkan per mesin)
    const telemetryUrl = `${SUPABASE_URL}/rest/v1/${TELEMETRY_TABLE}?select=machine_id,ea_total&limit=100`; // Limit 100 data terakhir

    try {
        const [tariffRes, telemetryRes] = await Promise.all([
            fetch(tariffUrl, { headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY } }),
            fetch(telemetryUrl, { headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY } })
        ]);

        if (!tariffRes.ok || !telemetryRes.ok) {
            throw new Error("Gagal mengambil data dari Supabase.");
        }

        const tariffData = await tariffRes.json();
        const telemetryData = await telemetryRes.json();
        
        // Cek tarif aktif
        const activeRate = tariffData.length > 0 ? parseFloat(tariffData[0].rate_per_kwh) : 0;
        const activeName = tariffData.length > 0 ? tariffData[0].tariff_name : 'Tarif Default (Rp 0)';

        // Tampilkan tarif
        document.getElementById('currentTariffName').textContent = activeName;
        document.getElementById('currentTariffRate').textContent = `Rp ${activeRate.toLocaleString('id-ID')}`;

        // Olah dan tampilkan biaya
        displayCostData(telemetryData, activeRate);
        
    } catch (error) {
        console.error("Gagal mengambil data tarif:", error);
        document.getElementById('tariffTable').innerHTML = `<tr><td colspan='4'>Error: ${error.message} (Cek RLS Policy).</td></tr>`;
    }
}

// Fungsi pembantu: Mengelompokkan konsumsi dan menghitung biaya
function displayCostData(telemetryData, ratePerKwh) {
    const costSummary = {};

    telemetryData.forEach(record => {
        const machineId = record.machine_id;
        // Gunakan Total Ea (kWh) untuk estimasi
        const kwh = parseFloat(record.ea_total) || 0; 
        
        // Untuk data dummy, kita ambil Total Ea yang terakhir/maksimal
        if (!costSummary[machineId] || kwh > costSummary[machineId].kwhTotal) {
             costSummary[machineId] = { kwhTotal: kwh };
        }
    });
    
    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = '';

    for (const machineId in costSummary) {
        const kwh = costSummary[machineId].kwhTotal;
        const totalCost = kwh * ratePerKwh;
        
        const row = tbody.insertRow();
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = kwh.toFixed(2);
        row.insertCell().textContent = ratePerKwh.toLocaleString('id-ID');
        row.insertCell().textContent = totalCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
    }
}

document.addEventListener('DOMContentLoaded', fetchTariffData);
