// ============================================================================
// Los Filtros · Gibrando's Park — Reservaciones en Google Calendar
// ============================================================================
// Qué hace:
//  - GET  ?action=busy   -> regresa qué días están ocupados por cabaña (para
//                           que el sitio web muestre el calendario en tiempo real)
//  - POST { action:'book', cabin, start, end, name, phone, secret }
//                        -> si las fechas están libres, crea el evento en
//                           Google Calendar y bloquea esos días
//
// CONFIGURA ESTAS 3 LÍNEAS ANTES DE USAR:

var CALENDAR_ID = 'PON_AQUI_EL_ID_DEL_CALENDARIO'; // ver SETUP.md
var SHARED_SECRET = 'CAMBIA-ESTA-PALABRA-SECRETA';  // cualquier palabra larga, solo la conoce el sitio web
var CABINS = {
  sauce: 'Cabaña El Sauce',
  nogal: 'Cabaña El Nogal'
};

// ============================================================================

function doGet(e) {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return jsonOut({ ok: false, error: 'calendario no encontrado — revisa CALENDAR_ID' });

  var now = new Date();
  var until = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 150); // 150 días adelante
  var events = cal.getEvents(now, until);

  var busy = {};
  for (var id in CABINS) busy[id] = [];

  events.forEach(function (ev) {
    var cabinId = cabinIdFromTitle(ev.getTitle());
    if (!cabinId) return;
    var start, end;
    if (ev.isAllDayEvent()) {
      start = ev.getAllDayStartDate();
      end = ev.getAllDayEndDate(); // exclusivo
    } else {
      start = ev.getStartTime();
      end = ev.getEndTime();
    }
    var d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (d < endDay) {
      busy[cabinId].push(formatIso(d));
      d.setDate(d.getDate() + 1);
    }
  });

  return jsonOut({ ok: true, busy: busy, updatedAt: new Date().toISOString() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonOut({ ok: false, error: 'cuerpo inválido' });
    }

    if (body.secret !== SHARED_SECRET) {
      return jsonOut({ ok: false, error: 'no autorizado' });
    }

    var cabinName = CABINS[body.cabin];
    if (!cabinName) return jsonOut({ ok: false, error: 'cabaña desconocida' });

    var startDate = parseIsoDate(body.start);
    var endDate = parseIsoDate(body.end); // última noche, inclusive
    if (!startDate || !endDate || endDate < startDate) {
      return jsonOut({ ok: false, error: 'fechas inválidas' });
    }
    var endExclusive = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);

    var name = String(body.name || '').trim();
    var phone = String(body.phone || '').trim();
    if (!name || !phone) return jsonOut({ ok: false, error: 'falta nombre o teléfono' });

    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) return jsonOut({ ok: false, error: 'calendario no encontrado' });

    var existing = cal.getEvents(startDate, endExclusive);
    var conflict = existing.some(function (ev) {
      return cabinIdFromTitle(ev.getTitle()) === body.cabin;
    });
    if (conflict) return jsonOut({ ok: false, error: 'ocupado' });

    var title = '[' + body.cabin + '] ' + cabinName + ' — ' + name;
    var description = [
      'Reservado desde el sitio web de Gibrando\'s Park.',
      'Nombre: ' + name,
      'Teléfono: ' + phone,
      'Pago: pendiente, se paga al llegar al parque.'
    ].join('\n');

    cal.createAllDayEvent(title, startDate, endExclusive, { description: description });

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ---- helpers ----

function cabinIdFromTitle(title) {
  var m = /^\[([a-zA-Z0-9_-]+)\]/.exec(title || '');
  if (!m) return null;
  return CABINS[m[1]] ? m[1] : null;
}

function formatIso(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function parseIsoDate(s) {
  if (!s) return null;
  var p = String(s).split('-').map(Number);
  if (p.length !== 3) return null;
  return new Date(p[0], p[1] - 1, p[2]);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
