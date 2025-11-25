// =======================================================
// realtime_script.js: LOGIC REAL-TIME
// =======================================================
// Kredensial di-load dari config.js
const REALTIME_TABLE = 'realtime_telemetry';
const MACHINE_LIST_TABLE = 'machine_telemetry';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let selectedMachineId = null;
let charts = {};

document.addEventListener('DOMContentLoaded', fetchMachineList);

// 1. Mengambil daftar mesin yang tersedia
async function fetchMachineList() {
    try {
        const { data, error } = await supabase
            .from(MACHINE_LIST_TABLE)
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
        document.getElementById('no-data-message').style.display = 'block';
    } catch (error) {
        console.error("Error fetching machine list:", error);
    }
}

// 2. Handler saat mesin dipilih
function selectMachine(machineId) {
    if (machineId) {
        selectedMachineId = machineId;
        document.getElementById('telemetry-display').style.display = 'block';
        document.getElementById('no-data-message').style.display = 'none';
        
        // Membersihkan interval lama
        if (window.realtimeInterval) {
            clearInterval(window.realtimeInterval);
        }
        
        // Memulai fetch baru setiap 5 detik
        fetchLatestTelemetry(machineId); 
        window.realtimeInterval = setInterval(() => fetchLatestTelemetry(machineId), 5000); 
    } else {
        document.getElementById('telemetry-display').style.display = 'none';
        document.getElementById('no-data-message').style.display = 'block';
        if (window.realtimeInterval) {
            clearInterval(window.realtimeInterval);
        }
    }
}

// 3. Mengambil data telemetri terbaru
async function fetchLatestTelemetry(machineId) {
    try {
        const { data, error } = await supabase
            .from(REALTIME_TABLE)
            .select('*')
            .eq('machine_id', machineId)
            .order('timestamp', { ascending: false })
            .limit(1);

        if (error) throw error;
        if (data.length === 0) {
            document.getElementById('last-update').textContent = 'Tidak ada data real-time terbaru.';
            return;
        }

        const latestData = data[0];
        document.getElementById('last-update').textContent = new Date(latestData.timestamp).toLocaleString('id-ID');
        
        renderCoreParameters(latestData);
        renderAllParameters(latestData);

    } catch (error) {
        console.error("Error fetching latest telemetry:", error);
    }
}

// 4. Rendering Gauge Charts
function renderCoreParameters(data) {
    const coreParams = [
        { id: 'gauge-voltage', label: 'Voltage (V)', key: 'v_a', max: 500, unit: 'V' },
        { id: 'gauge-current', label: 'Current (A)', key: 'i_a', max: 50, unit: 'A' },
        { id: 'gauge-power', label: 'Active Power (kW)', key: 'p_a', max: 100, unit: 'kW' },
        { id: 'gauge-frequency', label: 'Frequency (Hz)', key: 'frequency', max: 70, unit: 'Hz' }
    ];

    coreParams.forEach(p => {
        const ctx = document.getElementById(p.id).getContext('2d');
        const value = parseFloat(data[p.key]) || 0;
        
        if (charts[p.id]) {
            charts[p.id].data.datasets[0].value = value;
            charts[p.id].update();
        } else {
            charts[p.id] = new Chart(ctx, {
                type: 'gauge',
                data: {
                    datasets: [{
                        data: [value],
                        value: value,
                        backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
                        borderWidth: 0,
                        gaugeData: {
                            value: value,
                            valueColor: '#333',
                            min: 0,
                            max: p.max,
                            units: p.unit,
                            // Rentang warna (Danger, Warning, Safe)
                            label: p.label,
                            needleColor: '#333',
                            needleLength: 90,
                            data: [p.max * 0.5, p.max * 0.3, p.max * 0.2] 
                        }
                    }]
                },
                options: {
                    responsive: true,
                    layout: { padding: { bottom: 10 } },
                    events: ['resize'],
                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                }
            });
        }
    });
}

// 5. Rendering Detail Tabel
function renderAllParameters(data) {
    const tbody = document.querySelector('#detail-table tbody');
    tbody.innerHTML = '';

    const allParams = {
        'Voltage Phase B (V)': data.v_b,
        'Voltage Phase C (V)': data.v_c,
        'Current Phase B (A)': data.i_b,
        'Current Phase C (A)': data.i_c,
        'Reactive Power (kVAR)': data.q_a,
        'Apparent Power (kVA)': data.s_a,
        'Power Factor': data.pf_a,
        'Total Active Energy (kWh)': data.ea_total,
        'Total Reactive Energy (kVARh)': data.er_total,
        'Waktu Log': new Date(data.timestamp).toLocaleTimeString('id-ID')
    };

    const keys = Object.keys(allParams);
    for (let i = 0; i < keys.length; i += 2) {
        const row = tbody.insertRow();
        
        // Kolom 1
        row.insertCell().textContent = keys[i];
        row.insertCell().textContent = parseFloat(allParams[keys[i]]).toFixed(2);
        
        // Kolom 2
        if (keys[i + 1]) {
            row.insertCell().textContent = keys[i + 1];
            row.insertCell().textContent = parseFloat(allParams[keys[i + 1]]).toFixed(2);
        } else {
            row.insertCell().colSpan = 2; // Gabungkan sel jika ganjil
        }
    }
}
