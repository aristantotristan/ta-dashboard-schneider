// =======================================================
// control_script.js: LOGIC LOG DOWNTIME
// =======================================================
// Kredensial di-load dari config.js
const DOWNTIME_TABLE = 'connection_downtime_log';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi utama untuk mengambil data downtime
async function fetchDowntimeLog() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    const tbody = document.querySelector('#downtime-table tbody');
    tbody.innerHTML = `<tr><td colspan="5">Mencari log downtime...</td></tr>`;

    if (!startDate || !endDate) {
        alert("Mohon lengkapi rentang tanggal.");
        tbody.innerHTML = `<tr><td colspan="5">Pilih rentang tanggal.</td></tr>`;
        return;
    }

    // Filter berdasarkan waktu mulai (start_time)
    try {
        const { data, error } = await supabase
            .from(DOWNTIME_TABLE)
            .select('*')
            .gte('start_time', `${startDate}T00:00:00.000Z`)
            .lte('start_time', `${endDate}T23:59:59.999Z`)
            .order('start_time', { ascending: false });

        if (error) throw error;

        displayLogTable(data);

    } catch (error) {
        console.error("Gagal mengambil log downtime:", error);
        tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}. Cek Policy RLS SELECT.</td></tr>`;
    }
}

// Fungsi display hasil
function displayLogTable(data) {
    const tbody = document.querySelector('#downtime-table tbody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Tidak ada log downtime ditemukan dalam periode tersebut.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        
        // Hitung Durasi dalam Menit
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));

        const row = tbody.insertRow();
        row.insertCell().textContent = item.machine_id;
        row.insertCell().textContent = start.toLocaleString('id-ID');
        row.insertCell().textContent = end.toLocaleString('id-ID');
        row.insertCell().textContent = durationMinutes;
        row.insertCell().textContent = item.description || 'Gangguan Koneksi Jaringan';
    });
}

window.fetchDowntimeLog = fetchDowntimeLog;
