// =======================================================
// !!! GANTI DENGAN KREDENSIAL SUPABASE ANDA !!!
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
// =======================================================

const TARIFF_TABLE = 'tariff_settings';
const TELEMETRY_TABLE = 'machine_telemetry';

async function fetchTariffData() {
    // Meminta semua kolom yang diperlukan, termasuk kolom audit yang baru
    const tariffUrl = `${SUPABASE_URL}/rest/v1/${TARIFF_TABLE}?select=rate_per_kwh,tariff_name,updated_by_name,updated_by_division,updated_at&is_active=eq.true`;
    const telemetryUrl = `${SUPABASE_URL}/rest/v1/${TELEMETRY_TABLE}?select=machine_id,ea_total&limit=1000`; 

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
        
        const activeRate = tariffData.length > 0 ? parseFloat(tariffData[0].rate_per_kwh) : 0;
        const activeName = tariffData.length > 0 ? tariffData[0].tariff_name : 'Tarif Default (Rp 0)';

        // Tampilkan tarif
        document.getElementById('currentTariffName').textContent = activeName;
        document.getElementById('currentTariffRate').textContent = `Rp ${activeRate.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

        // Tampilkan Detail Audit (Menggunakan kolom updated_by_name & updated_by_division)
        if (tariffData.length > 0) {
            document.getElementById('updaterName').textContent = tariffData[0].updated_by_name || 'System';
            document.getElementById('updaterDivision').textContent = tariffData[0].updated_by_division || 'IT';
            document.getElementById('updaterTime').textContent = new Date(tariffData[0].updated_at).toLocaleString('id-ID');
        }

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
        const kwh = parseFloat(record.ea_total) || 0; 
        
        if (!costSummary[machineId] || kwh > (costSummary[machineId].kwhTotal || 0)) {
             costSummary[machineId] = { kwhTotal: kwh };
        }
    });
    
    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = '';

    if (Object.keys(costSummary).length === 0) {
        tbody.innerHTML = `<tr><td colspan='4'>Tidak ada data konsumsi energi (machine_telemetry) yang ditemukan.</td></tr>`;
        return;
    }

    for (const machineId in costSummary) {
        const kwh = costSummary[machineId].kwhTotal;
        const totalCost = kwh * ratePerKwh;
        
        const row = tbody.insertRow();
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = kwh.toFixed(2);
        row.insertCell().textContent = ratePerKwh.toLocaleString('id-ID');
        row.insertCell().textContent = totalCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    }
}

// Fungsi untuk POST (PATCH) update tarif - Meminta Nama dan Divisi
async function updateTariff() {
    const newRate = document.getElementById('newRate').value;
    
    if (newRate === "" || isNaN(newRate) || parseFloat(newRate) <= 0) {
        alert("Mohon masukkan nilai tarif yang valid (angka positif).");
        return;
    }
    
    // --- Langkah Kritis: Meminta Nama dan Divisi Pengubah ---
    const userName = prompt("⚠️ MASUKKAN NAMA ANDA (Pencatat Audit):") || 'ADMIN TANPA NAMA';
    const userDivision = prompt("⚠️ MASUKKAN DIVISI ANDA (Contoh: Finance, IT, TA):") || 'DIVISI TIDAK DIKETAHUI';
    // ---------------------------------------------------------

    // Hardcoded ID 1, asumsi itu adalah tarif aktif
    const activeTariffId = 1; 

    const payload = {
        rate_per_kwh: parseFloat(newRate),
        updated_by_name: userName,
        updated_by_division: userDivision,
        updated_at: new Date().toISOString()
    };
    
    const updateUrl = `${SUPABASE_URL}/rest/v1/${TARIFF_TABLE}?id=eq.${activeTariffId}`;

    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY 
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`✅ Tarif berhasil diperbarui menjadi Rp ${newRate}! Dicatat oleh ${userName} (${userDivision}).`);
            fetchTariffData(); 
        } else {
            alert('❌ Gagal memperbarui tarif. Pastikan RLS Policy (UPDATE) di Supabase sudah diatur untuk tabel tariff_settings.');
        }
    } catch (error) {
        console.error("Error update tarif:", error);
        alert("Terjadi error saat komunikasi dengan server.");
    }
}


document.addEventListener('DOMContentLoaded', fetchTariffData);
