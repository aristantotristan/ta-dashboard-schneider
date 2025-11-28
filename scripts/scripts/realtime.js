// =======================================================
// scripts/realtime.js
// Logika Koneksi MQTT dan Tampilan Realtime (18 Mesin Standby)
// =======================================================

// --- FUNGSI MQTT ---
const mqttClient = (() => {
    const options = {
        username: "web_dashboard",
        password: "Tristan12",
        connectTimeout: 4000,
        reconnectPeriod: 2000,
    };
    let client = null;

    const handleMessage = (topic, message) => {
        try {
            const d = JSON.parse(message.toString());
            const id = d.id;

            if (devices[id]) { // Cek apakah baris sudah ada (standby)
                const row = devices[id];
                const cells = row.cells;
                
                // Update Status (Index 1)
                cells[1].textContent = d.status.toUpperCase();
                cells[1].className = d.status === "online" ? "status-online" : "status-offline";
                
                // Update Data (Mulai dari Index 2)
                dataMap.forEach((item, index) => {
                    const cellIndex = index + 2; 
                    const value = d[item.key];
                    
                    let displayValue;
                    
                    if (d.status === "offline") {
                        displayValue = '---'; // Reset data jika offline
                    } else if (item.key === 'OpH') {
                        displayValue = formatOperatingTime(value);
                    } else {
                        displayValue = (value === 0 || value) ? value : '---';
                    }
                    
                    cells[cellIndex].textContent = displayValue;
                });
            }
        } catch (e) {
            console.error(`JSON Parsing Error for ID ${d.id || 'Unknown'}:`, e);
        }
    };

    const init = () => {
        // Inisiasi koneksi MQTT
        client = mqtt.connect(
            "wss://3367c11cb6104f8ea02e99014f2015ba.s1.eu.hivemq.cloud:8884/mqtt",
            options
        );
        client.on("connect", () => {
            document.getElementById("conn").innerHTML = "✅ MQTT Connected";
            client.subscribe("politeknik/meter/data");
        });
        client.on("error", err => {
            document.getElementById("conn").innerHTML = "❌ MQTT Error";
            console.error("MQTT Connection Error:", err);
        });
        client.on("message", handleMessage);
    };

    return { init };
})();


// --- FUNGSI TAMPILAN REALTIME ---

/**
 * Membuat dan menampilkan Tampilan Monitoring Realtime dengan 18 baris STANDBY.
 */
function createRealtimeView() {
    let html = `
    <table>
        <thead>
        <tr>
            <th class="cell-id">ID</th>
            <th>Status</th>
            <th class="col-v">V (Volt)</th>
            <th class="col-i">I1 (A)</th>
            <th class="col-i">I2 (A)</th>
            <th class="col-i">I3 (A)</th>
            <th class="col-power">P (Watt)</th>
            <th class="col-power">Q (VAR)</th>
            <th class="col-power">S (kVA)</th>
            <th class="col-pf">PF</th>
            <th class="col-pf">Hz</th>
            <th class="col-pf">OpH (Hari/Jam)</th>
            <th class="col-energy">Ea Tot (kWh)</th>
            <th class="col-energy">Er Tot (kVARh)</th>
            <th class="col-energy">Ea Part (kWh)</th>
            <th class="col-energy">Er Part (kVARh)</th>
        </tr>
        </thead>
        <tbody id="tableBodyRealtime">
        </tbody>
    </table>`;

    document.getElementById('content').innerHTML = html;
    const tableBody = document.getElementById("tableBodyRealtime");

    // LOGIKA UTAMA STANDBY: Membuat 18 Baris
    for (let id = 1; id <= MAX_SLAVE_ID; id++) {
        const row = tableBody.insertRow(); 
        devices[id] = row; // Simpan referensi ke objek global 'devices'
        
        // Sel ID
        row.insertCell().textContent = id;
        row.cells[0].className = 'cell-id';
        
        // Sel Status (STANDBY)
        const statusCell = row.insertCell();
        statusCell.textContent = 'STANDBY';
        statusCell.className = 'status-standby';
        
        // Sel Data (---)
        dataMap.forEach(item => {
            const cell = row.insertCell();
            cell.className = item.class;
            cell.textContent = '---'; 
        });
    }
}
