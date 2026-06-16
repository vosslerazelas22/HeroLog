// Web Audio API Synthesizer for Quest of Mind
// Synthesizes medieval and classic retro RPG sound effects dynamically in the browser

class NativeAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Tibetan Focus Gongs
  playFocusBell() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4 místico

      // Adiciona harmônicos do sino
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5 oitava acima

      const levelGain = this.ctx.createGain();
      levelGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.0);

      osc.connect(gain);
      subOsc.connect(levelGain);
      levelGain.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      subOsc.start();
      osc.stop(this.ctx.currentTime + 3.0);
      subOsc.stop(this.ctx.currentTime + 3.0);
    } catch (e) {
      console.warn("Audio Context blocked by browser auto-play policy or not supported:", e);
    }
  }

  // Epic Level Up Arpeggio
  playLevelUp() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Notas ascendentes: C4, E4, G4, C5, E5, G5, B5, C6 (Sétima maior mágica)
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 987.77, 1046.50];

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle'; // Suave mas com harmônicos retrô
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.6);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Coin Clinking sound for Shops and Claims
  playCoins() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const coinCount = 3;

      for (let i = 0; i < coinCount; i++) {
        const delay = i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Frequência super alta metálica
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77 + (i * 200), now + delay); // B5 e mais altos

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Panic heartbeat when leaving the focus window (Wilderness Mode)
  playWildernessWarning() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Duas batidas de coração compassadas
      const beats = [0, 0.25];

      beats.forEach((time) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, now + time); // Sub-bass 55Hz (sinistro!)

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.5, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.2);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Fail / Death Sound
  playDeath() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 1.2); // Frequência despencando

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const sound = new NativeAudioEngine();
