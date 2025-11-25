// trouble_fetch.js (Logic Trouble & Log Harian)

const TABLE_NAME = 'machine_daily_status';
const TELEMETRY_TABLE = 'realtime_telemetry'; // Untuk mengambil daftar mesin

document.addEventListener('DOMContentLoaded', fetchMachineListForTrouble);

// ... (Fungsi fetchMachineListForTrouble dan displayTroubleTable seperti kode sebelumnya) ...

window.fetchTroubleData = fetchTroubleData;
