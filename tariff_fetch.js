// =======================================================
// !!! GANTI DENGAN KREDENSIAL SUPABASE ANDA !!!
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
// =======================================================

const TARIFF_TABLE = 'tariff_settings';
const TELEMETRY_TABLE = 'machine_telemetry';

// Fungsi utama untuk mengambil data
async function fetchTariffData() {
    // 1. Hitung tanggal 7 hari yang lalu
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString();

    // 2. Ambil Tarif Aktif
    const tariffUrl = `${SUPABASE_URL}/rest/v1/${TARIFF_TABLE}?select=rate_per_kwh,tariff_name,updated_by_name,updated_by_division,updated_at&is_active=eq.true`;
    
    // 3. Ambil data telemetri yang lebih lengkap (timestamp, ea_total) dari 7 hari terakhir
    const telemetryUrl = `${SUPABASE_URL}/rest/v1/${TELEMETRY_TABLE}?select=machine_id,ea_total,timestamp&timestamp=gte.${dateFilter}&order=timestamp.desc`; 

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

        // Tampilkan tarif & audit
        document.getElementById('currentTariffName').textContent = activeName;
        document.getElementById('currentTariffRate').textContent = `Rp ${activeRate.toLocaleString('id-ID', { minimumFractionDigits: 2 })}`;
        if (tariffData.length > 0) {
            document.getElementById('updaterName').textContent = tariffData[0].updated_by_name || 'System';
            document.getElementById('updaterDivision').textContent = tariffData[0].updated_by_division || 'IT';
            document.getElementById('updaterTime').textContent = new Date(tariffData[0].updated_at).toLocaleString('id-ID');
        }

        // --- Proses Kalkulasi Biaya Harian & Mingguan ---
        const costSummary = calculateDailyAndWeeklyCosts(telemetryData, activeRate);
        displayCostData(costSummary, activeRate);
        
    } catch (error) {
        console.error("Gagal mengambil data tarif:", error);
        document.getElementById('tariffTable').innerHTML = `<tr><td colspan='6'>Error: ${error.message} (Cek RLS Policy atau pastikan ada data 7 hari terakhir).</td></tr>`;
    }
}

// Fungsi BARU: Menghitung Biaya Harian dan Mingguan dari data historis
function calculateDailyAndWeeklyCosts(telemetryData, ratePerKwh) {
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    const machineData = {}; // Simpan data historis per mesin

    // 1. Kelompokkan data per machine_id
    telemetryData.forEach(record => {
        const machineId = record.machine_id;
        const timestamp = new Date(record.timestamp).getTime();
        const eaTotal = parseFloat(record.ea_total) || 0;

        if (!machineData[machineId]) {
            machineData[machineId] = [];
        }
        machineData[machineId].push({ timestamp, eaTotal });
    });

    const results = {};

    for (const machineId in machineData) {
        // Urutkan data secara ASCENDING (terlama ke terbaru)
        const sortedData = machineData[machineId].sort((a, b) => a.timestamp - b.timestamp);
        
        // Data pembacaan terakhir
        const latestReading = sortedData[sortedData.length - 1]; 
        
        let kwhDaily = 0;
        let kwhWeekly = 0;

        // 2. Cari pembacaan terdekat 24 jam yang lalu
        // Cari pembacaan yang paling baru dari 24 jam yang lalu
        const reading24hAgo = sortedData.filter(d => d.timestamp <= now - oneDayMs).pop(); 

        if (reading24hAgo) {
            kwhDaily = latestReading.eaTotal - reading24hAgo.eaTotal;
        } else if (sortedData.length > 1) {
             // Jika data kurang dari 24 jam, gunakan total konsumsi (optional, bisa juga 0)
             kwhDaily = latestReading.eaTotal - sortedData[0].eaTotal;
        }

        // 3. Cari pembacaan terdekat 7 hari yang lalu
        // Cari pembacaan yang paling baru dari 7 hari yang lalu
        const reading7dAgo = sortedData.filter(d => d.timestamp <= now - sevenDaysMs).pop();

        if (reading7dAgo) {
            kwhWeekly = latestReading.eaTotal - reading7dAgo.eaTotal;
        } else if (sortedData.length > 1) {
             // Jika data kurang dari 7 hari, gunakan total konsumsi (optional, bisa juga 0)
             kwhWeekly = latestReading.eaTotal - sortedData[0].eaTotal;
        }


        results[machineId] = {
            kwhTotal: latestReading.eaTotal,
            // Pastikan konsumsi tidak negatif (jika ada reset meter)
            costDaily: Math.max(0, kwhDaily) * ratePerKwh, 
            costWeekly: Math.max(0, kwhWeekly) * ratePerKwh,
            costOverall: latestReading.eaTotal * ratePerKwh
        };
    }
    return results;
}

// Fungsi displayCostData diubah untuk menerima data kalkulasi baru
function displayCostData(costSummary, ratePerKwh) {
    const tbody = document.querySelector('#tariffTable tbody');
    tbody.innerHTML = '';

    if (Object.keys(costSummary).length === 0) {
        tbody.innerHTML = `<tr><td colspan='6'>Tidak ada data konsumsi energi 7 hari terakhir untuk perhitungan harian/mingguan.</td></tr>`;
        return;
    }

    for (const machineId in costSummary) {
        const data = costSummary[machineId];
        
        const formatRupiah = (value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });

        const row = tbody.insertRow();
        row.insertCell().textContent = machineId;
        row.insertCell().textContent = data.kwhTotal.toFixed(2);
        row.insertCell().textContent = ratePerKwh.toLocaleString('id-ID');
        
        // Kolom Baru
        row.insertCell().textContent = formatRupiah(data.costDaily); 
        row.insertCell().textContent = formatRupiah(data.costWeekly); 
        
        row.insertCell().textContent = formatRupiah(data.costOverall);
    }
}

// Fungsi updateTariff (Tidak berubah, hanya memastikan prompt audit)
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
