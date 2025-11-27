/* Tarif page logic
   - Supports Single Tarif and LWBP/WBP tariffs
   - Change Tarif modal saves to localStorage
   - Filter: day/week/month/custom range (based on dummy generated timestamps)
   - LWBP defined as hours >=22 or <17
*/
const DEFAULT_SINGLE = 1500;
const DEFAULT_LWBP = 1200;
const DEFAULT_WBP = 2500;

function isLWBPHour(hour){
  // LWBP: 22:00 - 17:00 (22..23 & 0..16)
  return (hour >= 22 || hour < 17);
}

function getTarif(){
  const s = localStorage.getItem('tarif_single');
  const lw = localStorage.getItem('tarif_lwbp');
  const wb = localStorage.getItem('tarif_wbp');
  return {
    single: s ? Number(s) : null,
    lwbp: lw ? Number(lw) : null,
    wbp: wb ? Number(wb) : null
  };
}

function saveTarif(obj){
  if(obj.single !== null) localStorage.setItem('tarif_single', obj.single);
  if(obj.lwbp !== null) localStorage.setItem('tarif_lwbp', obj.lwbp);
  if(obj.wbp !== null) localStorage.setItem('tarif_wbp', obj.wbp);
}

function displayTarif(){
  const t = getTarif();
  const disp = document.getElementById('tarifValue');
  if(t.single) disp.textContent = t.single.toLocaleString();
  else {
    const lw = t.lwbp||DEFAULT_LWBP;
    const wb = t.wbp||DEFAULT_WBP;
    disp.textContent = `${lw.toLocaleString()} / ${wb.toLocaleString()} (LWBP/WBP)`;
  }
}

function openTarifModal(){
  const t = getTarif();
  document.getElementById('singleTarif').value = t.single || '';
  document.getElementById('lwbpTarif').value = t.lwbp || '';
  document.getElementById('wbpTarif').value = t.wbp || '';
  document.getElementById('tarifModal').classList.remove('hidden');
}

function closeTarifModal(){
  document.getElementById('tarifModal').classList.add('hidden');
}

// Dummy consumption data generator (per hour entries)
function generateDummyConsumptionRange(from, to){
  // generate hourly entries per machine for the given range (from/to Date)
  const data = {}; // machine -> array of {ts, kWh}
  for(let m=1;m<=18;m++){
    data[m] = [];
    let t = new Date(from.getTime());
    while(t <= to){
      const hour = t.getHours();
      const kwh = +(Math.random()*0.8 + 0.2).toFixed(3);
      data[m].push({ts: t.getTime(), kwh});
      t.setHours(t.getHours()+1);
    }
  }
  return data;
}

function applyFilter(range){
  let from, to;
  const now = new Date();
  if(range === 'day'){
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
    to = now;
  } else if(range === 'week'){
    const dayOfWeek = now.getDay(); // 0..6
    const monday = new Date(now); monday.setDate(now.getDate() - (dayOfWeek===0?6:dayOfWeek-1));
    from = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0,0,0);
    to = now;
  } else if(range === 'month'){
    from = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0);
    to = now;
  } else {
    // custom
    const f = document.getElementById('fromDate').value;
    const t = document.getElementById('toDate').value;
    if(!f || !t){ alert('Pilih tanggal custom dulu'); return; }
    from = new Date(f);
    to = new Date(t); to.setHours(23,59,59);
  }

  // compute using dummy data generator
  const dummy = generateDummyConsumptionRange(from, to);
  computeAndRender(dummy, from, to);
}

function computeAndRender(data, from, to){
  const t = getTarif();
  const useSingle = !!t.single;
  const tbody = document.querySelector('#tarifTable tbody');
  tbody.innerHTML = '';
  let grandTotalKwh = 0;
  let grandTotalRp = 0;

  for(let m=1;m<=18;m++){
    // sum kWh per entry and classify LWBP/WBP based on timestamp hour
    const rows = data[m] || [];
    let lwbpSum = 0, wbpSum = 0;
    rows.forEach(r=>{
      const ts = new Date(r.ts);
      if(ts < from || ts > to) return;
      if(isLWBPHour(ts.getHours())) lwbpSum += r.kwh;
      else wbpSum += r.kwh;
    });
    const total = +(lwbpSum + wbpSum).toFixed(3);
    let biaya = 0;
    if(useSingle){
      const single = t.single || DEFAULT_SINGLE;
      biaya = Math.round(total * single);
    } else {
      const lw = t.lwbp || DEFAULT_LWBP;
      const wb = t.wbp || DEFAULT_WBP;
      biaya = Math.round(lwbpSum*lw + wbpSum*wb);
    }
    grandTotalKwh += total;
    grandTotalRp += biaya;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>MESIN ${m}</td>
      <td>${lwbpSum.toFixed(3)}</td>
      <td>${wbpSum.toFixed(3)}</td>
      <td>${total.toFixed(3)}</td>
      <td>Rp ${biaya.toLocaleString()}</td>`;
    tbody.appendChild(tr);
  }

  document.getElementById('summaryBox').innerHTML =
    `<strong>Total kWh:</strong> ${grandTotalKwh.toFixed(3)} kWh &nbsp; | &nbsp; <strong>Total Biaya:</strong> Rp ${grandTotalRp.toLocaleString()}`;
}

// event wiring
document.addEventListener('DOMContentLoaded', ()=>{
  displayTarif();
  document.getElementById('editTarifBtn').addEventListener('click', openTarifModal);
  document.getElementById('saveTarif').addEventListener('click', ()=>{
    const single = document.getElementById('singleTarif').value;
    const lwbp = document.getElementById('lwbpTarif').value;
    const wbp = document.getElementById('wbpTarif').value;
    saveTarif({
      single: single ? Number(single) : null,
      lwbp: lwbp ? Number(lwbp) : null,
      wbp: wbp ? Number(wbp) : null
    });
    closeTarifModal();
    displayTarif();
    alert('Tarif Updated Successfully');
  });

  // filter UI
  document.querySelectorAll('.filter-btn').forEach(b=>{
    b.addEventListener('click', (e)=>{
      document.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('active'));
      e.target.classList.add('active');
      const r = e.target.dataset.range;
      document.getElementById('customRange').classList.toggle('hidden', r !== 'custom');
      // store selected range temporarily
      document.body.dataset.selectedRange = r;
    });
  });

  document.getElementById('applyFilter').addEventListener('click', ()=>{
    const r = document.body.dataset.selectedRange || 'day';
    applyFilter(r);
  });

  // by default apply 'day'
  document.querySelector('.filter-btn[data-range="day"]').click();
  document.getElementById('applyFilter').click();
});
