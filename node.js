// Import Supabase Client
const { createClient } = require('@supabase/supabase-js');

// --- KONFIGURASI SUPABASE ---
// Kredensial kamu:
const SUPABASE_URL = 'https://rojhcadtqfynlqzubftx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvamhjYWR0cWZ5bmxxenViZnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzYzNTksImV4cCI6MjA3NzcxMjM1OX0.XZElBWD-QdS8XVKex92VKUAlifC6BXqe3kGYPmZ1Mcs';

// Inisialisasi Klien Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const payload = req.body;
    let dataToInsert = [];

    // Jika HiveMQ mengirim single JSON object (ASUMSI TERMUDAH)
    if (payload && payload.id) {
        // Konversi key JSON ke huruf kecil agar sesuai dengan Supabase
        const lowerCaseData = {};
        for (const key in payload) {
            lowerCaseData[key.toLowerCase()] = payload[key];
        }
        dataToInsert.push(lowerCaseData);
    } 

    if (dataToInsert.length === 0) {
        return res.status(400).json({ error: 'No valid data found in payload.' });
    }

    // --- 3. Insert Data ke Supabase ---
    const { data, error } = await supabase
        .from('meter_data')
        .insert(dataToInsert);

    // --- 4. Kirim Respon ---
    if (error) {
        console.error('Supabase Insert Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Gagal menyimpan data ke Supabase.', 
            details: error.message 
        });
    }

    return res.status(200).json({ 
        success: true, 
        message: `${dataToInsert.length} data berhasil disimpan.`,
        data: data 
    });
};
