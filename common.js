const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['L','M','M','J','V','S','D'];

function pad(n){ return String(n).padStart(2, '0'); }
function isoDate(y, m, d){ return y + '-' + pad(m + 1) + '-' + pad(d); }
function todayIso(){ const t = new Date(); return isoDate(t.getFullYear(), t.getMonth(), t.getDate()); }
function fromIso(s){ const p = s.split('-').map(Number); return { y: p[0], m: p[1] - 1, d: p[2] }; }
function fmtLarga(s){ const p = fromIso(s); return p.d + ' de ' + MESES[p.m] + ' de ' + p.y; }
function fmtCorta(s){ const p = fromIso(s); return p.d + ' ' + MESES[p.m].slice(0, 3); }

function esc(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function datesBetween(a, b){
  const out = [];
  const pa = fromIso(a), pb = fromIso(b);
  let d = new Date(pa.y, pa.m, pa.d);
  const end = new Date(pb.y, pb.m, pb.d);
  while (d <= end){
    out.push(isoDate(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function monthGrid(cabin, year, month, opts){
  opts = opts || {};
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const nDays = new Date(year, month + 1, 0).getDate();
  const today = todayIso();
  let cells = '';
  for (let i = 0; i < startOffset; i++) cells += '<span class="cal-day cal-day--empty"></span>';
  for (let d = 1; d <= nDays; d++){
    const dateStr = isoDate(year, month, d);
    const isPast = dateStr < today;
    const isBlocked = cabin.blocked.indexOf(dateStr) !== -1;
    const cls = isPast ? 'cal-day--past' : isBlocked ? 'cal-day--blocked' : 'cal-day--free';
    cells += '<button type="button" class="cal-day ' + cls + '" data-cabin="' + cabin.id + '" data-date="' + dateStr + '" ' + (isPast ? 'disabled' : '') + '>' + d + '</button>';
  }
  return '<div class="cal-month"><div class="cal-month-head">' + MESES[month] + ' ' + year + '</div>' +
    '<div class="cal-weekdays">' + DIAS.map(x => '<span>' + x + '</span>').join('') + '</div>' +
    '<div class="cal-grid">' + cells + '</div></div>';
}

function twoMonthsHTML(cabin){
  const now = new Date();
  const m1 = monthGrid(cabin, now.getFullYear(), now.getMonth());
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const m2 = monthGrid(cabin, next.getFullYear(), next.getMonth());
  return '<div class="cal-two-months">' + m1 + m2 + '</div>';
}

function waLink(whatsapp, msg){
  return 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(msg);
}
