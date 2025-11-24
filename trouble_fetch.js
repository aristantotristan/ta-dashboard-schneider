// =======================================================
// !!! GANTI DENGAN KREDENSIAL SUPABASE ANDA !!!
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const TABLE_NAME = 'machine_daily_status';
// =======================================================


// Fungsi untuk mengambil data dari Supabase
async function fetchTroubleData() {
    // Hitung tanggal 7 hari yang lalu untuk filter
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0]; 
    
    // 1. Definisikan URL API Supabase (Filter 7 hari terakhir)
    const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&report_date=gte.${startDate}&order=report_date.desc`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY 
            }
        });

        if (!response.ok) {
            // Ini akan menangkap jika RLS belum diatur (Status 401/403)
            throw new Error(`HTTP error! Status: ${response.status}. Cek RLS Policy di Supabase.`);
        }

        const data = await response.json();
        
        // 2. Olah dan tampilkan data
        displayData(data);
        
    } catch (error) {
        console.error("Gagal mengambil data trouble:", error);
        document.querySelector('#troubleTable tbody').innerHTML = `<tr><td colspan='5'>Error: ${error.message}.</td></tr>`;
    }
}

// Fungsi untuk menampilkan data ke tabel HTML
function displayData(data) {
    const tbody = document.querySelector('#troubleTable tbody');
    tbody.innerHTML = ''; 
    
    const summary = groupDataByMachine(data);

    // Iterasi melalui ringkasan dan tampilkan di tabel
    for (const machineId in summary) {
        const row = tbody.insertRow();
        const machineData = summary[machineId];
        
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
    
    data.forEach(record => {
        if (!summary[record.machine_id]) {
            summary[record.machine_id] = {
                daysOn: 0,
                daysOff: 0,
                totalTroubleCount: 0,
                latestTrouble: null,
            };
        }
        
        // Menghitung hari ON/OFF
        if (record.is_operational) {
            summary[record.machine_id].daysOn++;
        } else {
            summary[record.machine_id].daysOff++;
        }
        
        summary[record.machine_id].totalTroubleCount += record.trouble_count;
        
        // Catat trouble type yang terakhir (karena data diurutkan dari tanggal terbaru)
        if (record.trouble_type && !summary[record.machine_id].latestTrouble) {
            summary[record.machine_id].latestTrouble = record.trouble_type;
        }
    });
    return summary;
}

// Panggil fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchTroubleData);
