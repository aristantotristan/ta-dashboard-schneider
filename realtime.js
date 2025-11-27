// js/realtime.js - dummy data 18 mesin
const tbody = document.getElementById("machine-data");

// Buat 18 row mesin di tabel
for (let i = 1; i <= 18; i++) {
    const tr = document.createElement("tr");
    tr.id = `machine-${i}`;
    tr.innerHTML = `
        <td>Mesin ${i}</td>
        <td class="voltage">0</td>
        <td class="current">0</td>
        <td class="power">0</td>
    `;
    tbody.appendChild(tr);
}

// Fungsi generate data acak tiap mesin
function getDummyMachineData() {
    return {
        voltage: (220 + Math.random() * 5).toFixed(2),
        current: (5 + Math.random() * 1).toFixed(2),
        power: (1100 + Math.random() * 50).toFixed(2)
    };
}

// Update semua mesin tiap 1 detik
setInterval(() => {
    for (let i = 1; i <= 18; i++) {
        const row = document.getElementById(`machine-${i}`);
        const data = getDummyMachineData();
        row.querySelector(".voltage").innerText = data.voltage;
        row.querySelector(".current").innerText = data.current;
        row.querySelector(".power").innerText = data.power;
    }
}, 1000);
