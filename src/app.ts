import { Player } from "./player.js";
import { TRACKS, iconSvg } from "./tracks.js";

const APP_VERSION = "0.1.0";
/** Kacheln, die gerade nicht spielen, werden leicht abgedunkelt („bitte warten“). */
const DIM_OTHER_TILES_WHILE_PLAYING = true;
/** So lange muss das Schloss gedrückt werden, um den Elternbereich zu öffnen. */
const PARENT_HOLD_MS = 2500;

const player = new Player();
const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

// ---------------------------------------------------------------------------
// Kindermodus: Zoomen, Scrollen, Kontextmenüs & Co. unterbinden
// ---------------------------------------------------------------------------
function lockDownGestures(): void {
  const prevent = (e: Event) => e.preventDefault();
  document.addEventListener("contextmenu", prevent);
  document.addEventListener("gesturestart", prevent);  // iOS Pinch-Zoom
  document.addEventListener("gesturechange", prevent);
  document.addEventListener("dblclick", prevent);
  document.addEventListener("selectstart", prevent);
  document.addEventListener("dragstart", prevent);
  document.addEventListener("touchmove", e => {
    if (!(e.target as HTMLElement).closest(".scrollable")) e.preventDefault();
  }, { passive: false });
  // Mehr-Finger-Touch (z. B. ganze Hand) nicht als Zoom interpretieren
  document.addEventListener("touchstart", e => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
}

// ---------------------------------------------------------------------------
// Soundboard
// ---------------------------------------------------------------------------
function buildBoard(): void {
  const board = $<HTMLDivElement>("#board");
  for (const t of TRACKS) {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.dataset.id = t.id;
    tile.style.setProperty("--bg", t.bg);
    tile.setAttribute("aria-label", t.title);
    tile.innerHTML = iconSvg(t.icon, t.fg);
    attachTileHandlers(tile, t.id);
    board.appendChild(tile);
  }

  player.onStart = id => {
    document.body.classList.add("is-playing");
    document.querySelector(`.tile[data-id="${id}"]`)?.classList.add("active");
  };
  player.onEnd = () => {
    document.body.classList.remove("is-playing");
    document.querySelectorAll(".tile.active").forEach(el => el.classList.remove("active"));
  };
  if (DIM_OTHER_TILES_WHILE_PLAYING) document.body.classList.add("dim-while-playing");
}

function attachTileHandlers(tile: HTMLElement, id: string): void {
  // Ist das Audio schon freigeschaltet, reagieren wir sofort beim Berühren.
  // Beim allerersten Tippen verlangt iOS dagegen das Loslassen (pointerup),
  // damit Audio überhaupt starten darf.
  let handled = false;
  tile.addEventListener("pointerdown", () => {
    handled = false;
    if (player.isUnlocked) {
      handled = true;
      player.play(id);
    }
  });
  tile.addEventListener("pointerup", async () => {
    if (handled) return;
    handled = true;
    await player.unlock();
    player.play(id);
  });
}

async function preloadSounds(): Promise<void> {
  const results = await Promise.allSettled(TRACKS.map(t => player.load(t.id, t.file)));
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error("Sound konnte nicht geladen werden:", TRACKS[i].file, r.reason);
      document.querySelector(`.tile[data-id="${TRACKS[i].id}"]`)?.classList.add("missing");
    }
  });
  document.body.classList.add("ready");
}

// ---------------------------------------------------------------------------
// Elternbereich: Schloss gedrückt halten → Rechenaufgabe → Menü
// ---------------------------------------------------------------------------
function setupParentLock(): void {
  const btn = $<HTMLButtonElement>("#parent-lock");
  let timer: number | undefined;

  const cancel = () => {
    btn.classList.remove("holding");
    window.clearTimeout(timer);
  };
  btn.style.setProperty("--hold-ms", `${PARENT_HOLD_MS}ms`);
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    btn.classList.add("holding");
    timer = window.setTimeout(() => {
      cancel();
      openGate();
    }, PARENT_HOLD_MS);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, cancel));
}

function openGate(): void {
  const a = 2 + Math.floor(Math.random() * 6);
  const b = 2 + Math.floor(Math.random() * 6);
  const answer = a + b;
  const options = new Set<number>([answer]);
  while (options.size < 3) {
    const o = answer + Math.floor(Math.random() * 7) - 3;
    if (o > 0) options.add(o);
  }
  $("#gate-question").textContent = `${a} + ${b} = ?`;
  const box = $<HTMLDivElement>("#gate-options");
  box.innerHTML = "";
  [...options].sort(() => Math.random() - 0.5).forEach(o => {
    const b2 = document.createElement("button");
    b2.textContent = String(o);
    b2.addEventListener("click", () => {
      closeDialog("#gate");
      if (o === answer) openParentMenu();
    });
    box.appendChild(b2);
  });
  openDialog("#gate");
}

function openParentMenu(): void {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  $("#install-hint").hidden = standalone;
  $("#fullscreen-btn").hidden = standalone || !document.documentElement.requestFullscreen;
  $("#version").textContent = APP_VERSION;
  updateOfflineStatus();
  openDialog("#parent");
}

async function updateOfflineStatus(): Promise<void> {
  const el = $("#offline-status");
  if (!("caches" in window)) {
    el.textContent = "Offline-Speicher wird von diesem Browser nicht unterstützt.";
    return;
  }
  try {
    let count = 0;
    for (const t of TRACKS) if (await caches.match(t.file)) count++;
    el.textContent = count === TRACKS.length
      ? "✓ Alle Sounds sind offline gespeichert."
      : `${count} von ${TRACKS.length} Sounds offline gespeichert – App einmal mit Internet öffnen.`;
  } catch {
    el.textContent = "Offline-Status unbekannt.";
  }
}

function openDialog(sel: string): void {
  $(sel).hidden = false;
}
function closeDialog(sel: string): void {
  $(sel).hidden = true;
}

function setupParentMenu(): void {
  $("#parent-close").addEventListener("click", () => closeDialog("#parent"));
  $("#gate-cancel").addEventListener("click", () => closeDialog("#gate"));
  $("#stop-btn").addEventListener("click", () => player.stop());
  $("#fullscreen-btn").addEventListener("click", () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    closeDialog("#parent");
  });
}

// ---------------------------------------------------------------------------
// Offline (Service Worker)
// ---------------------------------------------------------------------------
function registerServiceWorker(): void {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(err =>
      console.warn("Service Worker nicht registriert:", err));
  }
}

// ---------------------------------------------------------------------------
lockDownGestures();
buildBoard();
setupParentLock();
setupParentMenu();
registerServiceWorker();
void preloadSounds();
