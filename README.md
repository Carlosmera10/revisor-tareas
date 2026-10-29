# Revisor de Proyectos y Tareas

Gestor personal de proyectos y tareas, instalable como app (PWA) en el PC (Chrome) y en Android.

**App:** https://carlosmera10.github.io/revisor-tareas/

## Qué hace

- **Proyectos y tareas** con prioridades, etiquetas, sub-tareas, fecha y hora, avisos y notas con formato.
- **Estados**: En proceso, Pausada y Finalizada. Además, la marca aparte «En espera de…» para lo que depende de otra persona (vuelve a «Hoy» el día de reclamar).
- **Las finalizadas, siempre al final** de la lista, sea cual sea el orden elegido.
- **Vistas**: Hoy, Mañana, Próximos 7 días, Calendario (mes/semana en el PC; semana + día en el móvil), En espera y cada proyecto, en lista o Kanban.
- **Planificador** (tecla `P`): repasa las tareas en proceso como tarjetas, de la fecha más antigua a la más lejana.
- **Añadir escribiendo en español** (teclas `Q` / `N`): entiende fechas, horas, repeticiones, `#proyecto`, `@etiqueta` y `!alta` / `!urgente`.
- **Repetitivas**: al completarlas, la misma tarea pasa a su siguiente fecha.
- **Archivo**: las finalizadas se archivan solas y la app recuerda revisarlas pasados 1, 3 o 6 meses.
- **Correos a tareas (solo PC)**: soltar un `.msg` de Outlook o un `.eml`, o pegar un correo, crea la tarea.
- **Buscador en todo**, selección múltiple, mover y duplicar, deshacer (`Ctrl+Z`), modo oscuro y barra lateral plegable.
- **Avisos** con la app abierta (también minimizada). Con la app cerrada no es posible en Android sin un servidor de envío.

## Instalación

- **PC (Chrome)**: abre la dirección de arriba y pulsa «Instalar app» en la barra lateral (o el icono de instalar de la barra de direcciones).
- **Android (Chrome)**: menú ⋮ → «Añadir a pantalla de inicio» → «Instalar».
- Abrir el archivo desde el disco (`file://`) no permite instalarla ni usar notificaciones: usa siempre la dirección publicada.

## Dónde se guardan los datos

- En **IndexedDB** del navegador (`revisorTareas_db`), sin el límite de ~5 MB de `localStorage`. Los datos de versiones anteriores se migran solos la primera vez, sin borrar nada de golpe (las claves antiguas se limpian pasado un día).
- Los ajustes de la interfaz y los de sincronización de cada dispositivo van en `localStorage` con claves propias (`revisorGeneral_v9_*`).
- Usa «Exportar» para hacer copias de seguridad en un archivo JSON.

## Sincronizar el PC y el móvil

En **Ajustes y avisos → Sincronización** (con los pasos para crear el token dentro de la propia pantalla):

1. Crea un token de GitHub *fine-grained* con un único permiso de cuenta: **Gists: Read and write**.
2. Pégalo, elige una contraseña de cifrado (mínimo 8 caracteres, la misma en todos los dispositivos) y pulsa **Activar sincronización**.
3. Repite en el otro dispositivo con el mismo token y la misma contraseña.

Cómo funciona:

- Los datos se guardan en un **Gist secreto** de tu cuenta, **cifrados** en el navegador (PBKDF2-SHA256 de 600 000 vueltas + AES-GCM de 256 bits, con compresión previa). GitHub solo ve un texto ininteligible. Si pierdes la contraseña, esa copia no se puede recuperar (los datos de cada dispositivo siguen intactos).
- El token y la contraseña se guardan **solo en el `localStorage` de cada dispositivo**.
- Se sincroniza al abrir la app, unos segundos después de cada cambio, al volver a la app o recuperar la conexión, y cada 3 minutos.
- **Fusión elemento a elemento**: cada tarea, proyecto, etiqueta y entrada del archivo lleva su fecha de modificación (`updatedAt`) y en cada uno gana la versión más reciente. Los borrados se anotan (`deleted`, durante 180 días) para que no reaparezcan.
- **No se sincronizan** los ajustes, el orden de proyectos y tareas ni la interfaz. Sí se sincroniza el archivo. Un dispositivo recién estrenado adopta lo que hay en GitHub sin añadir un proyecto vacío.
- Si algo falla (token caducado o sin permiso, contraseña incorrecta…), aparece un aviso y un punto rojo en «Ajustes y avisos»; la sincronización queda en pausa hasta que lo corrijas y pulses «Sincronizar ahora».
- El Gist conserva el historial de versiones: si borras algo por error y ya se ha propagado, se puede recuperar desde la página del Gist en GitHub.
- **Respaldo manual**: «Enviar al otro dispositivo» genera un archivo; en el otro, «Importar» ofrece **fusionarlo** con lo que ya hay (o sustituirlo todo).

## Publicación

Se sirve con GitHub Pages desde la rama `main`, carpeta `/ (root)`. Archivos: `index.html`, `sw.js`, `app.webmanifest`, `icon-192.png`, `icon-512.png`. Si cambia `sw.js`, hay que subir antes el número de `CACHE`.
