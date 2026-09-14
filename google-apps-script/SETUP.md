# Conectar las reservaciones del sitio a Google Calendar

Esto hace que cuando alguien reserve en el sitio web, aparezca automáticamente
en su Google Calendar — sin que ustedes tengan que anotarlo a mano. Se hace
una sola vez, con la cuenta de Google de la familia.

## 1. Crea un calendario dedicado (recomendado, no obligatorio)

1. En [calendar.google.com](https://calendar.google.com), en "Otros calendarios" → **+** → **Crear nuevo calendario**.
2. Nómbralo, por ejemplo, `Gibrando's Park — Reservaciones`.
3. En la configuración de ese calendario, copia su **ID de calendario** (se ve como `algo@group.calendar.google.com`, o el mismo correo de la cuenta si usan el calendario principal). Lo vas a necesitar en el paso 3.

## 2. Crea el proyecto de Apps Script

1. Ve a [script.google.com](https://script.google.com) → **Proyecto nuevo**.
2. Borra el contenido de `Code.gs` que aparece por default.
3. Copia y pega todo el contenido del archivo [`Code.gs`](./Code.gs) de esta carpeta.
4. Arriba, dale un nombre al proyecto, por ejemplo `Gibrandos Park Reservaciones`.

## 3. Configura las 3 líneas de arriba del archivo

```js
var CALENDAR_ID = 'PON_AQUI_EL_ID_DEL_CALENDARIO';
var SHARED_SECRET = 'CAMBIA-ESTA-PALABRA-SECRETA';
var CABINS = {
  sauce: 'Cabaña El Sauce',
  nogal: 'Cabaña El Nogal'
};
```

- `CALENDAR_ID`: pega el ID que copiaste en el paso 1.
- `SHARED_SECRET`: inventa una palabra/frase larga y única (como una contraseña). Esto evita que alguien más use el sistema para llenar su calendario de reservaciones falsas.
- `CABINS`: debe tener el mismo `id` de cada cabaña que usa `data.json` en el sitio (ahora mismo: `sauce` y `nogal`) — si agregan o quitan cabañas, actualízalo aquí también.

## 4. Publica el proyecto como "Aplicación web"

1. Arriba a la derecha, botón **Implementar** → **Nueva implementación**.
2. Tipo: **Aplicación web**.
3. "Ejecutar como": **Yo** (tu cuenta).
4. "Quién tiene acceso": **Cualquier usuario**.
5. **Implementar**. La primera vez te va a pedir autorizar permisos — es normal, es tu propio script pidiendo acceso a tu propio calendario. Acepta.
6. Copia la **URL de la aplicación web** que te da (algo como `https://script.google.com/macros/s/AKfycb.../exec`).

## 5. Pega esos dos datos en el sitio web

Abre `site.js` en el repositorio y busca estas líneas casi al inicio:

```js
const BOOKING_SCRIPT_URL = "PON_AQUI_LA_URL_DE_APPS_SCRIPT";
const BOOKING_SECRET = "CAMBIA-ESTA-PALABRA-SECRETA";
```

Reemplaza con la URL del paso 4 y la misma palabra secreta del paso 3 (**debe ser idéntica en los dos lugares**). Guarda, sube el cambio a GitHub, y listo.

## Qué pasa después de esto

- El calendario del sitio (en la sección "Disponibilidad y reservas") ahora lee directo de este Google Calendar — ya no hay que marcar manualmente los días ocupados en `admin.html`.
- Cuando alguien reserva, aparece un evento nuevo en el calendario con el nombre y teléfono del visitante, y la nota "Pago: pendiente, se paga al llegar al parque."
- Si tienen la app de Google Calendar en el teléfono, van a recibir notificación cuando se cree el evento (revisen que las notificaciones de "nuevos eventos" estén activadas para ese calendario en la app).
- Si alguien cancela o cambia de fecha, simplemente editen o borren el evento directo en Google Calendar — el sitio lo reflejará la próxima vez que alguien abra la página.
