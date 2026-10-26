// Service worker del Revisor de Tareas
// - Primero intenta descargar de internet (así siempre ves la última versión);
//   solo si no hay conexión usa la copia guardada.
// - Guarda también la tipografía para que se vea igual sin conexión.
// - Al pulsar una notificación, abre (o enfoca) la app y la tarea correspondiente.
const CACHE = "revisor-v13";
const FONT_CACHE = "revisor-fonts-1";
const FILES = ["./", "index.html", "app.webmanifest", "icon-192.png", "icon-512.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith("revisor-") && k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Tipografía: primero la copia guardada (no cambia nunca).
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(FONT_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      })))
    );
    return;
  }
  if (url.origin !== location.origin) return;

  // Archivos de la app: primero internet; sin conexión, la copia guardada.
  e.respondWith(
    fetch(req, { cache: "no-store" })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const d = e.notification.data || {};
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if ("focus" in w) {
        await w.focus();
        if (d.itemId) w.postMessage({ type: "open-item", projectId: d.projectId, itemId: d.itemId });
        return;
      }
    }
    const target = new URL("./", self.registration.scope);
    if (d.itemId) { target.searchParams.set("project", d.projectId); target.searchParams.set("item", d.itemId); }
    await self.clients.openWindow(target.href);
  })());
});
