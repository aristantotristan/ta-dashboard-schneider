// =======================================================
// scripts/tarif.js
// Logika Tampilan Tarif dan Integrasi Supabase API
// =======================================================

/**
 * Membuat dan menampilkan Tampilan Monitoring Tarif.
 */
function createTarifView() {
    let optionsHtml = '';
    for (let id = 1; id <= MAX_SLAVE_ID; id++) {
        optionsHtml += `<option value="${id}">Mesin ID ${id}</option>`;
    }
    
    // Tampilan Form
    let html = `
    <div class="tarif-form">
        <h3>Filter Data Tarif (Historis)</h3>
        <p style="color: #94A3B8;">Menggunakan Supabase API untuk menampilkan laporan. Pastikan SUPABASE_URL di main.js sudah benar.</p>
        
        <label for="machineId">Pilih Mesin (ID)</label>
        <select id="machineId">
            ${optionsHtml}
        </select>

        <label for="period">Pilih Periode Analisis</label>
        <select id="period">
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
        </select>
        
        <label for="startDate">Tanggal Mulai Referensi</label>
        <input type="date" id="startDate">

        <button onclick="fetchTarifData()">Tampilkan Data</button>

        <div id="tarifResult" style="margin-top: 30px; border-top: 1px solid #3A3A3A; padding-top: 20px;">
            </div>
    </div>`;

    document.getElementById('content').innerHTML = html;
}

/**
 * Mengambil dan menampilkan data tarif dari Supabase berdasarkan filter.
 */
async function fetchTarifData() {
    const id = document.getElementById('machineId').value;
    const period = document.getElementById('period').value;
    const date = document.getElementById('startDate').value;
    const resultDiv = document.getElementById('tarifResult');
    
    if (!date) {
        resultDiv.innerHTML = '<p style="color: #EF4444;">Harap pilih Tanggal Referensi.</p>';
        return;
    }
    
    resultDiv.innerHTML = '<p style="color: #38BDF8;">Mengambil data dari Supabase...</p>';

    try {
        let dateFrom, dateTo;
        // Logika penentuan rentang tanggal (Sama seperti sebelumnya)
        const refDate = new Date(date);
        
        if (period === 'daily') {
            dateFrom = new Date(date).toISOString().split('T')[0];
            dateTo = dateFrom; 
        } else if (period === 'weekly') {
            const startOfWeek = new Date(refDate);
            startOfWeek.setDate(refDate.getDate() - refDate.getDay()); 
            dateFrom = startOfWeek.toISOString().split('T')[0];
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            dateTo = endOfWeek.toISOString().split('T')[0];
        } else if (period === 'monthly') {
            const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
            dateFrom = startOfMonth.toISOString().split('T')[0];
            const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
            dateTo = endOfMonth.toISOString().split('T')[0];
        }

        // --- PANGGILAN API SUPABASE ---
        const { data, error } = await supabase
            .from('daily_meter_summary') // NAMA TABEL SUPABASE ANDA
            .select('*')
            .eq('meter_id', id)
            .gte('date_key', dateFrom)
            .lte('date_key', dateTo)
            .order('date_key', { ascending: true });

        if (error) throw error;

        // --- TAMPILKAN HASIL ---
        if (data && data.length > 0) {
            let totalKwh = data.reduce((sum, item) => sum + parseFloat(item.total_energy_kwh), 0);
            let totalOpH = data.reduce((sum, item) => sum + parseFloat(item.total_oph_hours), 0);
            
            let htmlResult = `
                <h4 style="color: #4ADE80;">Laporan Tarif Mesin ID ${id}</h4>
                <p>Periode ${period.toUpperCase()}: ${dateFrom} s/d ${dateTo}</p>
                <hr style="border-color: #3A3A3A;">
                <p>Total Energi Konsumsi (${period.toUpperCase()}): <b>${totalKwh.toFixed(2)} kWh</b></p>
                <p>Total Jam Operasi (${period.toUpperCase()}): <b>${totalOpH.toFixed(1)} Jam</b></p>
                
                <h5 style="margin-top: 20px;">Detail Harian:</h5>
                <ul style="list-style-type: none; padding: 0;">
                    ${data.map(item => `
                        <li>🗓️ ${item.date_key}: ${item.total_energy_kwh} kWh / ${item.total_oph_hours} OpH</li>
                    `).join('')}
                </ul>
            `;
            resultDiv.innerHTML = htmlResult;
            
        } else {
            resultDiv.innerHTML = `<p style="color: #F59E0B;">Tidak ada data historis ditemukan untuk Mesin ID ${id} pada periode tersebut.</p>`;
        }

    } catch (e) {
        console.error("Error fetching data from Supabase:", e);
        resultDiv.innerHTML = `<p style="color: #EF4444;">Gagal mengambil data: ${e.message || 'Cek konfigurasi Supabase.'}</p>`;
    }
}
