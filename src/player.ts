/**
 * Audio-Wiedergabe über die Web Audio API.
 * - Alle Sounds werden vorab dekodiert (keine Verzögerung beim Antippen).
 * - Es läuft immer nur ein Sound; Antippen während der Wiedergabe wird ignoriert.
 */
type AudioCtxCtor = typeof AudioContext;

export class Player {
  private ctx: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private current: AudioBufferSourceNode | null = null;
  private master: GainNode;

  onStart: (id: string) => void = () => {};
  onEnd: (id: string) => void = () => {};

  constructor() {
    // iOS: Sound auch dann abspielen, wenn der Lautlos-Schalter aktiv ist (Safari 17+)
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      try { nav.audioSession.type = "playback"; } catch { /* ältere Version */ }
    }
    const Ctor: AudioCtxCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: AudioCtxCtor }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
  }

  get isPlaying(): boolean {
    return this.current !== null;
  }

  get isUnlocked(): boolean {
    return this.ctx.state === "running";
  }

  /** Muss aus einer Benutzer-Geste (Tippen) heraus aufgerufen werden. */
  async unlock(): Promise<void> {
    if (this.ctx.state !== "running") {
      try { await this.ctx.resume(); } catch { /* wird beim nächsten Tippen erneut versucht */ }
    }
  }

  async load(id: string, url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    const data = await res.arrayBuffer();
    const buffer = await new Promise<AudioBuffer>((resolve, reject) =>
      this.ctx.decodeAudioData(data, resolve, reject));
    this.buffers.set(id, buffer);
  }

  /** Spielt den Sound bis zum Ende. Gibt false zurück, wenn gerade etwas läuft. */
  play(id: string): boolean {
    if (this.current) return false;
    const buffer = this.buffers.get(id);
    if (!buffer) return false;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.master);
    src.onended = () => {
      if (this.current === src) {
        this.current = null;
        this.onEnd(id);
      }
    };
    this.current = src;
    src.start();
    this.onStart(id);
    return true;
  }

  /** Nur für den Elternbereich. */
  stop(): void {
    if (this.current) {
      try { this.current.stop(); } catch { /* bereits beendet */ }
    }
  }
}
