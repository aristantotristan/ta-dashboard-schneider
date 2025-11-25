// =======================================================
// tariff_fetch.js: LOGIC TARIF & KALKULASI
// =======================================================
// Kredensial di-load dari config.js
const TARIFF_TABLE = 'tariff_settings';
const TELEMETRY_TABLE = 'machine_telemetry';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let activeRate = 0; 

document.addEventListener('DOMContentLoaded', () => {
    setupTariffData();
    fetchMachineListForFilter();
});

// Mengambil daftar mesin untuk filter
async function fetchMachineListForFilter() {
    try {
        const { data, error } = await supabase
            .from(TELEMETRY_TABLE)
            .select('machine_id')
            .order('machine_id', { ascending: true })
            .limit(100); 

        if (error) throw error;

        const uniqueMachines = [...new Set(data.map(item => item.machine_id))];
        const select = document.getElementById('machineId');

        uniqueMachines.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching machine list:", error);
    }
}

// Fungsi setup tarif awal
async function setupTariffData() {
    try {
        const { data: tariffData, error: tariffError } = await supabase
            .from(TARIFF_TABLE)
            .select(`rate_per_kwh, tariff_name, updated_by_name, updated_by_division, updated_at`)
            .eq('is_active', true)
            .limit(1);

        if (tariffError) throw tariffError;
        
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

// Fungsi Kunci: Mengambil dan Menghitung Biaya Berdasarkan Filter
async function fetchAndCalculateCost() {
    const machineId = document.getElementById('machineId').value;
    const startDateInput = document.getElementById('startDate').value;
    const startTimeInput = document.getElementById('startTime').value;
    const endDateInput = document.getElementById('endDate').value;
    const endTimeInput = document.getElementById('endTime').value;

    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = `<tr><td colspan="5">Mencari data telemetri untuk ${machineId}...</td></tr>`;

    if (!machineId || !startDateInput || !endDateInput || !startTimeInput || !endTimeInput) {
        alert("Mohon lengkapi Mesin ID, Tanggal, dan Jam.");
        tbody.innerHTML = `<tr><td colspan="5">Pilih mesin, tanggal, jam, dan tekan 'Hitung Biaya' untuk melihat laporan.</td></tr>`;
        return;
    }

    const startDate = new Date(`${startDateInput}T${startTimeInput}:00`);
    const endDate = new Date(`${endDateInput}T${endTimeInput}:00`);

    if (startDate.getTime() >= endDate.getTime()) {
        alert("Waktu Mulai harus lebih awal dari Waktu Akhir.");
        tbody.innerHTML = `<tr><td colspan="5">Waktu tidak valid.</td></tr>`;
        return;
    }
    
    const startFilter = startDate.toISOString();
    const endFilter = endDate.toISOString();
    
    try {
        const { data: telemetryData, error } = await supabase
            .from(TELEMETRY_TABLE)
            .select(`machine_id, ea_total, timestamp`)
            .eq('machine_id', machineId)
            .gte('timestamp', startFilter)
            .lte('timestamp', endFilter)
            .order('timestamp', { ascending: true });
        
        if (error) throw error;
        
        if (telemetryData.length < 2) {
            tbody.innerHTML = `<tr><td colspan="5">Hanya ditemukan ${telemetryData.length} pembacaan untuk ${machineId} dalam periode tersebut. Minimal butuh 2 log.</td></tr>`;
            return;
        }

        const costSummary = calculateConsumptionByPeriod(telemetryData, activeRate);
        
        if (Object.keys(costSummary).length === 0) {
             tbody.innerHTML = `<tr><td colspan="5">Data ditemukan, tetapi tidak cukup log untuk menghitung selisih konsumsi.</td></tr>`;
             return;
        }
        
        displayCostData(costSummary);

    } catch (error) {
        console.error("Gagal menghitung biaya:", error);
        tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}. Cek Policy RLS SELECT.</td></tr>`;
    }
}

// Fungsi Kunci: Menghitung Konsumsi & Biaya
function calculateConsumptionByPeriod(telemetryData, ratePerKwh) {
    const machineLogs = {};
    // Group logs by machine_id
    telemetryData.forEach(record => {
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

        if (logs.length < 2) continue;

        const startLog = logs[0];
        const endLog = logs[logs.length - 1];

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

// Fungsi Display
function displayCostData(costSummary) {
    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = '';

    const formatRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const formatKwh = (value) => value.toLocaleString('id-ID', { minimumFractionDigits: 2 });

    for (const machineId in costSummary) {
        const data = costSummary[machineId];
        
        const row = tbody.insertRow();
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = formatKwh(data.kwhConsumed);
        row.insertCell().textContent = data.startTime.toLocaleString('id-ID');
        row.insertCell().textContent = data.endTime.toLocaleString('id-ID');
        row.insertCell().textContent = formatRupiah(data.totalCost);
    }
}

// Fungsi Update Tarif (HARDCODED ADMIN/AUDIT)
async function updateTariff() {
    const newRate = document.getElementById('newRate').value;
    
    if (newRate === "" || isNaN(newRate) || parseFloat(newRate) <= 0) {
        alert("Mohon masukkan nilai tarif yang valid (angka positif).");
        return;
    }
    
    const activeTariffId = 1; // Asumsi ID tarif aktif selalu 1

    const payload = {
        rate_per_kwh: parseFloat(newRate),
        // Hardcode Audit Trail (karena tidak ada login)
        updated_by_name: 'System Admin', 
        updated_by_division: 'IT',
        updated_at: new Date().toISOString()
    };
    
    try {
        const { error } = await supabase
            .from(TARIFF_TABLE)
            .update(payload)
            .eq('id', activeTariffId);

        if (error) throw error;

        alert(`✅ Tarif berhasil diperbarui menjadi Rp ${newRate}! Dicatat oleh System Admin.`);
        setupTariffData(); 
    } catch (error) {
        console.error("Error update tarif:", error);
        alert(`❌ Gagal memperbarui tarif: ${error.message}. Pastikan Policy RLS UPDATE sudah diatur!`);
    }
}

window.fetchAndCalculateCost = fetchAndCalculateCost;
window.updateTariff = updateTariff;
