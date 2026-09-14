# Los Filtros · Gibrando's Park

Sitio web del balneario (San Francisco de Conchos, Chihuahua). Publicado con GitHub Pages — sin servidor, sin costo de hosting.

## Reservaciones → Google Calendar

Cuando alguien reserva una cabaña desde el sitio, el evento se crea solo en el Google Calendar
de la familia (con nombre, teléfono y nota de "paga al llegar"). Así solo revisan su calendario
de siempre — no hay que anotar nada a mano. Configuración de una sola vez:
ver [`google-apps-script/SETUP.md`](./google-apps-script/SETUP.md).

Antes de configurar eso, el sitio sigue funcionando con el botón de WhatsApp de siempre.

## Editar precios y eventos

1. Abre `admin.html` (desde el sitio publicado: `https://TU-USUARIO.github.io/los-filtros-gibrandos-park/admin.html`).
2. Edita los precios de cada cabaña, camping, día de campo, y los eventos.
3. Presiona **"Generar archivo actualizado"** y descarga `data.json`.
4. En GitHub, entra al repositorio → abre el archivo `data.json` → ícono de lápiz (editar) → borra el contenido y pega el nuevo (o usa "Upload files" y sube el archivo descargado reemplazando el existente) → **Commit changes**.
5. En 1-2 minutos GitHub Pages vuelve a publicar el sitio automáticamente con los datos nuevos.

(La disponibilidad de cabañas ya no se edita aquí — eso vive en Google Calendar, ver arriba.)

No se necesita ninguna cuenta especial ni contraseña — cualquiera con acceso de escritura a este repositorio de GitHub puede editar el contenido así.

## Antes de compartir el sitio

- Reemplaza el número de WhatsApp de muestra (`52XXXXXXXXXX`) en `data.json` (o desde `admin.html`) por el número real, en formato `52` + 10 dígitos, sin espacios.
- Reemplaza las fotos de muestra de la sección "Galería" (`index.html`, bloques `.tile`) por fotos reales del lugar cuando estén disponibles.

## Estructura

- `index.html` / `styles.css` / `common.js` / `site.js` — el sitio público.
- `admin.html` / `admin.js` — panel para editar `data.json` (no público, sin buscador lo indexa por defecto, pero cualquiera con el enlace puede abrirlo — no hay datos sensibles ahí, solo disponibilidad/precios/eventos).
- `data.json` — precios, eventos y datos de cada cabaña. El campo `blocked` de cada cabaña es solo un respaldo por si Google Calendar no está configurado todavía o no responde — una vez configurado, Calendar manda.
- `google-apps-script/` — el código y las instrucciones para conectar las reservaciones a Google Calendar.
- `logo.png` — logo del balneario.

## Sobre el asistente "Gibrando"

Responde preguntas frecuentes (precio, ubicación, qué llevar, eventos) al instante, sin necesidad de conexión a ningún servidor — no usa inteligencia artificial real todavía. Si más adelante quieren que conteste preguntas libres con IA real, se necesitaría una función de backend (por ejemplo con Netlify Functions) y una llave de API de Anthropic propia — no está incluido en esta versión para no generar costos recurrentes sin que ustedes lo decidan primero.
