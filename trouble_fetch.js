// Konfigurasi Supabase Anda
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const TABLE_NAME = 'machine_daily_status';

// Fungsi untuk mengambil data dari Supabase
async function fetchTroubleData() {
    // 1. Definisikan URL API Supabase untuk tabel yang diinginkan
    // Parameter 'select=*' berarti ambil semua kolom.
    const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=report_date.desc`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // Header wajib untuk otorisasi Supabase
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // 2. Olah dan tampilkan data
        displayData(data);
        
    } catch (error) {
        console.error("Gagal mengambil data trouble:", error);
        document.getElementById('troubleTable').innerHTML = "<tr><td colspan='5'>Error saat memuat data. Lihat console.</td></tr>";
    }
}

// Fungsi untuk menampilkan data ke tabel HTML
function displayData(data) {
    const tbody = document.querySelector('#troubleTable tbody');
    tbody.innerHTML = ''; // Kosongkan tabel sebelumnya
    
    // Kita akan mengelompokkan data per mesin untuk laporan ringkasan 7 hari (seperti di wireframe)
    const summary = groupDataByMachine(data);

    for (const machineId in summary) {
        const row = tbody.insertRow();
        const machineData = summary[machineId];
        
        // Asumsi: data adalah 7 hari terakhir, atau Anda bisa menghitung berdasarkan tanggal
        
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = machineData.daysOn;
        row.insertCell().textContent = machineData.daysOff;
        row.insertCell().textContent = machineData.totalTroubleCount;
        row.insertCell().textContent = machineData.latestTrouble || 'N/A';
    }
}

// Fungsi pembantu: Mengelompokkan data harian menjadi ringkasan per mesin
function groupDataByMachine(data) {
    const summary = {};
    const maxDays = 7; // Batas analisis 7 hari
    
    data.forEach(record => {
        // Hanya proses record 7 hari terakhir (logika tanggal harus disempurnakan di produksi)
        
        if (!summary[record.machine_id]) {
            summary[record.machine_id] = {
                daysOn: 0,
                daysOff: 0,
                totalTroubleCount: 0,
                latestTrouble: null,
                count: 0
            };
        }
        
        // Pastikan kita hanya menghitung data hingga 'maxDays'
        if (summary[record.machine_id].count < maxDays) {
            
            if (record.is_operational) {
                summary[record.machine_id].daysOn++;
            } else {
                summary[record.machine_id].daysOff++;
            }
            
            summary[record.machine_id].totalTroubleCount += record.trouble_count;
            
            // Catat trouble type yang terakhir (karena kita order by date desc di fetch)
            if (record.trouble_type && !summary[record.machine_id].latestTrouble) {
                summary[record.machine_id].latestTrouble = record.trouble_type;
            }
            
            summary[record.machine_id].count++;
        }
    });
    return summary;
}

// Panggil fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchTroubleData);
