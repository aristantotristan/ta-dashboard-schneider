// pages/tarif.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { calculateCost } from '../lib/costUtils';

const END_ID = 18;

export default function TarifDashboard() {
    const [connectionStatus, setConnectionStatus] = useState('Connecting to Supabase...');
    const [tarifConfig, setTarifConfig] = useState({});
    const [meterSummaries, setMeterSummaries] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setConnectionStatus('🟡 Memuat konfigurasi tarif...');
        
        // --- 1. AMBIL KONFIGURASI TARIF ---
        const { data: tarifData, error: tarifError } = await supabase
            .from('config_tarif')
            .select('*')
            .limit(1);

        if (tarifError || !tarifData || tarifData.length === 0) {
            setConnectionStatus(`❌ Gagal memuat Tarif: ${tarifError?.message || 'Data kosong'}.`);
            return;
        } 
        
        const config = tarifData[0];
        setTarifConfig(config);
        
        // --- 2. QUERY RINGKASAN DATA METERAN ---
        setConnectionStatus('🟡 Mengambil ringkasan data 18 meteran...');
        
        const summaries = [];
        
        for (let id = 1; id <= END_ID; id++) {
            // Ambil 2 record TERBARU untuk menghitung selisih (konsumsi)
            const { data: meterData, error: meterError } = await supabase
                .from('meter_data')
                .select('eap, erp')
                .eq('id', id)
                .order('timestamp', { ascending: false })
                .limit(2);

            let summary = { eaTotal: 0, erTotal: 0, records: 0 };
            
            if (meterError) {
                console.error(`Error fetching data for ID ${id}:`, meterError);
            }

            if (meterData && meterData.length >= 1) {
                summary.records = meterData.length;
                
                if (meterData.length >= 2) {
                     // Konsumsi = Data Terbaru - Data Lama (Selisih)
                     summary.eaTotal = Math.max(0, meterData[0].eap - meterData[1].eap);
                     summary.erTotal = Math.max(0, meterData[0].erp - meterData[1].erp);
                } else {
                     // Hanya ada 1 record, tampilkan nilai 0
                     summary.eaTotal = 0;
                     summary.erTotal = 0;
                }
            }
            
            // Hitung biaya
            const costResult = calculateCost(summary.eaTotal, summary.erTotal, config, new Date().getHours());
            
            summaries.push({ id, ...summary, ...costResult });
        }
        
        setMeterSummaries(summaries);
        setConnectionStatus('✅ Data Historis Selesai Dimuat.');
    };

    const formatRupiah = (amount) => `Rp ${amount ? amount.toLocaleString('id-ID') : '---'}`;
    const formatKWH = (amount) => amount ? amount.toFixed(3) : '---';

    return (
        <>
            <Head>
                <title>💰 Monitoring Tarif (Supabase)</title>
            </Head>

            <div style={{ padding: '20px', backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh' }}>
                <h2 style={{ color: '#FFD700', borderBottom: '2px solid #FFD700', paddingBottom: '10px' }}>
                    💰 Monitoring Biaya & Tarif (Konsumsi Terakhir)
                </h2>
                <p style={{ fontWeight: 'bold' }}>{connectionStatus}</p>

                <div className="status-box" style={{ background: '#2A2A2A', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3>Konfigurasi Tarif Aktif:</h3>
                    <p>
                        LWBP (Rp/kWh): <span style={{ color: '#00FFC2', fontWeight: 'bold' }}>{formatRupiah(tarifConfig.rate_lwbp)}</span> | 
                        WBP (Rp/kWh): <span style={{ color: '#00FFC2', fontWeight: 'bold' }}>{formatRupiah(tarifConfig.rate_wbp)}</span> | 
                        Denda Reaktif (Rp/kVARh): <span style={{ color: '#00FFC2', fontWeight: 'bold' }}>{formatRupiah(tarifConfig.rate_reaktif)}</span>
                    </p>
                    <p style={{ color: '#FFD700' }}>* Perhitungan biaya didasarkan pada selisih 2 data terakhir di Supabase.</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', maxWidth: '1200px', margin: '0 auto' }} id="meter-container">
                    {meterSummaries.length === 0 && <p>Loading meter summaries...</p>}
                    
                    {meterSummaries.map(summary => (
                        <div key={summary.id} className="meter-card" style={{ flex: '1 1 calc(33.33% - 20px)', minWidth: '350px', background: '#1E1E1E', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
                            <div className="card-header" style={{ background: '#111827', padding: '10px', fontSize: '1.2em', fontWeight: 'bold', color: '#B0B0B0' }}>
                                Meter ID {summary.id}
                            </div>
                            <div className="card-body" style={{ padding: '15px' }}>
                                
                                {summary.records < 2 && summary.records > 0 && 
                                    <p style={{ color: '#FFC200', fontSize: '0.9em' }}>* Hanya {summary.records} record, menunggu data berikutnya untuk hitung selisih.</p>
                                }

                                <table className="tarif-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr><td>Energi Aktif (Konsumsi)</td><td style={{ color: '#4ADE80' }}>{formatKWH(summary.eaTotal)}</td><td>kWh</td></tr>
                                        <tr><td>Energi Reaktif (Konsumsi)</td><td style={{ color: '#4ADE80' }}>{formatKWH(summary.erTotal)}</td><td>kVARh</td></tr>
                                        <tr><td colSpan="3" style={{ height: '10px', background: 'transparent' }}></td></tr>
                                        <tr><td>Tarif Saat Ini (Est.)</td><td style={{ color: '#38BDF8' }}>{summary.tarif_mode}</td><td></td></tr>
                                        <tr><td>Biaya Energi Aktif (Est.)</td><td style={{ color: '#38BDF8' }}>{formatRupiah(summary.cost_aktif)}</td><td></td></tr>
                                        <tr><td>Biaya Denda Reaktif</td><td style={{ color: '#38BDF8' }}>{formatRupiah(summary.cost_reaktif)}</td><td></td></tr>
                                        <tr className="total-row" style={{ background: '#0F334A', color: 'white', fontSize: '1.2em' }}>
                                            <td>TOTAL BIAYA KONSUMSI</td>
                                            <td colSpan="2">{formatRupiah(summary.total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
