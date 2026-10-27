// Every sound in the room is synthesised here; there are no audio files. Nothing is created until the
// visitor chooses sound, so a page that is only looked at never starts audio.

export function isAppleMobile(nav = globalThis.navigator) {
  if (!nav) return false;
  return /iPhone|iPad|iPod/.test(nav.userAgent || "") || (nav.platform === "MacIntel" && (nav.maxTouchPoints || 0) > 1);
}

export function createSound(win = globalThis) {
  return {
    ctx: null, out: null, enabled: false,
    onTalk: () => {},   // Oura listens here: how much she is "talking" right now
    start(on) {
      const AC = win.AudioContext || win.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.out = this.ctx.createGain(); this.out.gain.value = 0; this.out.connect(this.ctx.destination);
        // Oura's voice has its own channel so her ring can follow it
        this.voice = this.ctx.createGain(); this.voice.connect(this.out);
        this.an = this.ctx.createAnalyser(); this.an.fftSize = 512; this.voice.connect(this.an); this.buf = new Float32Array(512);
        const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        // the room's low machine hum and air handling
        const hum = this.ctx.createGain(); hum.gain.value = 0.03; hum.connect(this.out);
        [55, 110.2, 165.1].forEach((f, i) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.value = f; g.gain.value = [1, 0.4, 0.15][i]; o.connect(g).connect(hum); o.start(); });
        const air = this.ctx.createBufferSource(); air.buffer = buf; air.loop = true;
        const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480;
        const ga = this.ctx.createGain(); ga.gain.value = 0.035; air.connect(lp).connect(ga).connect(this.out); air.start();
        win.setInterval(() => {
          if (!this.enabled || Math.random() > 0.4) return;
          const f = [1568, 1760, 2093, 2349][Math.floor(Math.random() * 4)];
          this.tone(f, 0.07, "sine", 0.01); if (Math.random() < 0.5) this.tone(f * 1.5, 0.06, "sine", 0.007, 0.09);
        }, 1500);
      }
      this.ctx.resume();
      this.set(on);
    },
    set(on) { this.enabled = on; if (this.out) this.out.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.06); },
    suspend() { if (this.ctx) this.ctx.suspend(); },
    resume() { if (this.ctx) this.ctx.resume(); },
    tone(f, dur, type = "sine", vol = 0.1, when = 0, slideTo = null, dest = null) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(dest || this.out); o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, type = "bandpass", freq = 1000, vol = 0.1, when = 0, freqTo = null, q = 1) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + when, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = this.noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
      if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(this.out); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
    },
    level() {
      if (!this.an || !this.enabled) return 0;
      this.an.getFloatTimeDomainData(this.buf); let q = 0;
      for (let i = 0; i < this.buf.length; i++) q += this.buf[i] * this.buf[i];
      return Math.min(1, Math.sqrt(q / this.buf.length) * 16);
    },
    hover() { this.tone(2093, 0.05, "sine", 0.02); this.tone(3136, 0.04, "sine", 0.01, 0.03); },
    click() { this.tone(880, 0.1, "sine", 0.06); this.tone(1318.5, 0.14, "sine", 0.045, 0.05); },
    holo() { [392, 523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 1.3, "sine", 0.03, i * 0.06, f * 1.5)); this.noise(1.0, "bandpass", 500, 0.07, 0, 4200, 2); },
    zoom() { this.noise(0.9, "bandpass", 220, 0.2, 0, 2600, 1.2); },
    open() { [1318.5, 1975.5].forEach((f, i) => this.tone(f, 0.7, "sine", 0.03, 0.05 + i * 0.08)); },
    deny() { this.tone(330, 0.12, "triangle", 0.06); this.tone(247, 0.2, "triangle", 0.06, 0.13); },
    printer() { for (let i = 0; i < 11; i++) this.noise(0.05, "bandpass", 900 + i * 40, 0.13, i * 0.08, null, 3); this.tone(118, 0.9, "sawtooth", 0.018, 0, 150); },
    data() { for (let i = 0; i < 12; i++) this.tone(1200 + Math.random() * 1800, 0.035, "square", 0.012, i * 0.06); },
    spark() { for (let i = 0; i < 22; i++) this.tone(2000 + Math.random() * 3000, 0.025, "sine", 0.02, Math.random() * 0.7); },
    ivy() { [220, 277.2, 329.6, 415.3].forEach((f, i) => this.tone(f, 1.8, "sine", 0.035, i * 0.08)); },
    chime() { [1318.5, 1760, 2637].forEach((f, i) => this.tone(f, 1.5, "sine", 0.045, i * 0.13)); },
    whoosh() { this.noise(0.8, "bandpass", 280, 0.26, 0, 2400, 1.4); },
    boot() { [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 1.5, "sine", 0.04, i * 0.09)); },
    off() { [784, 659.3, 523.3].forEach((f, i) => this.tone(f, 0.5, "sine", 0.04, i * 0.08)); },
    greet(i) { this.tone([523.3, 587.3, 659.3, 784, 880, 1046.5][i % 6], 0.26, "triangle", 0.06); },
    // Oura's voice: soft gliding syllables
    bot(n = 4) {
      for (let i = 0; i < n; i++) {
        const f = 320 + Math.random() * 260, w = i * 0.12 + Math.random() * 0.03;
        this.tone(f, 0.17, "sine", 0.05, w, f * (Math.random() < 0.5 ? 1.25 : 0.8), this.voice); this.tone(f * 2.01, 0.14, "sine", 0.016, w, null, this.voice);
      }
      this.onTalk(0.25 * n);
    },
    botTalk() {
      const f = 300 + Math.random() * 300;
      this.tone(f, 0.12, "sine", 0.04, 0, f * (Math.random() < 0.5 ? 1.2 : 0.85), this.voice); this.tone(f * 3, 0.08, "sine", 0.01, 0, null, this.voice);
      this.onTalk(0.35);
    },
    pour() { [0, 0.1, 0.22].forEach((w, i) => this.tone(280 + i * 70, 0.09, "sine", 0.08, w, 900 + i * 160)); },
    jasmine() { [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 1.2, "sine", 0.025, i * 0.09)); },
  };
}
