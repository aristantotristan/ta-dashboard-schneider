// =======================================================
// KODE LENGKAP tariff_fetch.js DENGAN FILTER MESIN ID
// =======================================================

const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 

const TARIFF_TABLE = 'tariff_settings';
const TELEMETRY_TABLE = 'machine_telemetry';

let activeRate = 0; 

async function setupTariffData() {
    const tariffUrl = `${SUPABASE_URL}/rest/v1/${TARIFF_TABLE}?select=rate_per_kwh,tariff_name,updated_by_name,updated_by_division,updated_at&is_active=eq.true`;

    try {
        const tariffRes = await fetch(tariffUrl, { headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY } });
        if (!tariffRes.ok) throw new Error("Gagal mengambil tarif awal.");

        const tariffData = await tariffRes.json();
        
        activeRate = tariffData.length > 0 ? parseFloat(tariffData[0].rate_per_kwh) : 0;
        const activeName = tariffData.length > 0 ? tariffData[0].tariff_name : 'Tarif Default (Rp 0)';

        document.getElementById('currentTariffName').textContent = activeName;
        document.getElementById('currentTariffRate').textContent = `Rp ${activeRate.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;

        if (tariffData.length > 0) {
            document.getElementById('updaterName').textContent = tariffData[0].updated_by_name || 'System';
            document.getElementById('updaterDivision').textContent = tariffData[0].updated_by_division || 'IT';
            document.getElementById('updaterTime').textContent = new Date(tariffData[0].updated_at).toLocaleString('id-ID');
        }
        
    } catch (error) {
        console.error("Setup Tarif Gagal:", error);
    }
}

// Fungsi Kunci: Mengambil dan Menghitung Biaya Berdasarkan Filter Mesin & Tanggal
async function fetchAndCalculateCost() {
    const machineId = document.getElementById('machineId').value;
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = `<tr><td colspan="5">Mencari data telemetri untuk ${machineId}...</td></tr>`;

    if (!machineId || !startDateInput || !endDateInput) {
        alert("Mohon pilih Mesin ID, Tanggal Mulai dan Tanggal Akhir.");
        tbody.innerHTML = `<tr><td colspan="5">Pilih mesin, tanggal, dan tekan 'Hitung Biaya' untuk melihat laporan.</td></tr>`;
        return;
    }

    // --- Logika Penentuan Filter Waktu ---
    const startDate = new Date(startDateInput);
    startDate.setHours(0, 0, 0, 0); 
    const endDate = new Date(endDateInput);
    endDate.setHours(23, 59, 59, 999); 
    
    if (startDate.getTime() >= endDate.getTime()) {
        alert("Tanggal Mulai harus lebih awal dari Tanggal Akhir.");
        tbody.innerHTML = `<tr><td colspan="5">Tanggal tidak valid.</td></tr>`;
        return;
    }
    
    const startFilter = startDate.toISOString();
    const endFilter = endDate.toISOString();
    
    // URL API Supabase: FILTER BERDASARKAN MACHINE_ID & WAKTU
    const telemetryUrl = `${SUPABASE_URL}/rest/v1/${TELEMETRY_TABLE}?select=machine_id,ea_total,timestamp&machine_id=eq.${machineId}&timestamp=gte.${startFilter}&timestamp=lte.${endFilter}&order=timestamp.asc`; 
    
    try {
        const telemetryRes = await fetch(telemetryUrl, { headers: {'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY } });
        if (!telemetryRes.ok) throw new Error("Gagal mengambil data historis.");
        
        const telemetryData = await telemetryRes.json();
        
        if (telemetryData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">Tidak ada data yang terekam untuk ${machineId} dalam periode tersebut.</td></tr>`;
            return;
        }

        // --- Proses Kalkulasi Konsumsi Berdasarkan Selisih ---
        const costSummary = calculateConsumptionByPeriod(telemetryData, activeRate);
        
        if (Object.keys(costSummary).length === 0) {
             tbody.innerHTML = `<tr><td colspan="5">Data ditemukan, tetapi tidak cukup log (minimal 2 pembacaan) untuk menghitung selisih konsumsi.</td></tr>`;
             return;
        }
        
        displayCostData(costSummary);

    } catch (error) {
        console.error("Gagal menghitung biaya:", error);
        tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}. Cek RLS Policy SELECT pada machine_telemetry.</td></tr>`;
    }
}

// Fungsi Kunci: Menghitung Konsumsi & Biaya berdasarkan data awal dan akhir
function calculateConsumptionByPeriod(telemetryData, ratePerKwh) {
    // Karena data sudah difilter oleh machineId, kita hanya perlu memproses array ini.
    const machineLogs = {};

    telemetryData.forEach(record => {
        // Kita hanya perlu menyimpan data untuk satu mesin yang terfilter
        if (!machineLogs[record.machine_id]) {
            machineLogs[record.machine_id] = [];
        }
        machineLogs[record.machine_id].push({
            eaTotal: parseFloat(record.ea_total) || 0,
            timestamp: new Date(record.timestamp)
        });
    });

    const results = {};

    for (const machineId in machineLogs) {
        const logs = machineLogs[machineId];
        logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        if (logs.length < 2) continue; // Minimal 2 pembacaan untuk menghitung selisih

        const startLog = logs[0]; // Pembacaan awal
        const endLog = logs[logs.length - 1]; // Pembacaan akhir

        const kwhConsumed = Math.max(0, endLog.eaTotal - startLog.eaTotal); 
        const totalCost = kwhConsumed * ratePerKwh;

        results[machineId] = {
            kwhConsumed,
            totalCost,
            startTime: startLog.timestamp,
            endTime: endLog.timestamp
        };
    }
    return results;
}

// Fungsi Display (Menampilkan hanya satu baris)
function displayCostData(costSummary) {
    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = '';

    const formatRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

    for (const machineId in costSummary) {
        const data = costSummary[machineId];
        
        const row = tbody.insertRow();
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = data.kwhConsumed.toFixed(2);
        row.insertCell().textContent = data.startTime.toLocaleString('id-ID');
        row.insertCell().textContent = data.endTime.toLocaleString('id-ID');
        row.insertCell().textContent = formatRupiah(data.totalCost);
    }
}

// Fungsi Update Tariff (Tidak Berubah)
async function updateTariff() {
    const newRate = document.getElementById('newRate').value;
    
    if (newRate === "" || isNaN(newRate) || parseFloat(newRate) <= 0) {
        alert("Mohon masukkan nilai tarif yang valid (angka positif).");
        return;
    }
    
    const userName = prompt("⚠️ MASUKKAN NAMA ANDA (Pencatat Audit):") || 'ADMIN TANPA NAMA';
    const userDivision = prompt("⚠️ MASUKKAN DIVISI ANDA (Contoh: Finance, IT, TA):") || 'DIVISI TIDAK DIKETAHUI';

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
            setupTariffData(); 
        } else {
            alert('❌ Gagal memperbarui tarif. Pastikan RLS Policy (UPDATE) di Supabase sudah diatur untuk tabel tariff_settings.');
        }
    } catch (error) {
        console.error("Error update tarif:", error);
        alert("Terjadi error saat komunikasi dengan server.");
    }
}


document.addEventListener('DOMContentLoaded', setupTariffData);
