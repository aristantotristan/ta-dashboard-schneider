// =======================================================
// realtime_script.js: LOGIC MQTT SUBSCRIBER FINAL
// =======================================================

const MQTT_BROKER = "broker.hivemq.com";
const MQTT_PORT = 8000; // Port standar Websocket MQTT
const MQTT_TOPIC = "schneider/mesin01/telemetry"; // Topik yang sama dengan ESP32
const CLIENT_ID = "WebApp-Subscriber-" + parseInt(Math.random() * 100000);

let client = null;

// Definisikan Parameter (Wajib sama persis dengan payload JSON dari ESP32)
const ALL_PARAMETERS_DEFINITION = {
    // Core Parameters (untuk Gauge)
    'Voltage (L-L Avg)': { col: 'voltage_avg', unit: 'Volt', isCore: true, precision: 1, max: 400 },
    'Current (I1)': { col: 'current_i1', unit: 'Ampere', isCore: true, precision: 1, max: 100 },
    'Power (P Total/kW)': { col: 'power_p', unit: 'kW', isCore: true, precision: 1, max: 50 },
    'Power Factor (Total)': { col: 'pf_total', unit: '-', isCore: true, precision: 3, max: 1.0 },
    
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
    'Operating Time (Jam)': { col: 'op_time', unit: 'Jam', isCore: false, precision: 2 },
};

// --- 1. FUNGSI KONEKSI MQTT ---
function initMQTT() {
    client = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, "/mqtt", CLIENT_ID);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({
        onSuccess: onConnect,
        onFailure: onFailure,
        cleanSession: true,
    });
}

function onFailure(responseObject) {
    document.getElementById('mqttStatus').textContent = 'Koneksi GAGAL: ' + responseObject.errorMessage;
    document.getElementById('mqttStatus').style.color = 'red';
    setTimeout(initMQTT, 5000); 
}

function onConnectionLost(responseObject) {
    document.getElementById('mqttStatus').textContent = 'Koneksi Hilang. Mencoba sambung ulang...';
    document.getElementById('mqttStatus').style.color = 'red';
    if (!client.isConnected()) {
        setTimeout(initMQTT, 5000);
    }
}

function onConnect() {
    document.getElementById('mqttStatus').textContent = 'Koneksi BERHASIL!';
    document.getElementById('mqttStatus').style.color = 'green';
    client.subscribe(MQTT_TOPIC);
}

// --- 2. FUNGSI PENERIMA PESAN (Updater) ---
function onMessageArrived(message) {
    document.getElementById('lastUpdateTimestamp').textContent = new Date().toLocaleTimeString('id-ID');
    
    try {
        const data = JSON.parse(message.payloadString);
        
        renderCoreParameters(data);
        renderAllParameters(data);

    } catch (e) {
        console.error("Gagal parsing JSON dari MQTT:", e);
        document.getElementById('mqttStatus').textContent = 'Error Parsing Data!';
    }
}

// --- 3. FUNGSI RENDERING (Core Parameters / Gauges) ---
function renderCoreParameters(data) {
    const container = document.getElementById('coreParameters');
    container.innerHTML = '';
    
    for (const key in ALL_PARAMETERS_DEFINITION) {
        const paramDef = ALL_PARAMETERS_DEFINITION[key];
        if (paramDef.isCore) {
            const value = data[paramDef.col] || 0;
            const maxValue = paramDef.max;

            let percentage = Math.min(100, (value / maxValue) * 100);
            
            let colorClass = 'gauge-fill';
            if (paramDef.col === 'pf_total') {
                if (value < 0.85) colorClass = 'gauge-fill danger';
                else if (value < 0.95) colorClass = 'gauge-fill warning';
            } else {
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

// --- 4. FUNGSI RENDERING (All Parameters / Tabel) ---
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


// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', initMQTT);
