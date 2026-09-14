let STATE = null;

function renderCabinsAdmin(){
  document.getElementById('cabins-root').innerHTML = STATE.cabins.map(cabin => (
    '<div class="admin-card">' +
    '<div class="cabin-head"><h3>' + esc(cabin.name) + '</h3><span class="cabin-cap">Hasta ' + cabin.capacity + ' personas</span></div>' +
    '<div class="cal-legend"><span><span class="dot dot-free"></span>Disponible (clic para marcar ocupado)</span><span><span class="dot dot-blocked"></span>Ocupado (clic para liberar)</span></div>' +
    '<div class="editing">' + twoMonthsHTML(cabin) + '</div>' +
    '<label>Precio<input data-cabin-price="' + cabin.id + '" value="' + esc(cabin.priceNote) + '"></label>' +
    '</div>'
  )).join('');
}

function renderEventsAdmin(){
  const root = document.getElementById('admin-events');
  root.innerHTML = STATE.events.map((ev, i) =>
    '<div class="admin-event-row" data-i="' + i + '">' +
    '<input type="date" value="' + ev.date + '" data-ev-date="' + i + '">' +
    '<input type="text" value="' + esc(ev.title) + '" data-ev-title="' + i + '" placeholder="Título">' +
    '<input type="text" value="' + esc(ev.note) + '" data-ev-note="' + i + '" placeholder="Nota">' +
    '<button type="button" data-ev-del="' + i + '">✕</button></div>'
  ).join('');
  root.querySelectorAll('[data-ev-del]').forEach(b => b.onclick = () => {
    STATE.events.splice(Number(b.dataset.evDel), 1);
    renderEventsAdmin();
  });
}

function wireCalendarToggle(){
  document.getElementById('cabins-root').addEventListener('click', e => {
    const btn = e.target.closest('.cal-day[data-date]');
    if (!btn || btn.disabled) return;
    const cabin = STATE.cabins.find(c => c.id === btn.dataset.cabin);
    const date = btn.dataset.date;
    const idx = cabin.blocked.indexOf(date);
    if (idx >= 0) cabin.blocked.splice(idx, 1); else cabin.blocked.push(date);
    renderCabinsAdmin();
  });
}

function collectState(){
  STATE.whatsapp = document.getElementById('f-whats').value.trim();
  document.querySelectorAll('[data-cabin-price]').forEach(inp => {
    const c = STATE.cabins.find(c => c.id === inp.dataset.cabinPrice);
    if (c) c.priceNote = inp.value;
  });
  STATE.camping.priceNote = document.getElementById('f-camping').value;
  STATE.diaDeCampo.priceNote = document.getElementById('f-diadecampo').value;
  STATE.events = Array.from(document.querySelectorAll('.admin-event-row')).map(row => ({
    id: 'e' + row.dataset.i,
    date: row.querySelector('[data-ev-date]').value,
    title: row.querySelector('[data-ev-title]').value,
    note: row.querySelector('[data-ev-note]').value
  })).filter(ev => ev.title.trim());
  return STATE;
}

function wireGenerate(){
  document.getElementById('generate').onclick = () => {
    const state = collectState();
    const json = JSON.stringify(state, null, 2);
    document.getElementById('json-out').value = json;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dl = document.getElementById('download-link');
    dl.href = url;
    dl.download = 'data.json';
    dl.hidden = false;
    document.getElementById('result-box').hidden = false;
  };
  document.getElementById('copy-json').onclick = async () => {
    const ta = document.getElementById('json-out');
    ta.select();
    try { await navigator.clipboard.writeText(ta.value); document.getElementById('copy-status').textContent = 'Copiado ✓'; }
    catch (e) { document.getElementById('copy-status').textContent = 'Selecciona el texto y copia con Ctrl/Cmd+C'; }
  };
}

async function init(){
  const res = await fetch('data.json', { cache: 'no-store' });
  STATE = await res.json();
  document.getElementById('f-whats').value = STATE.whatsapp;
  document.getElementById('f-camping').value = STATE.camping.priceNote;
  document.getElementById('f-diadecampo').value = STATE.diaDeCampo.priceNote;
  renderCabinsAdmin();
  renderEventsAdmin();
  wireCalendarToggle();
  wireGenerate();
  document.getElementById('add-event').onclick = () => {
    STATE.events.push({ id: 'e' + Date.now(), date: todayIso(), title: '', note: '' });
    renderEventsAdmin();
  };
}

document.addEventListener('DOMContentLoaded', init);
