// pages/index.js
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import mqtt from 'mqtt';


// --- KONFIGURASI MQTT ---
const MQTT_BROKER = 'wss://3367c11cb6104f8ea02e99014f2015ba.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_TOPIC = 'politeknik/meter/data';
const MQTT_OPTIONS = {
    username: "web_dashboard",
    password: "Tristan12",
    clientId: 'webclient-' + Math.random().toString(16).substr(2, 8),
    protocol: 'wss'
};

const INITIAL_STATE = Array.from({ length: 18 }, (_, i) => ({
    id: i + 1, status: '---', V: '---', I1: '---', I2: '---', I3: '---',
    P: '---', Q: '---', S: '---', PF: '---', Hz: '---', OpH: '---',
    EaT: '---', ErT: '---', EaP: '---', ErP: '---'
}));

export default function RealtimeDashboard() {
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [meterData, setMeterData] = useState(INITIAL_STATE);

    // Fungsi untuk mengupdate state data meteran
    const updateMeterData = useCallback((newData) => {
        setMeterData(prevData => prevData.map(meter => {
            if (meter.id === newData.id) {
                // Konversi OpH di sisi client
                const formattedOpH = formatOperatingTime(newData.OpH);
                
                // Gunakan spread operator untuk merge data baru
                return { ...meter, ...newData, OpH: formattedOpH };
            }
            return meter;
        }));
    }, []);

    useEffect(() => {
        // Init MQTT Client
        const client = mqtt.connect(MQTT_BROKER, MQTT_OPTIONS);

        client.on('connect', () => {
            setConnectionStatus('✅ HiveMQ Connected. Listening for Realtime data...');
            client.subscribe(MQTT_TOPIC);
        });

        client.on('message', (topic, message) => {
            try {
                const payload = JSON.parse(message.toString());
                updateMeterData(payload);
            } catch (e) {
                console.error("JSON Parsing Error:", e);
            }
        });

        client.on('error', (err) => {
            setConnectionStatus(`❌ MQTT Error: ${err.message}`);
            client.end();
        });

        // Cleanup function
        return () => {
            if (client) client.end();
        };
    }, [updateMeterData]);

    return (
        <>
            <Head>
                <title>⚡ Realtime Monitoring (MQTT)</title>
            </Head>

            <div style={{ padding: '20px', backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh' }}>
                <h2 style={{ color: '#00FFC2', borderBottom: '2px solid #3A3A3A', paddingBottom: '10px' }}>
                    ⚡ Realtime Monitoring (18 Mesin)
                </h2>
                <p style={{ marginBottom: '25px', fontWeight: 'bold' }}>{connectionStatus}</p>

                <table style={{ borderCollapse: 'collapse', width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#2A2A2A', color: '#00FFC2', fontSize: '0.9em' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th>Status</th>
                            <th>V (Volt)</th><th>I1 (A)</th><th>I2 (A)</th><th>I3 (A)</th>
                            <th>P (Watt)</th><th>Q (VAR)</th><th>S (kVA)</th>
                            <th>PF</th><th>Hz</th><th>OpH (Hari/Jam)</th>
                            <th>Ea Tot (kWh)</th><th>Er Tot (kVARh)</th><th>Ea Part (kWh)</th><th>Er Part (kVARh)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {meterData.map(d => (
                            <tr key={d.id} style={{ backgroundColor: d.id % 2 === 0 ? '#1E1E1E' : '#151515' }}>
                                <td style={{ fontWeight: 'bold', backgroundColor: '#111827' }}>{d.id}</td>
                                <td style={{ color: d.status === 'online' ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>{d.status.toUpperCase()}</td>
                                {/* Data columns */}
                                <td>{d.V}</td><td>{d.I1}</td><td>{d.I2}</td><td>{d.I3}</td>
                                <td style={{ backgroundColor: '#0F334A', color: '#38BDF8', fontWeight: '600' }}>{d.P}</td>
                                <td style={{ backgroundColor: '#0F334A', color: '#38BDF8', fontWeight: '600' }}>{d.Q}</td>
                                <td style={{ backgroundColor: '#0F334A', color: '#38BDF8', fontWeight: '600' }}>{d.S}</td>
                                <td>{d.PF}</td><td>{d.Hz}</td><td>{d.OpH}</td>
                                <td style={{ color: '#4ADE80', fontWeight: '600' }}>{d.EaT}</td>
                                <td style={{ color: '#4ADE80', fontWeight: '600' }}>{d.ErT}</td>
                                <td style={{ color: '#4ADE80', fontWeight: '600' }}>{d.EaP}</td>
                                <td style={{ color: '#4ADE80', fontWeight: '600' }}>{d.ErP}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
