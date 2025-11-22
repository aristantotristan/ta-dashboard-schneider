// --- CONFIG MQTT ---
const MQTT_HOST = "701d32236feb43b38c22855a611f4d42.s1.eu.hivemq.cloud";
const MQTT_PORT = 8884;
const MQTT_USER = "web_dashboard";
const MQTT_PASS = "Tristan12";
const MQTT_TOPIC = "politeknik/meter/data";

// --- GLOBALS ---
let mqttClient;
let gauges = {}; 
let activeId = 0;
let gaugesInitialized = false;
let cache = {};
let lastUpdate = {};

const fmt = (n, d) => (n != null && !isNaN(n)) ? Number(n).toFixed(d) : "-";
const fmtTime = (v) => { if(!v) return "-"; let d=Math.floor(v/24), h=(v%24).toFixed(1); return `${d}h ${h}j`; };

// --- INIT ---
window.onload = function() {
    try {
        // 1. Setup UI
        initUI();

        // 2. Init Supabase (Jika ada function init di tarif.js)
        if(typeof initSupabase === 'function') initSupabase();

        // 3. Setup MQTT
        mqttClient = new Paho.MQTT.Client(MQTT_HOST, MQTT_PORT, "pro_" + Date.now());
        mqttClient.onConnectionLost = (r) => { 
            if(r.errorCode!==0) { setStatus("Reconnecting...", "bg-disconn"); setTimeout(connectMQTT, 3000); }
        };
        mqttClient.onMessageArrived = onMessage;
        connectMQTT();
        
        // 4. Watchdog (Deteksi Offline)
        setInterval(() => {
            const now = Date.now();
            for(let i=1; i<=18; i++) {
                if(lastUpdate[i] && (now - lastUpdate[i] > 15000)) {
                    const off = {id: i, status: 'offline'};
                    cache[i] = off;
                    updateCard(off);
                    if(activeId === i) updateDetail(off);
                    delete lastUpdate[i];
                }
            }
        }, 1000);

    } catch(e) { console.error(e); }
};

function initUI() {
    let gridM = "", gridT = "";
    for(let i=1; i<=18; i++) {
        gridM += `
        <div class="machine-card offline" id="card-${i}" onclick="openMonitor(${i})">
            <div class="mc-header"><div class="mc-title">Mesin ${i}</div><i class="fa-solid fa-industry mc-icon"></i></div>
            <div class="mc-status" id="badge-${i}">OFFLINE</div>
        </div>`;
        
        gridT += `
        <div class="machine-card" onclick="openTarif(${i})">
            <div class="mc-header"><div class="mc-title">Mesin ${i}</div><i class="fa-solid fa-chart-line mc-icon" style="color:var(--accent)"></i></div>
            <div style="font-size:0.8rem; color:#64748b">Klik untuk laporan</div>
        </div>`;
    }
    document.getElementById("machine-grid").innerHTML = gridM;
    document.getElementById("tarif-grid-container").innerHTML = gridT;
}

function connectMQTT() {
    setStatus("Connecting...", "bg-wait");
    mqttClient.connect({
        useSSL: true, userName: MQTT_USER, password: MQTT_PASS,
        onSuccess: () => { setStatus("Connected", "bg-conn"); mqttClient.subscribe(MQTT_TOPIC); },
        onFailure: () => { setStatus("Failed", "bg-disconn"); }
    });
}

function onMessage(m) {
    try {
        const d = JSON.parse(m.payloadString);
        if(d.id_mesin) d.id = d.id_mesin;
        if(!d.id) return;
        
        cache[d.id] = d;
        lastUpdate[d.id] = Date.now();
        updateCard(d);
        if(d.id === activeId) updateDetail(d);
    } catch(e) {}
}

function updateCard(d) {
    const el = document.getElementById(`card-${d.id}`);
    const bd = document.getElementById(`badge-${d.id}`);
    if(!el) return;
    if(d.status === 'online') {
        el.classList.remove('offline'); el.classList.add('online');
        bd.innerText = "RUNNING";
        bd.parentElement.classList.remove('offline'); bd.parentElement.classList.add('online');
    } else {
        el.classList.remove('online'); el.classList.add('offline');
        bd.innerText = "OFFLINE";
        bd.parentElement.classList.remove('online'); bd.parentElement.classList.add('offline');
    }
}

function updateDetail(d) {
    const isOff = d.status === 'offline';
    const val = (k, dec, u='') => isOff ? '-' : `<span class="val-highlight">${fmt(d[k], dec)}</span> <span class="unit">${u}</span>`;
    const valT = (k) => isOff ? '-' : `<span class="val-highlight">${fmtTime(d[k])}</span>`;
    
    const html = `
        <tr><td class="group-header" colspan="2">ENERGI TOTAL</td></tr>
        <tr><td>Total Active Import</td><td>${val('e', 2, 'kWh')}</td></tr>
        <tr><td>Total Reactive Import</td><td>${val('q_tot', 2, 'kVARh')}</td></tr>
        <tr><td class="group-header" colspan="2">PARTIAL ENERGY</td></tr>
        <tr><td>Partial Active</td><td>${val('e_part', 2, 'kWh')}</td></tr>
        <tr><td>Partial Reactive</td><td>${val('q_part', 2, 'kVARh')}</td></tr>
        <tr><td class="group-header" colspan="2">KELISTRIKAN 3-PHASE</td></tr>
        <tr><td>Voltage (Avg L-L)</td><td>${val('v', 1, 'V')}</td></tr>
        <tr><td>Current (Avg)</td><td>${val('i', 2, 'A')}</td></tr>
        <tr><td style="padding-left:40px">Phase 1 (I1)</td><td>${val('i1', 2, 'A')}</td></tr>
        <tr><td style="padding-left:40px">Phase 2 (I2)</td><td>${val('i2', 2, 'A')}</td></tr>
        <tr><td style="padding-left:40px">Phase 3 (I3)</td><td>${val('i3', 2, 'A')}</td></tr>
        <tr><td class="group-header" colspan="2">DAYA & KUALITAS</td></tr>
        <tr><td>Active Power (P)</td><td>${val('p', 0, 'W')}</td></tr>
        <tr><td>Reactive Power (Q)</td><td>${val('q', 0, 'VAR')}</td></tr>
        <tr><td>Apparent Power (S)</td><td>${val('s', 2, 'kVA')}</td></tr>
        <tr><td>Power Factor</td><td>${val('pf', 3)}</td></tr>
        <tr><td>Frequency</td><td>${val('hz', 1, 'Hz')}</td></tr>
        <tr><td class="group-header" colspan="2">WAKTU OPERASI</td></tr>
        <tr><td>Total Running Time</td><td>${valT('op_time')}</td></tr>
    `;
    document.getElementById("detail-table-body").innerHTML = html;

    if(gaugesInitialized) {
        gauges.v.set(isOff ? 0 : d.v); document.getElementById("val-volt").innerText = isOff ? "-" : fmt(d.v, 0) + " V";
        gauges.a.set(isOff ? 0 : d.i); document.getElementById("val-amp").innerText = isOff ? "-" : fmt(d.i, 1) + " A";
        gauges.p.set(isOff ? 0 : d.p); document.getElementById("val-power").innerText = isOff ? "-" : fmt(d.p, 0) + " W";
        gauges.f.set(isOff ? 0 : d.hz); document.getElementById("val-freq").innerText = isOff ? "-" : fmt(d.hz, 1) + " Hz";
    }
}

// --- NAVIGATION & TABS ---
function goToMonitor() {
    showPage('view-monitor-grid', 'Monitoring Live', 'nav-monitor');
    activeId = 0;
}
function goToTarif() {
    showPage('view-tarif-grid', 'Laporan Tarif', 'nav-tarif');
    activeId = 0;
}
function openMonitor(id) {
    activeId = id;
    document.getElementById('detail-mc-name').innerText = "Mesin " + id;
    showPage('view-monitor-detail', 'Monitoring Live', 'nav-monitor');
    updateDetail(cache[id] || {status:'offline'});
    switchDetailTab('full');
}
function showPage(pageId, title, navId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.getElementById('header-title').innerText = title;
    document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
    if(navId) document.getElementById(navId).classList.add('active');
}
function setStatus(t, c) { 
    const d = document.getElementById("conn-dot");
    const txt = document.getElementById("conn-text");
    d.className = "status-dot " + c; txt.innerText = t;
}

// --- GAUGE SETUP ---
function switchDetailTab(tab) {
    if(tab === 'full') {
        document.getElementById('tab-content-full').style.display = 'block';
        document.getElementById('tab-content-gauge').style.display = 'none';
        document.getElementById('tab-full').classList.add('active');
        document.getElementById('tab-gauge').classList.remove('active');
    } else {
        document.getElementById('tab-content-full').style.display = 'none';
        document.getElementById('tab-content-gauge').style.display = 'block';
        document.getElementById('tab-full').classList.remove('active');
        document.getElementById('tab-gauge').classList.add('active');
        if(!gaugesInitialized) initGauges();
    }
}
function initGauges() {
    const opts = { angle: 0, lineWidth: 0.2, radiusScale: 0.9, pointer: { length: 0.5, strokeWidth: 0.035, color: '#1e293b' }, limitMax: false, limitMin: false, colorStart: '#3b82f6', colorStop: '#2563eb', strokeColor: '#e2e8f0', generateGradient: true, highDpiSupport: true };
    gauges.v = new Gauge(document.getElementById("g-volt")).setOptions(opts); gauges.v.maxValue = 450; gauges.v.setMinValue(0);
    gauges.a = new Gauge(document.getElementById("g-amp")).setOptions(opts); gauges.a.maxValue = 100; gauges.a.setMinValue(0);
    gauges.p = new Gauge(document.getElementById("g-power")).setOptions(opts); gauges.p.maxValue = 20000; gauges.p.setMinValue(0);
    gauges.f = new Gauge(document.getElementById("g-freq")).setOptions(opts); gauges.f.maxValue = 60; gauges.f.setMinValue(40);
    gaugesInitialized = true;
    if(cache[activeId]) updateDetail(cache[activeId]);
}
