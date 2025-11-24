// =======================================================
// KODE LENGKAP trouble_fetch.js YANG SUDAH DI-FIX FILTER
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const TABLE_NAME = 'machine_daily_status';

// Fungsi utama untuk mengambil data trouble
async function fetchTroubleData() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const tbody = document.querySelector('#troubleTable tbody');
    
    tbody.innerHTML = `<tr><td colspan="6">Mencari log trouble...</td></tr>`;

    if (!startDateInput || !endDateInput) {
        alert("Mohon pilih Tanggal Mulai dan Tanggal Akhir.");
        tbody.innerHTML = `<tr><td colspan="6">Pilih tanggal dan tekan 'Cek Trouble' untuk melihat laporan.</td></tr>`;
        return;
    }

    // --- Logika Penentuan Filter Waktu (Sama seperti di Tarif) ---
    const startDate = new Date(startDateInput);
    startDate.setHours(0, 0, 0, 0); 
    const endDate = new Date(endDateInput);
    endDate.setHours(23, 59, 59, 999); 
    
    if (startDate.getTime() >= endDate.getTime()) {
        alert("Tanggal Mulai harus lebih awal dari Tanggal Akhir.");
        tbody.innerHTML = `<tr><td colspan="6">Tanggal tidak valid.</td></tr>`;
        return;
    }

    const startFilter = startDate.toISOString();
    const endFilter = endDate.toISOString();

    // Tampilkan rentang tanggal yang dipilih di UI
    document.getElementById('dateRangeDisplay').textContent = 
        `Periode: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    
    // URL API Supabase untuk mengambil log dalam rentang tanggal
    // Kita filter berdasarkan kolom 'report_date'
    const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&report_date=gte.${startDateInput}&report_date=lte.${endDateInput}&order=report_date.asc`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Cek RLS Policy.`);
        }

        const data = await response.json();
        
        if (data.length === 0) {
             tbody.innerHTML = `<tr><td colspan="6">Tidak ada log trouble yang tercatat dalam periode ini.</td></tr>`;
             return;
        }

        // Olah data
        const summary = groupDataByMachine(data);
        displayData(summary);
        
    } catch (error) {
        console.error("Gagal mengambil data trouble:", error);
        tbody.innerHTML = `<tr><td colspan='6'>Error: ${error.message}.</td></tr>`;
    }
}

// Fungsi untuk menampilkan data ke tabel HTML
function displayData(summary) {
    const tbody = document.querySelector('#troubleTable tbody');
    tbody.innerHTML = '';
    
    for (const machineId in summary) {
        const row = tbody.insertRow();
        const machineData = summary[machineId];
        
        // Logika warna untuk baris trouble
        if (machineData.daysOff > 0) {
            row.style.backgroundColor = '#f8d7da'; // Merah muda
        }
        
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = machineData.daysOn;
        row.insertCell().textContent = machineData.daysOff;
        row.insertCell().textContent = machineData.totalTroubleCount;
        
        // Menampilkan tanggal-tanggal trouble (BARU)
        row.insertCell().textContent = machineData.troubleDates.join(', '); 
        
        // Menampilkan penyebab utama (yang paling sering terjadi)
        row.insertCell().textContent = machineData.majorTrouble || 'N/A';
    }
}

// Fungsi pembantu: Mengelompokkan data harian menjadi ringkasan per mesin
function groupDataByMachine(data) {
    const summary = {};
    const troubleTypeCount = {}; // Untuk menentukan penyebab utama

    data.forEach(record => {
        const machineId = record.machine_id;
        
        if (!summary[machineId]) {
            summary[machineId] = {
                daysOn: 0,
                daysOff: 0,
                totalTroubleCount: 0,
                troubleDates: [], // Menyimpan tanggal trouble
                troubleTypes: {}, // Menghitung jenis trouble
                majorTrouble: null,
            };
            troubleTypeCount[machineId] = {};
        }
        
        // Menghitung Hari ON/OFF
        if (record.is_operational) {
            summary[machineId].daysOn++;
        } else {
            summary[machineId].daysOff++;
            summary[machineId].totalTroubleCount += record.trouble_count;
            
            // Catat Tanggal Trouble
            summary[machineId].troubleDates.push(record.report_date.split('T')[0]); 

            // Hitung Jenis Trouble
            if (record.trouble_type) {
                const type = record.trouble_type;
                troubleTypeCount[machineId][type] = (troubleTypeCount[machineId][type] || 0) + 1;
            }
        }
    });

    // 2. Tentukan Penyebab Utama (Major Trouble)
    for (const machineId in summary) {
        let maxCount = 0;
        let majorType = null;
        for (const type in troubleTypeCount[machineId]) {
            if (troubleTypeCount[machineId][type] > maxCount) {
                maxCount = troubleTypeCount[machineId][type];
                majorType = type;
            }
        }
        summary[machineId].majorTrouble = majorType;
    }

    return summary;
}

// Panggil fungsi saat halaman dimuat (untuk inisialisasi, meskipun tabel kosong)
document.addEventListener('DOMContentLoaded', () => {
    // Set tanggal default untuk kemudahan testing (opsional)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = today;
    // document.getElementById('startDate').value = '2025-11-16'; // Contoh tanggal dummy

    // Tidak perlu langsung fetch, tunggu user input
});
