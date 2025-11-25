// realtime_script.js (Logic MQTT Direct)

const MQTT_BROKER = "broker.hivemq.com";
const MQTT_PORT = 8000; // Port standar Websocket MQTT
const MQTT_TOPIC = "schneider/mesin01/telemetry"; // Topik yang sama dengan ESP32
const CLIENT_ID = "WebApp-Subscriber-" + parseInt(Math.random() * 1000);

// Global Paho Client
let client = null;

// Definisikan Semua Parameter (Disini Anda harus mendefinisikan 14 parameter Anda)
const ALL_PARAMETERS_DEFINITION = { /* ... (Definisi 14 parameter) ... */ };
const MAX_VALUES = { 'voltage_avg': 400, 'current_i1': 100, 'power_p': 50, 'pf_total': 1.0, };


// --- 1. FUNGSI KONEKSI MQTT ---
function initMQTT() {
    client = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, "/mqtt", CLIENT_ID);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({
        onSuccess: onConnect,
        onFailure: onFailure,
        cleanSession: true,
        useSSL: false, 
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
    if (responseObject.reconnect) {
        // Paho client akan mencoba reconnect secara default
    } else {
        setTimeout(initMQTT, 5000); 
    }
}

function onConnect() {
    document.getElementById('mqttStatus').textContent = 'Koneksi BERHASIL!';
    document.getElementById('mqttStatus').style.color = 'green';
    client.subscribe(MQTT_TOPIC);
}

// --- 2. FUNGSI PENERIMA PESAN ---
function onMessageArrived(message) {
    document.getElementById('lastUpdateTimestamp').textContent = new Date().toLocaleTimeString('id-ID');
    
    try {
        const data = JSON.parse(message.payloadString);
        
        // Panggil fungsi rendering 
        // Contoh: renderCoreParameters(data);
        // Contoh: renderAllParameters(data);

    } catch (e) {
        console.error("Gagal parsing JSON dari MQTT:", e);
    }
}

// Tambahkan Fungsi Rendering Anda (renderCoreParameters, renderAllParameters) di sini...

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', initMQTT);
