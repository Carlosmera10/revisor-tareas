// Service worker del Revisor de Tareas
// - Primero intenta descargar de internet (así siempre ves la última versión);
//   solo si no hay conexión usa la copia guardada.
// - Guarda también la tipografía para que se vea igual sin conexión.
// - Al pulsar una notificación, abre (o enfoca) la app y la tarea correspondiente.
// - Los botones de la notificación dejan su acción en IndexedDB; la app la aplica
//   al momento si está abierta, o al abrirla si estaba cerrada.
const CACHE = "revisor-v14";
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

const IDB_NAME = "revisorTareas_db", IDB_STORE = "kv", ACT_KEY = "notifActions";
function queueAction(entry) {
  return new Promise((res, rej) => {
    const r = indexedDB.open(IDB_NAME);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(IDB_STORE)) r.result.createObjectStore(IDB_STORE); };
    r.onerror = () => rej(r.error);
    r.onsuccess = () => {
      const db = r.result, t = db.transaction(IDB_STORE, "readwrite"), s = t.objectStore(IDB_STORE);
      const g = s.get(ACT_KEY);
      g.onsuccess = () => s.put([...(g.result || []), entry], ACT_KEY);
      t.oncomplete = () => { db.close(); res(); };
      t.onerror = t.onabort = () => { db.close(); rej(t.error); };
    };
  });
}
async function handleNotifAction(action, d) {
  await queueAction({ action, itemId: d.itemId, kind: d.kind || "task", at: Date.now() });
  const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  wins.forEach(w => w.postMessage({ type: "notif-action" }));
}

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const d = e.notification.data || {};
  if (e.action) { e.waitUntil(handleNotifAction(e.action, d)); return; }
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
