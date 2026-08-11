/**
 * 刮刮樂 — 音效：刮開（骰子／硬幣 ogg）+ Web Audio 合成中獎／沒中。
 */
export class GuagualeAudio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.cache = {};
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
  }

  async unlock() {
    this.ensure();
    if (this.ctx?.state === "suspended") await this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
  }

  /** 播放一個已拷入的 ogg。 */
  playFile(src, volume = 0.5) {
    if (!this.enabled) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    if (!this.cache[src]) {
      const a = new Audio(src);
      a.preload = "auto";
      this.cache[src] = a;
    }
    const a = this.cache[src];
    a.volume = volume;
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  }

  tone(freq, dur, type = "square", gain = 0.08, when = 0) {
    if (!this.enabled) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * 0.6, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.05, dur));
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.04);
  }

  /** 刮開一格：隨機骰子／硬幣聲。 */
  scratchOnce() {
    this.playFile(Math.random() < 0.5 ? "assets/sfx/dice-throw-1.ogg" : "assets/sfx/dice-throw-2.ogg", 0.4);
  }

  /** 刮到中獎格。 */
  hit() {
    this.playFile(Math.random() < 0.5 ? "assets/sfx/chips-stack-1.ogg" : "assets/sfx/chips-stack-2.ogg", 0.5);
    this.tone(659, 0.08, "square", 0.08);
  }

  /** 沒中。 */
  miss() {
    this.playFile("assets/sfx/chip-lay-1.ogg", 0.35);
  }

  /** 結算：大獎／小獎／銘謝惠顧。 */
  win() {
    const seq = [523, 659, 784, 1047];
    seq.forEach((f, i) => this.tone(f, 0.14, "square", 0.09, i * 0.12));
    this.tone(1319, 0.4, "square", 0.08, 0.5);
  }

  lose() {
    this.tone(220, 0.12, "sawtooth", 0.07);
    this.tone(180, 0.18, "sawtooth", 0.06, 0.1);
  }
}