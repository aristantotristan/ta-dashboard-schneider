function loadRealtimeDummy() {
    const list = document.getElementById("machineList");

    for (let i = 1; i <= 18; i++) {
        const div = document.createElement("div");
        div.className = "machine-card";

        div.innerHTML = `
            <h3>Mesin ${i}</h3>
            <p>Total EA: ${rand(100, 300)} kWh</p>
            <p>Total ER: ${rand(20, 80)} kVARh</p>
            <p>Voltage: ${rand(380, 400)} V</p>
            <p>Current: ${rand(5, 20)} A</p>
            <p>Power P: ${rand(500,1500)} W</p>
            <p>PF: ${(Math.random()).toFixed(2)}</p>
            <p>Freq: ${rand(49, 51)} Hz</p>
        `;

        list.appendChild(div);
    }
}

function loadTroubleDummy() {
    const list = document.getElementById("troubleList");

    const status = ["ON", "OFF", "OVER VOLTAGE", "NO POWER"];

    for (let i = 1; i <= 18; i++) {
        const div = document.createElement("div");
        div.className = "machine-card";

        div.innerHTML = `
            <h3>Mesin ${i}</h3>
            <p>Status: ${status[rand(0,3)]}</p>
            <p>Hari ini trouble: ${rand(0,3)} kali</p>
        `;

        list.appendChild(div);
    }
}

function hitungTarif() {
    let tarif = document.getElementById("tarifKwh").value;
    let kwh = document.getElementById("hariKwh").value;

    if (!tarif || !kwh) {
        alert("Isi semua data!");
        return;
    }

    let biaya = tarif * kwh;

    document.getElementById("tarifResult").innerHTML =
        `<h3>Total Biaya Hari Ini: Rp ${biaya.toLocaleString()}`;
}

function startSystem() {
    document.getElementById("controlStatus").innerHTML =
        "🔵 System Started — IoT berjalan normal.";
}

function stopSystem() {
    document.getElementById("controlStatus").innerHTML =
        "🔴 System Stopped — IoT tidak mengirim data.";
}

function checkSatpam() {
    document.getElementById("controlStatus").innerHTML =
        "👮 IoT Satpam: Tidak ada gangguan hari ini.";
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
