// --- CONFIG SUPABASE ---
const SUPABASE_URL = "https://rojhcadtqfynlqzubftx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs";

let supabaseClient;

// Fungsi helper format Rupiah
const fmtRp = (n) => (n != null && !isNaN(n)) ? 'Rp ' + Number(n).toLocaleString('id-ID') : "-";

// Init Client Supabase
function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase Initialized");
    } else {
        console.error("Supabase library not found");
    }
}

// Fungsi dipanggil saat kartu Mesin di menu Tarif diklik
function openTarif(id) {
    activeId = id; // Variable global dari main.js
    document.getElementById('tarif-mc-name').innerText = "Laporan Biaya - Mesin " + id;
    
    // Ganti Halaman
    showPage('view-tarif-detail', 'Laporan Biaya', 'nav-tarif');
    
    // Set Tanggal Default: 7 Hari Terakhir
    const d = new Date();
    document.getElementById('t-end').value = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 7);
    document.getElementById('t-start').value = d.toISOString().split('T')[0];
    
    // Ambil Data
    fetchTarifData();
}

// --- FUNGSI MODIFIKASI TARIF DISINI ---
async function fetchTarifData() {
    const tBody = document.getElementById('tarif-table-body');
    const tStart = document.getElementById('t-start').value;
    const tEnd = document.getElementById('t-end').value;

    tBody.innerHTML = "<tr><td colspan='5' style='text-align:center'>Mengambil data...</td></tr>";
    
    // 1. Query ke Supabase
    // Pastikan nama tabel 'summary_harian' sesuai database kamu
    const { data, error } = await supabaseClient
        .from('summary_harian') 
        .select('*')
        .eq('id_mesin', activeId)
        .gte('tanggal', tStart)
        .lte('tanggal', tEnd)
        .order('tanggal', {ascending: false});

    if(error) {
        console.error(error);
        tBody.innerHTML = `<tr><td colspan='5' style='text-align:center; color:red'>Error: ${error.message}</td></tr>`;
        return;
    }

    if(!data || data.length === 0) {
        tBody.innerHTML = "<tr><td colspan='5' style='text-align:center'>Tidak ada data untuk periode ini.</td></tr>";
        return;
    }

    // 2. Render HTML Tabel
    let html = "";
    data.forEach(r => {
        // Kamu bisa modifikasi perhitungan/tampilan baris di sini
        html += `<tr>
            <td>${r.tanggal}</td>
            <td style="font-weight:bold; color:#0f172a">${fmtRp(r.total_biaya_rp)}</td>
            <td>${fmt(r.total_kwh_harian, 2)}</td>
            <td>${fmt(r.total_jam_digunakan, 1)} Jam</td>
            <td>${fmt(r.total_jam_standby, 1)} Jam</td>
        </tr>`;
    });
    tBody.innerHTML = html;
}
