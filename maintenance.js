/* Maintenance page
   - Reads machines lastReceived from localStorage key 'machine_last'
   - Marks offline if > 5 minutes
   - Saves logs to localStorage: downtime events
*/
const maintenanceList = document.getElementById('maintenanceList');

function now(){ return Date.now(); }

function getLastReceives(){
  const saved = localStorage.getItem('machine_last');
  if(saved){
    try {
      return JSON.parse(saved);
    } catch(e){
      return {};
    }
  }
  // fallback: create a fake set if nothing stored
  const out = {};
  for(let i=1;i<=18;i++){
    out[i] = now() - Math.floor(Math.random()*8*60*1000); // some delayed
  }
  localStorage.setItem('machine_last', JSON.stringify(out));
  return out;
}

function checkOfflineAndLog(){
  const last = getLastReceives();
  const logs = JSON.parse(localStorage.getItem('downtime_logs') || '[]');
  const list = [];
  for(let i=1;i<=18;i++){
    const l = last[i] || now();
    const elapsed = now() - l;
    const minutes = Math.floor(elapsed/60000);
    let status = 'ONLINE';
    if(minutes > 5) status = 'OFFLINE';
    else if(minutes > 0.5) status = 'DELAY';
    list.push({id:i, last:l, minutes, status});
    // if OFFLINE, push log if not already logged as open downtime
    if(status === 'OFFLINE'){
      const openKey = `down_open_${i}`;
      if(!localStorage.getItem(openKey)){
        const entry = {machine:i, downAt: l, detectedAt: now(), recoveredAt: null};
        logs.push(entry);
        localStorage.setItem('downtime_logs', JSON.stringify(logs));
        localStorage.setItem(openKey, '1'); // mark open
      }
    } else {
      // if previously open downtime, close it
      const openKey = `down_open_${i}`;
      if(localStorage.getItem(openKey)){
        // find last log for this machine without recoveredAt
        const logsArr = JSON.parse(localStorage.getItem('downtime_logs') || '[]');
        for(let j = logsArr.length - 1; j >= 0; j--){
          if(logsArr[j].machine === i && !logsArr[j].recoveredAt){
            logsArr[j].recoveredAt = now();
            break;
          }
        }
        localStorage.setItem('downtime_logs', JSON.stringify(logsArr));
        localStorage.removeItem(openKey);
      }
    }
  }
  renderMaintenance(list);
}

function renderMaintenance(list){
  maintenanceList.innerHTML = '';
  list.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'maintenance-card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-weight:700">MESIN ${item.id}</div>
        <div class="note">Last Received: ${new Date(item.last).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <div class="${item.status === 'ONLINE' ? 'status online' : item.status === 'DELAY' ? 'status warn' : 'status offline'}">${item.status}</div>
        <div class="note">${item.minutes} menit sejak data terakhir</div>
      </div>
      </div>
      <div style="margin-top:8px">
        <button class="btn small" onclick="forceRecover(${item.id})">Force Recover</button>
        <button class="btn small" onclick="forceOffline(${item.id})">Force Offline</button>
      </div>`;
    maintenanceList.appendChild(card);
  });

  // show logs summary
  const logs = JSON.parse(localStorage.getItem('downtime_logs') || '[]');
  const summary = document.createElement('div');
  summary.className = 'summary';
  if(logs.length === 0) summary.innerHTML = `<strong>Downtime Logs:</strong> 0 events`;
  else {
    let html = `<strong>Downtime Logs:</strong> ${logs.length} events<br/><div style="margin-top:8px">`;
    // show last 5 logs
    const last5 = logs.slice(-5).reverse();
    last5.forEach(l=>{
      const down = new Date(l.downAt).toLocaleString();
      const rec = l.recoveredAt ? new Date(l.recoveredAt).toLocaleString() : '---';
      html += `<div class="note">MESIN ${l.machine} → Down: ${down} • Recovered: ${rec}</div>`;
    });
    html += `</div>`;
    summary.innerHTML = html;
  }
  maintenanceList.appendChild(summary);
}

function forceOffline(id){
  const last = getLastReceives();
  last[id] = now() - (6*60*1000);
  localStorage.setItem('machine_last', JSON.stringify(last));
  checkOfflineAndLog();
}

function forceRecover(id){
  const last = getLastReceives();
  last[id] = now();
  localStorage.setItem('machine_last', JSON.stringify(last));
  checkOfflineAndLog();
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('refreshMaintenance').addEventListener('click', checkOfflineAndLog);
  document.getElementById('clearLogs').addEventListener('click', ()=>{
    if(confirm('Clear all downtime logs?')){
      localStorage.removeItem('downtime_logs');
      for(let i=1;i<=18;i++) localStorage.removeItem(`down_open_${i}`);
      checkOfflineAndLog();
    }
  });
  checkOfflineAndLog();
  // auto refresh every 20s
  setInterval(checkOfflineAndLog, 20000);
});

// expose functions globally for buttons
window.forceOffline = forceOffline;
window.forceRecover = forceRecover;
