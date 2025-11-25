// =======================================================
// trouble_fetch.js: LOGIC TROUBLE & LOG HARIAN
// =======================================================
// Kredensial di-load dari config.js
const TABLE_NAME = 'machine_daily_status';
const TELEMETRY_TABLE = 'machine_telemetry'; // Untuk mengambil daftar mesin

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', fetchMachineListForTrouble);

// Mengambil daftar mesin untuk filter
async function fetchMachineListForTrouble() {
    try {
        const { data, error } = await supabase
            .from(TELEMETRY_TABLE)
            .select('machine_id')
            .order('machine_id', { ascending: true })
            .limit(100); 

        if (error) throw error;

        const uniqueMachines = [...new Set(data.map(item => item.machine_id))];
        const select = document.getElementById('machine-select');

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

// Fungsi utama untuk mengambil data trouble
async function fetchTroubleData() {
    const machineId = document.getElementById('machine-select').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const tbody = document.querySelector('#trouble-table tbody');
    tbody.innerHTML = `<tr><td colspan="5">Mencari data status harian...</td></tr>`;

    if (!machineId || !startDate || !endDate) {
        alert("Mohon lengkapi Mesin ID dan rentang tanggal.");
        tbody.innerHTML = `<tr><td colspan="5">Pilih mesin dan rentang tanggal.</td></tr>`;
        return;
    }

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('machine_id', machineId)
            .gte('log_date', startDate)
            .lte('log_date', endDate)
            .order('log_date', { ascending: true });

        if (error) throw error;

        displayTroubleTable(data);

    } catch (error) {
        console.error("Gagal mengambil data trouble:", error);
        tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}. Cek Policy RLS SELECT.</td></tr>`;
    }
}

// Fungsi display hasil
function displayTroubleTable(data) {
    const tbody = document.querySelector('#trouble-table tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Tidak ada status harian ditemukan dalam periode tersebut.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const row = tbody.insertRow();
        const status = item.connection_status;
        const statusClass = status === 'ON' ? 'status-ON' : 'status-OFF';
        const keterangan = status === 'ON' ? 'Beroperasi normal' : 'Terjadi gangguan koneksi atau mesin OFF';

        row.insertCell().textContent = item.log_date;
        row.insertCell().textContent = item.machine_id;
        row.insertCell().innerHTML = `<span class="${statusClass}">${status}</span>`;
        row.insertCell().textContent = item.total_logs;
        row.insertCell().textContent = keterangan;
    });
}

window.fetchTroubleData = fetchTroubleData;
