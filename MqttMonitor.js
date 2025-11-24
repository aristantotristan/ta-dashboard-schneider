// components/MqttMonitor.js
import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt'; // Library untuk komunikasi MQTT

const MqttMonitor = () => {
    // 1. STATE (Tempat Penyimpanan Data Sementara di Website)
    const [meterData, setMeterData] = useState({});
    const [status, setStatus] = useState('Connecting...');

    // Konfigurasi koneksi ke HiveMQ
    const brokerUrl = 'ws://broker.hivemq.com:8000/mqtt'; // Alamat Pusat Distribusi Berita (via WebSocket)
    const topic = 'schneider/data/meter1'; // Judul Berita yang didengarkan (harus sama dengan di ESP32)

    // 2. useEffect (Fungsi yang Berjalan Otomatis Saat Website Dibuka)
    useEffect(() => {
        // --- A. INTI KONEKSI ---
        const client = mqtt.connect(brokerUrl);

        // --- B. KETIKA KONEK ---
        client.on('connect', () => {
            setStatus('Connected');
            client.subscribe(topic); // Mulai mendengarkan topik berita
        });

        // --- C. KETIKA MENERIMA PESAN ---
        client.on('message', (topic, message) => {
            try {
                // Pesan diterima (dalam format JSON/teks), diubah menjadi data yang bisa dibaca JavaScript
                const data = JSON.parse(message.toString()); 
                setMeterData(data); // Simpan data ke STATE (Tampilan akan otomatis diperbarui!)
                setStatus('LIVE');
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                setStatus('Error Parsing Data');
            }
        });
        
        // --- D. KETIKA ADA MASALAH/PUTUS ---
        client.on('error', (err) => {
            console.error("MQTT Error:", err);
            setStatus('Connection Error');
            client.end();
        });

        // FUNGSI BERSIH-BERSIH: Memutus koneksi ketika Anda menutup halaman
        return () => client.end();
    }, []); // Array kosong berarti fungsi ini hanya berjalan sekali saat awal

    // 3. TAMPILAN (Bagian yang Terlihat di Website)
    const dataList = [
        { name: 'Tegangan Rata-Rata', key: 'voltage_avg_v', unit: 'Volt' },
        { name: 'Arus (I1)', key: 'current_i1_a', unit: 'A' },
        // ... (Semua 12 parameter lainnya di sini) ...
        { name: 'Total Energi (Ea)', key: 'e_tot_kwh', unit: 'kWh' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h2>⚡ Schneider Monitoring Dashboard</h2>
            <p>Status: <span style={{ color: status === 'LIVE' ? 'green' : 'orange', fontWeight: 'bold' }}>{status}</span></p>
            
            {/* Grid untuk menampilkan semua data */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {dataList.map((item) => (
                    <div key={item.key}>
                        <h4>{item.name}</h4>
                        <p>
                            {/* Tampilkan nilai dari data yang diterima, atau '--' jika belum ada */}
                            **{meterData[item.key] !== undefined ? meterData[item.key] : '--'}** {item.unit}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MqttMonitor;
