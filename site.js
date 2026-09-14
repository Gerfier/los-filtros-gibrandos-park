// Ver google-apps-script/SETUP.md para configurar estos dos valores.
const BOOKING_SCRIPT_URL = "PON_AQUI_LA_URL_DE_APPS_SCRIPT";
const BOOKING_SECRET = "CAMBIA-ESTA-PALABRA-SECRETA";
const BOOKING_CONFIGURED = BOOKING_SCRIPT_URL.indexOf("http") === 0;

const FALLBACK_STATE = {
  whatsapp: "526481220782",
  cabins: [
    { id: "sauce", name: "Cabaña El Sauce", capacity: 4, priceNote: "Pregunta por WhatsApp", blocked: [] },
    { id: "nogal", name: "Cabaña El Nogal", capacity: 6, priceNote: "Pregunta por WhatsApp", blocked: [] }
  ],
  camping: { priceNote: "Pregunta por WhatsApp (por persona)" },
  diaDeCampo: { priceNote: "Pregunta por WhatsApp (entrada por persona)" },
  events: []
};

let STATE = FALLBACK_STATE;
let selection = null;

function whatsIcon(){
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.36a9.9 9.9 0 0 0 4.62 1.14h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2z"/></svg>';
}

function renderCabins(){
  document.getElementById('cabins-root').innerHTML = STATE.cabins.map(cabin => (
    '<div class="cabin-card">' +
    '<div class="cabin-head"><h3>' + esc(cabin.name) + '</h3><span class="cabin-cap">Hasta ' + cabin.capacity + ' personas</span></div>' +
    '<div class="cal-legend"><span><span class="dot dot-free"></span>Disponible</span><span><span class="dot dot-blocked"></span>Ocupado</span></div>' +
    twoMonthsHTML(cabin) +
    '<p class="price-note">' + esc(cabin.priceNote) + '</p></div>'
  )).join('');
  if (selection){
    const days = selection.end ? datesBetween(selection.start, selection.end) : [selection.start];
    days.forEach(d => {
      const el = document.querySelector('.cal-day[data-cabin="' + selection.cabinId + '"][data-date="' + d + '"]');
      if (el) el.classList.add('cal-day--sel');
    });
  }
}

function renderEvents(){
  const root = document.getElementById('events-root');
  if (!STATE.events.length){
    root.innerHTML = '<p class="events-empty">No hay eventos programados por ahora — vuelve pronto.</p>';
    return;
  }
  const sorted = STATE.events.slice().sort((a, b) => a.date.localeCompare(b.date));
  root.innerHTML = sorted.map(ev =>
    '<div class="event-card"><div class="event-date">' + fmtCorta(ev.date) + '</div><div><h3>' + esc(ev.title) + '</h3><p>' + esc(ev.note) + '</p>' +
    '<a class="btn btn-whats btn-sm" style="margin-top:8px" target="_blank" rel="noopener" href="' + waLink(STATE.whatsapp, 'Hola, me interesa el evento "' + ev.title + '" (' + fmtLarga(ev.date) + '). ¿Me dan más información?') + '">Preguntar por WhatsApp</a></div></div>'
  ).join('');
}

function refreshWhatsLinks(){
  document.querySelectorAll('[data-whats-default]').forEach(a => {
    a.href = waLink(STATE.whatsapp, a.dataset.whatsDefault);
  });
  document.getElementById('camping-price').textContent = STATE.camping.priceNote;
  document.getElementById('camping-whats').href = waLink(STATE.whatsapp, 'Hola, quiero información sobre el área de campamento (espacio y costo por persona).');
  document.getElementById('dia-price').textContent = STATE.diaDeCampo.priceNote;
  document.getElementById('dia-whats').href = waLink(STATE.whatsapp, 'Hola, quiero información sobre el día de campo (costo de entrada).');
}

async function fetchLiveAvailability(){
  if (!BOOKING_CONFIGURED) return;
  try {
    const res = await fetch(BOOKING_SCRIPT_URL + '?action=busy', { cache: 'no-store' });
    const data = await res.json();
    if (!data.ok) return;
    STATE.cabins.forEach(cabin => {
      if (data.busy[cabin.id]) cabin.blocked = data.busy[cabin.id];
    });
  } catch (e) {
    // sin conexión al calendario: se sigue mostrando lo que ya traía data.json
  }
}

function updateSelectionBar(){
  const bar = document.getElementById('selection-bar');
  if (!selection || !selection.end){ bar.hidden = true; bar.innerHTML = ''; return; }
  const cabin = STATE.cabins.find(c => c.id === selection.cabinId);
  const nights = datesBetween(selection.start, selection.end).length - 1;
  const rangeLabel = fmtLarga(selection.start) + ' → ' + fmtLarga(selection.end);
  const waMsg = 'Hola, vi disponibilidad para ' + cabin.name + ' del ' + fmtLarga(selection.start) + ' al ' + fmtLarga(selection.end) + ' (' + nights + ' noche' + (nights === 1 ? '' : 's') + '). ¿Podrían confirmarme disponibilidad y precio?';
  bar.hidden = false;

  if (BOOKING_CONFIGURED){
    bar.innerHTML =
      '<div class="book-form">' +
      '<span>' + esc(cabin.name) + ': ' + rangeLabel + ' (' + nights + ' noche' + (nights === 1 ? '' : 's') + ')</span>' +
      '<div class="book-form-row">' +
      '<input id="book-name" class="book-input" type="text" placeholder="Tu nombre">' +
      '<input id="book-phone" class="book-input" type="tel" placeholder="Tu teléfono">' +
      '</div>' +
      '<div class="book-form-row book-form-actions">' +
      '<button type="button" class="btn btn-whats btn-sm" id="book-now">Reservar ahora (pagas al llegar)</button>' +
      '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="' + waLink(STATE.whatsapp, waMsg) + '">Prefiero WhatsApp</a>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="clear-sel">Limpiar</button>' +
      '<span id="book-status" class="book-status"></span>' +
      '</div></div>';
    document.getElementById('book-now').onclick = () => submitBooking(cabin, waMsg);
  } else {
    bar.innerHTML = '<span>' + esc(cabin.name) + ': ' + rangeLabel + '</span>' +
      '<a class="btn btn-whats btn-sm" target="_blank" rel="noopener" href="' + waLink(STATE.whatsapp, waMsg) + '">Solicitar por WhatsApp</a>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="clear-sel">Limpiar</button>';
  }
  document.getElementById('clear-sel').onclick = () => { selection = null; renderCabins(); updateSelectionBar(); };
}

async function submitBooking(cabin, waMsg){
  const status = document.getElementById('book-status');
  const name = document.getElementById('book-name').value.trim();
  const phone = document.getElementById('book-phone').value.trim();
  if (!name || !phone){ status.textContent = 'Falta tu nombre o teléfono.'; return; }
  const btn = document.getElementById('book-now');
  btn.disabled = true; btn.textContent = 'Reservando...';
  try {
    const res = await fetch(BOOKING_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        secret: BOOKING_SECRET, cabin: cabin.id,
        start: selection.start, end: selection.end, name, phone
      })
    });
    const data = await res.json();
    if (data.ok){
      selection = null;
      await fetchLiveAvailability();
      renderCabins();
      const bar = document.getElementById('selection-bar');
      bar.innerHTML = '<span>¡Reservado! Nos vemos en ' + esc(cabin.name) + '. Pagas al llegar al parque.</span>' +
        '<a class="btn btn-whats btn-sm" target="_blank" rel="noopener" href="' + waLink(STATE.whatsapp, waMsg + ' (ya la reservé desde la página)') + '">Avisar por WhatsApp también</a>';
    } else if (data.error === 'ocupado'){
      status.textContent = 'Alguien más acaba de reservar esas fechas — elige otras.';
      await fetchLiveAvailability();
      renderCabins();
    } else {
      status.textContent = 'No se pudo reservar (' + (data.error || 'error') + '). Intenta por WhatsApp.';
      btn.disabled = false; btn.textContent = 'Reservar ahora (pagas al llegar)';
    }
  } catch (e) {
    status.textContent = 'No se pudo conectar. Intenta por WhatsApp.';
    btn.disabled = false; btn.textContent = 'Reservar ahora (pagas al llegar)';
  }
}

function wireCalendar(){
  document.getElementById('cabins-root').addEventListener('click', e => {
    const btn = e.target.closest('.cal-day[data-date]');
    if (!btn || btn.disabled || btn.classList.contains('cal-day--blocked')) return;
    const cabinId = btn.dataset.cabin, date = btn.dataset.date;
    const cabin = STATE.cabins.find(c => c.id === cabinId);
    if (!selection || selection.cabinId !== cabinId || (selection.start && selection.end)){
      selection = { cabinId, start: date, end: null };
    } else if (date < selection.start){
      selection.start = date; selection.end = null;
    } else {
      const between = datesBetween(selection.start, date);
      if (between.some(d => cabin.blocked.indexOf(d) !== -1)){
        alert('Esas fechas incluyen días ya ocupados — elige otro rango.');
        selection = { cabinId, start: date, end: null };
      } else {
        selection.end = date;
      }
    }
    renderCabins();
    updateSelectionBar();
  });
}

function wireReveal(){
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches && 'IntersectionObserver' in window){
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting){ en.target.classList.add('is-in'); obs.unobserve(en.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }
}

const FAQS = [
  { k: ['ubicacion', 'ubicación', 'donde estan', 'dónde están', 'direccion', 'dirección', 'llegar', 'como llego'], a: 'Estamos en San Francisco de Conchos, Chihuahua, cerca de La Boquilla / Presa Toronto. Puedes ver el mapa en la sección "Cómo llegar" de esta página.' },
  { k: ['precio', 'cuesta', 'costo', 'cuanto', 'cuánto'], a: 'Los precios varían por temporada. Revisa la sección de cabañas, camping y día de campo de esta página, o pregunta el costo exacto por WhatsApp.' },
  { k: ['llevar', 'que traer', 'equipaje'], a: 'Trae traje de baño, toalla, bloqueador solar, repelente y una muda extra de ropa.' },
  { k: ['cabaña', 'cabana', 'cuarto', 'hospedaje', 'dormir'], a: 'Tenemos cabañas rústicas — mira la disponibilidad en el calendario de "Disponibilidad y reservas" y elige tus fechas ahí mismo.' },
  { k: ['camping', 'campamento', 'tienda de campaña'], a: 'Sí, hay área de campamento — trae tu propia tienda de campaña. Revisa el precio en la sección de planes.' },
  { k: ['evento'], a: 'Puedes ver los próximos eventos en la sección "Eventos" de esta página.' },
  { k: ['reserva', 'reservar', 'apartar'], a: 'Elige tus fechas en el calendario de la cabaña que te interese y presiona "Solicitar por WhatsApp" — o escríbenos directo.' },
  { k: ['horario', 'hora abren', 'hora cierran'], a: 'Los horarios pueden variar por temporada — confírmalos por WhatsApp el mismo día o un día antes de tu visita.' }
];

function scriptedAnswer(q){
  const norm = q.toLowerCase();
  const hit = FAQS.find(f => f.k.some(k => norm.indexOf(k) !== -1));
  return hit ? hit.a : null;
}

function addMsg(role, text){
  const box = document.getElementById('chat-body');
  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg--' + role;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

function handleChatSend(text){
  if (!text.trim()) return;
  addMsg('user', text);
  const scripted = scriptedAnswer(text);
  addMsg('bot', scripted || 'No tengo esa respuesta a la mano — escríbenos por WhatsApp y te ayudamos directo.');
}

function wireChat(){
  const quickRoot = document.getElementById('chat-quick');
  ['¿Cuánto cuesta?', '¿Cómo llego?', '¿Qué llevar?', '¿Hay eventos?'].forEach(q => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = q;
    b.onclick = () => handleChatSend(q);
    quickRoot.appendChild(b);
  });
  document.getElementById('dino-fab').onclick = () => {
    const panel = document.getElementById('chat-panel');
    panel.hidden = !panel.hidden;
    if (!panel.hidden && !document.getElementById('chat-body').children.length){
      addMsg('bot', '¡Hola! Soy Gibrando 🦕. Pregúntame sobre precios, cabañas, cómo llegar o eventos.');
    }
  };
  document.getElementById('chat-close').onclick = () => { document.getElementById('chat-panel').hidden = true; };
  document.getElementById('chat-send').onclick = () => {
    const input = document.getElementById('chat-input');
    const val = input.value;
    input.value = '';
    handleChatSend(val);
  };
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('chat-send').click();
  });
  document.getElementById('chat-whats').addEventListener('click', () => {
    document.getElementById('chat-whats').href = waLink(STATE.whatsapp, 'Hola, tengo una pregunta sobre Los Filtros Gibrando\'s Park.');
  });
}

async function init(){
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    if (res.ok) STATE = await res.json();
  } catch (e) {
    STATE = FALLBACK_STATE;
  }
  await fetchLiveAvailability();
  renderCabins();
  renderEvents();
  refreshWhatsLinks();
  wireCalendar();
  wireChat();
  wireReveal();
}

document.addEventListener('DOMContentLoaded', init);
