// server.js
const express = require('express');
const mqtt = require('mqtt');
const app = express();
const port = 3000; // Port untuk API Bridge

// --- KONFIGURASI MQTT dari kode ESP32 ---
// HOSTING HIVEMQ CLOUD (gunakan mqtts:// untuk port 8883)
const MQTT_BROKER_URL = 'mqtts://3367c11cb6104f8ea02e99014f2015ba.s1.eu.hivemq.cloud:8883';
const MQTT_USER = 'vercel_client';
const MQTT_PASS = 'VercelPass123!';
const MQTT_TOPIC_DATA = 'politeknik/meter/data';

// Variabel untuk menyimpan data meter terakhir yang diterima
let lastMeterData = {
    id: 1,
    status: 'offline',
    // Inisialisasi parameter agar data tetap ada saat pertama kali diakses
    V: 0, I1: 0, P_W: 0, Q_VAR: 0, S_kVA: 0, PF: 0, Hz: 0, Op_H: 0,
    Ea_T: 0, Er_T: 0, Ea_P: 0, Er_P: 0 
};

// --- Koneksi ke MQTT ---
const client = mqtt.connect(MQTT_BROKER_URL, {
    username: MQTT_USER,
    password: MQTT_PASS,
    // Penting untuk koneksi ke HiveMQ Cloud dari Node.js tanpa sertifikat CA
    rejectUnauthorized: false 
});

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ Broker!');
    client.subscribe(MQTT_TOPIC_DATA, (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${MQTT_TOPIC_DATA}`);
        }
    });
});

client.on('message', (topic, message) => {
    try {
        const jsonString = message.toString();
        const data = JSON.parse(jsonString);
        
        // Simpan data terbaru
        lastMeterData = data;
        console.log(`[MQTT] Data diterima untuk ID ${data.id}. V: ${data.V}V, P: ${data.P_W}W. Status: ${data.status}`);

    } catch (e) {
        console.error('Error parsing JSON message:', e);
    }
});

client.on('error', (err) => {
    console.error('MQTT Error:', err);
});

// --- Middleware & CORS (Penting untuk diakses dari Vercel) ---
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Mengizinkan Vercel mengakses API ini
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// --- Endpoint API ---
// Endpoint yang diakses oleh index.html (Vercel)
app.get('/api/v1/meter/:id', (req, res) => {
    const meterId = parseInt(req.params.id);
    
    // Hanya menyajikan data ID 1
    if (meterId === 1) {
        // Mengirimkan data terbaru yang tersimpan
        res.json(lastMeterData);
    } else {
        res.status(404).json({ error: 'Meter ID not found or unsupported.' });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`\n---------------------------------------------------`);
    console.log(`🌐 Web server berjalan di Port: ${port}`);
    console.log(`API Endpoint data: http://[IP_PUBLIK_ANDA]:${port}/api/v1/meter/1`);
    console.log(`---------------------------------------------------`);
});
