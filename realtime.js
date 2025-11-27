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
        <td class="oph">0</td>
    `;
    tbody.appendChild(tr);
}

// Simulasi OpH awal per mesin (0-500 jam)
const ophValues = Array.from({length: 18}, () => Math.floor(Math.random()*500));

// Fungsi generate data acak tiap mesin
function getDummyMachineData(index) {
    return {
        voltage: (220 + Math.random() * 5).toFixed(2),
        current: (5 + Math.random() * 1).toFixed(2),
        power: (1100 + Math.random() * 50).toFixed(2),
        oph: (ophValues[index] + Math.floor(Math.random() * 3)).toFixed(1)
    };
}

// Update semua mesin tiap 1 detik
setInterval(() => {
    for (let i = 0; i < 18; i++) {
        const row = document.getElementById(`machine-${i+1}`);
        const data = getDummyMachineData(i);
        row.querySelector(".voltage").innerText = data.voltage;
        row.querySelector(".current").innerText = data.current;
        row.querySelector(".power").innerText = data.power;
        row.querySelector(".oph").innerText = data.oph;
    }
}, 1000);
