/* Maintenance page
   - Reads machines lastReceived simulated from realtime page (if same origin)
   - Marks offline if > 5 minutes
   - Saves logs to localStorage: downtime events
*/
const maintenanceList = document.getElementById('maintenanceList');

function now(){ return Date.now(); }

function getLastReceives(){
  // In this static dummy setup, we simulate or read from a shared storage if exists
  // We'll create a fake set if nothing stored
  const saved = localStorage.getItem('machine_last');
  if(saved){
    return JSON.parse(saved);
  }
  const out = {};
  for(let i=1;i<=18;i++){
    out[i] = now() - Math.floor(Math.random()*8*60*1000); // some are delayed
  }
  localStorage.setItem('machine_last', JSON.stringify(out));
  return out;
}

function checkOfflineAndLog(){
  const last = getLastReceives();
  const logs = JSON.parse(localStorage.getItem('downtime_logs') || '[]');
  const list = [];
  for(let i=1;i<=18;i++){
    const elapsed = now() - last[i];
    const minutes = Math.floor(elapsed/60000);
    let status = 'ONLINE';
    if(minutes > 5) status = 'OFFLINE';
    else if(minutes > 0.5) status = 'DELAY';
    list.push({id:i, last:last[i], minutes, status});
    // if OFFLINE, push log if not already logged as open downtime
    if(status === 'OFFLINE'){
      const openKey = `down_open_${i}`;
      if(!localStorage.getItem(openKey)){
        const entry = {machine:i, downAt: last[i], detectedAt: now()};
        logs.push(entry);
        localStorage.setItem('downtime_logs', JSON.stringify(logs));
        localStorage.setItem(openKey, '1'); // mark open
      }
    } else {
      // if previously open downtime, close it
      const openKey = `down_open_${i}`;
      if(localStorage.getItem(openKey)){
        // close by writing to logs with up time
        const logsArr = JSON.parse(localStorage.getItem('downtime_logs') || '[]');
        const lastIdx = logsArr.length - 1;
        if(lastIdx >=0 && logsArr[lastIdx].machine === i && !logsArr[lastIdx].recoveredAt){
          logsArr[lastIdx].recoveredAt = now();
          localStorage.setItem('downtime_logs', JSON.stringify(logsArr));
        }
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
  summary.innerHTML = `<strong>Downtime Logs:</strong> ${logs.length} events`;
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
