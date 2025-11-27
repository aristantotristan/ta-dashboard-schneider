/* Realtime page - dummy simulation + UI
   - Generates 18 machines with 12 parameters (random)
   - Each machine keeps lastReceived timestamp
   - Offline if no update > 5 minutes
   - Persists lastReceived to localStorage as machine_last
*/
const GRID = document.getElementById('grid');
const DETAIL_MODAL = document.getElementById('detailModal');
const DETAIL_TITLE = document.getElementById('detailTitle');
const DETAIL_LIST = document.getElementById('detailList');

let simulate = true;
let refreshInterval = 5000;
let machines = {};

// initialize machines and try to restore lastReceived from storage
function initMachines(){
  const savedLast = JSON.parse(localStorage.getItem('machine_last') || '{}');
  for(let i=1;i<=18;i++){
    const last = savedLast[i] || Date.now();
    machines[i] = {
      id:i,
      name:`MESIN ${i}`,
      lastReceived: last,
      params: generateParams()
    };
  }
  // persist an initial snapshot
  persistLastReceives();
}

function generateParams(){
  // generate plausible random values for 12 parameters
  return {
    totalEa: +(Math.random()*10 + 10).toFixed(3),
    totalEr: +(Math.random()*5).toFixed(3),
    partialEa: +(Math.random()*2).toFixed(3),
    partialEr: +(Math.random()*1).toFixed(3),
    voltage: +(220 + (Math.random()*5 - 2.5)).toFixed(1),
    current: [
      +(Math.random()*50 + 1).toFixed(2),
      +(Math.random()*50 + 1).toFixed(2),
      +(Math.random()*50 + 1).toFixed(2)
    ],
    powerP: +(Math.random()*300 + 100).toFixed(1),
    powerQ: +(Math.random()*200).toFixed(1),
    powerS: +(Math.random()*350 + 80).toFixed(1),
    pf: +(0.7 + Math.random()*0.3).toFixed(2),
    freq: +(49.9 + Math.random()*0.3).toFixed(2),
    opTime: Math.floor(Math.random()*5000) // hours
  };
}

function persistLastReceives(){
  const out = {};
  Object.values(machines).forEach(m=> out[m.id] = m.lastReceived );
  localStorage.setItem('machine_last', JSON.stringify(out));
}

function renderGrid(){
  GRID.innerHTML = '';
  Object.values(machines).forEach(m=>{
    const elapsed = Date.now() - m.lastReceived;
    const mins = elapsed / 60000;
    let statusClass = 'status online';
    let statusText = 'ONLINE';
    if(mins > 5) { statusClass = 'status offline'; statusText = 'OFFLINE'; }
    else if(mins > 0.5) { statusClass = 'status warn'; statusText = 'DELAY'; }

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;">
        <div>
          <div class="title">${m.name}</div>
          <div class="${statusClass}">${statusText}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${m.params.powerP} W</div>
          <div class="note">${m.params.totalEa} kWh</div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;justify-content:space-between;gap:8px">
        <button class="btn small" onclick="showDetail(${m.id})">Detail</button>
        <button class="btn small" onclick="forceOffline(${m.id})">Force Offline</button>
      </div>
    `;
    GRID.appendChild(card);
  });
}

function showDetail(id){
  const m = machines[id];
  DETAIL_TITLE.textContent = m.name;
  DETAIL_LIST.innerHTML = '';
  const p = m.params;
  const entries = [
    ['Total Ea', p.totalEa + ' kWh'],
    ['Total Er', p.totalEr + ' kVARh'],
    ['Partial Ea', p.partialEa + ' kWh'],
    ['Partial Er', p.partialEr + ' kVARh'],
    ['Voltage (LL Avg)', p.voltage + ' V'],
    ['Current I1,I2,I3', p.current.join(' A, ') + ' A'],
    ['Power P', p.powerP + ' W'],
    ['Power Q', p.powerQ + ' VAR'],
    ['Power S', p.powerS + ' kVA'],
    ['PF', p.pf],
    ['Freq', p.freq + ' Hz'],
    ['Op Time', p.opTime + ' Jam'],
  ];
  entries.forEach(e=>{
    const el = document.createElement('div');
    el.className = 'detail-item';
    el.innerHTML = `<strong>${e[0]}</strong><div class="note">${e[1]}</div>`;
    DETAIL_LIST.appendChild(el);
  });
  DETAIL_MODAL.classList.remove('hidden');
}

function closeDetail(){ DETAIL_MODAL.classList.add('hidden'); }

function forceOffline(id){
  machines[id].lastReceived = Date.now() - (6*60*1000); // mark >5min
  persistLastReceives();
  renderGrid();
}

function forceRecover(id){
  machines[id].lastReceived = Date.now();
  machines[id].params = generateParams();
  persistLastReceives();
  renderGrid();
}

function updateData(){
  if(!simulate) return;
  // update random subset
  for(let i=1;i<=18;i++){
    if(Math.random() > 0.2){ // 80% chance update
      machines[i].params = generateParams();
      machines[i].lastReceived = Date.now();
    }
  }
  // persist lastReceived map so maintenance can read
  persistLastReceives();
  renderGrid();
}

document.addEventListener('DOMContentLoaded', () => {
  initMachines();
  renderGrid();
  // set interval via timer holder to allow change
  let ticker = setInterval(updateData, refreshInterval);

  document.getElementById('refreshSelect').addEventListener('change', (e)=>{
    const v = parseInt(e.target.value,10);
    refreshInterval = v;
    clearInterval(ticker);
    ticker = setInterval(updateData, refreshInterval);
  });

  document.getElementById('simulateToggle').addEventListener('click', ()=>{
    simulate = !simulate;
    document.getElementById('simulateToggle').textContent = simulate ? 'Toggle Simulate (Dummy)' : 'Simulation Paused';
    if(simulate){
      updateData();
      clearInterval(ticker);
      ticker = setInterval(updateData, refreshInterval);
    } else {
      clearInterval(ticker);
    }
  });
});

window.showDetail = showDetail;
window.closeDetail = closeDetail;
window.forceOffline = forceOffline;
window.forceRecover = forceRecover;
