// tariff_fetch.js (Logic Tarif & Kalkulasi)

// Kredensial di-load dari config.js
const TARIFF_TABLE = 'tariff_settings';
const TELEMETRY_TABLE = 'realtime_telemetry'; // Menggunakan tabel real-time/telemetry utama

document.addEventListener('DOMContentLoaded', () => {
    setupTariffData();
    fetchMachineListForFilter();
});

// Mengambil daftar mesin untuk filter
async function fetchMachineListForFilter() {
    try {
        const { data, error } = await supabase
            .from(TELEMETRY_TABLE)
            .select('machine_id', { distinct: true })
            .order('machine_id', { ascending: true })
            .limit(100); 

        if (error) throw error;

        const uniqueMachines = [...new Set(data.map(item => item.machine_id))];
        const select = document.getElementById('machineId');
        select.innerHTML = '<option value="">-- Pilih Mesin --</option>';

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
    // ... (Validasi input dan logika fetch/kalkulasi seperti sebelumnya) ...
    // Note: Logika lengkap ada di balasan sebelumnya.
}

// Fungsi Update Tarif (HARDCODED AUDIT)
async function updateTariff() {
    const newRate = document.getElementById('newRate').value;
    
    // ... (Validasi input) ...
    
    const activeTariffId = 1; 

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
        alert(`❌ Gagal memperbarui tarif: ${error.message}.`);
    }
}
window.fetchAndCalculateCost = fetchAndCalculateCost;
window.updateTariff = updateTariff;
