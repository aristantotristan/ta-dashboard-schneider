// =======================================================
// realtime_script.js: LOGIKA REAL-TIME MONITORING
// =======================================================
const SUPABASE_URL = 'https://khamzxkrvmnjhrgdqbkg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoYW16eGtydm1uamhyZ2RxYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDg2MzcsImV4cCI6MjA3OTUyNDYzN30.SYZTZA3rxaE-kwFuKLlzkol_mLuwjYmVudGCN0imAM8'; 
const REALTIME_TABLE = 'realtime_telemetry';

// FIX: Inisialisasi Klien Supabase (Menggunakan window.supabase)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Definisikan Semua Parameter dan Satuan (12 Parameter Penuh)
const ALL_PARAMETERS_DEFINITION = {
    // Core Parameters (untuk Gauge dan Fokus)
    'Voltage (L-L Avg)': { col: 'voltage_avg', unit: 'Volt', isCore: true, precision: 1 },
    'Current (I1)': { col: 'current_i1', unit: 'Ampere', isCore: true, precision: 1 },
    'Power (P Total/kW)': { col: 'power_p', unit: 'kW', isCore: true, precision: 1 },
    'Power Factor (Total)': { col: 'pf_total', unit: '-', isCore: true, precision: 3 },
    
    // Non-Core Parameters (Sisanya)
    'Total Ea': { col: 'ea_total', unit: 'kWh', isCore: false, precision: 2 },
    'Total Er': { col: 'er_total', unit: 'kVARh', isCore: false, precision: 2 },
    'Partial Ea': { col: 'ea_partial', unit: 'kWh', isCore: false, precision: 2 },
    'Partial Er': { col: 'er_partial', unit: 'kVARh', isCore: false, precision: 2 },
    'Current (I2)': { col: 'current_i2', unit: 'Ampere', isCore: false, precision: 1 },
    'Current (I3)': { col: 'current_i3', unit: 'Ampere', isCore: false, precision: 1 },
    'Power (Q Total/kVAR)': { col: 'power_q', unit: 'kVAR', isCore: false, precision: 1 },
    'Power (S Total/kVA)': { col: 'power_s', unit: 'kVA', isCore: false, precision: 1 },
    'Frequency': { col: 'frequency', unit: 'Hz', isCore: false, precision: 2 },
    'Operating Time': { col: 'op_time', unit: 'Jam', isCore: false, precision: 0 },
};

// Definisikan Max Value untuk Kalkulasi Visual Gauge
const MAX_VALUES = {
    'voltage_avg': 400, // Max Volt
    'current_i1': 100,  // Max Ampere (Asumsi Kapasitas)
    'power_p': 50,      // Max kW
    'pf_total': 1.0,    // Max PF
};


// --- 1. Ambil dan Tampilkan Daftar 18 Mesin ---
async function fetchMachineList() {
    const listElement = document.getElementById('machineList');
    listElement.innerHTML = 'Memuat...';

    try {
        const { data, error } = await supabase
            .from(REALTIME_TABLE)
            .select('*')
            .order('machine_id', { ascending: true });

        if (error) throw error;
        
        listElement.innerHTML = ''; 

        data.forEach(machine => {
            const statusClass = machine.is_online ? 'online' : 'offline';
            const statusText = machine.is_online ? 'Online' : 'Offline';
            
            const item = document.createElement('div');
            item.className = 'machine-item';
            item.id = `machine-${machine.machine_id}`;
            item.innerHTML = `
                <span>${machine.machine_id}</span>
                <span><span class="status-dot ${statusClass}"></span>${statusText}</span>
            `;
            item.onclick = () => selectMachine(machine.machine_id, data); 
            listElement.appendChild(item);
        });
        
        // Coba pilih mesin pertama secara default
        if (data.length > 0) {
             selectMachine(data[0].machine_id, data);
        }

    } catch (error) {
        console.error("Gagal memuat daftar mesin:", error);
        listElement.innerHTML = `<p style="color: red;">Error: ${error.message}. Pastikan RLS Policy tabel realtime_telemetry sudah diaktifkan.</p>`;
    }
}

// --- 2. Fungsi Ketika Mesin Dipilih ---
function selectMachine(machineId, allData) {
    document.querySelectorAll('.machine-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`machine-${machineId}`).classList.add('active');

    const selectedData = allData.find(m => m.machine_id === machineId);
    if (!selectedData) return;

    document.getElementById('selectedMachineTitle').textContent = `Detail Monitoring: ${machineId}`;
    
    document.getElementById('lastUpdateTimestamp').textContent = new Date(selectedData.timestamp).toLocaleString('id-ID');

    // Render 
    renderCoreParameters(selectedData);
    renderAllParameters(selectedData);
}

// --- 3. Render Gauges (Core Parameters) ---
function renderCoreParameters(data) {
    const container = document.getElementById('coreParameters');
    container.innerHTML = '';

    for (const key in ALL_PARAMETERS_DEFINITION) {
        const paramDef = ALL_PARAMETERS_DEFINITION[key];
        
        if (paramDef.isCore) {
            const value = data[paramDef.col] || 0;
            const maxValue = MAX_VALUES[paramDef.col] || 100;
            
            // Hitung Persentase Isi Bar
            let percentage = Math.min(100, (value / maxValue) * 100);
            
            // Logika Warna Warning/Danger
            let colorClass = 'gauge-fill';
            if (paramDef.col === 'pf_total') {
                // PF Warning: Di bawah 0.85 (Danger) atau 0.95 (Warning)
                if (value < 0.85) colorClass = 'gauge-fill danger';
                else if (value < 0.95) colorClass = 'gauge-fill warning';
            } else {
                // Warning/Danger: Di atas 80% dan 95% dari Max
                if (percentage > 95) colorClass = 'gauge-fill danger'; 
                else if (percentage > 80) colorClass = 'gauge-fill warning';
            }
            
            const box = document.createElement('div');
            box.className = 'gauge-box';
            box.innerHTML = `
                <div class="gauge-label">${key}</div>
                <div class="gauge-value">${value.toFixed(paramDef.precision)} ${paramDef.unit}</div>
                <div class="gauge-visual">
                    <div class="${colorClass}" style="width: ${percentage}%;"></div>
                </div>
            `;
            container.appendChild(box);
        }
    }
}

// --- 4. Render Tabel Detail (All Parameters) ---
function renderAllParameters(data) {
    const tbody = document.querySelector('#allParametersTable tbody');
    tbody.innerHTML = '';
    
    for (const key in ALL_PARAMETERS_DEFINITION) {
        const paramDef = ALL_PARAMETERS_DEFINITION[key];
        const value = data[paramDef.col];
        
        const row = tbody.insertRow();
        row.insertCell().textContent = key;
        row.insertCell().textContent = value !== null ? value.toFixed(paramDef.precision) : 'N/A';
        row.insertCell().textContent = paramDef.unit;
    }
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', fetchMachineList);
