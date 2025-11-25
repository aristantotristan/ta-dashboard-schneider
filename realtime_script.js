// =======================================================
// realtime_script.js: KLIEN MQTT UNTUK BROWSER
// =======================================================

const MQTT_BROKER = "broker.hivemq.com";
const MQTT_PORT = 8000; // Port standar Websocket MQTT
const MQTT_TOPIC = "schneider/mesin01/telemetry";
const CLIENT_ID = "WebApp-Subscriber-" + parseInt(Math.random() * 100000); // ID unik

let client = null;

// Definisikan Parameter (Pastikan sama dengan payload ESP32)
const ALL_PARAMETERS_DEFINITION = {
    'Voltage (L-L Avg)': { col: 'voltage_avg', unit: 'Volt', isCore: true, precision: 1 },
    'Current (I1)': { col: 'current_i1', unit: 'Ampere', isCore: true, precision: 1 },
    'Power (P Total/kW)': { col: 'power_p', unit: 'kW', isCore: true, precision: 1 },
    'Power Factor (Total)': { col: 'pf_total', unit: '-', isCore: true, precision: 3 },
};

// ... (Sisa fungsi rendering renderCoreParameters dan renderAllParameters harus ada di sini) ...

// --- 1. Fungsi Koneksi MQTT ---
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

// --- 2. Fungsi Penerima Pesan (Updater) ---
function onMessageArrived(message) {
    document.getElementById('lastUpdateTimestamp').textContent = new Date().toLocaleTimeString('id-ID');
    
    try {
        const data = JSON.parse(message.payloadString);
        
        // Panggil fungsi rendering 
        // Anda harus mengintegrasikan fungsi renderCoreParameters(data) dan renderAllParameters(data) 
        // dari kode sebelumnya di sini.
        // renderCoreParameters(data); 
        // renderAllParameters(data);

    } catch (e) {
        console.error("Gagal parsing JSON dari MQTT:", e);
    }
}


// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', initMQTT);
