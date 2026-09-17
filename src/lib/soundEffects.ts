// Mid-fi 90s Console Sound Effects Engine (N64 / PS1 Era)
// Implements HTML5 Audio (HTMLAudioElement with synthesized 90s PCM WAV audio)
// & Web Audio API synthesis for zero latency and offline guarantee.

function createWavDataUri(sampleRate: number, samples: Int16Array): string {
  const numSamples = samples.length;
  const buffer = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(buffer.buffer);

  // 'RIFF' chunk descriptor
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  // 'fmt ' subchunk
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample

  // 'data' subchunk
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  if (typeof Buffer !== 'undefined') {
    return 'data:audio/wav;base64,' + Buffer.from(buffer).toString('base64');
  }

  // Browser binary string conversion
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

// Pre-generate 90s console PCM WAV audio data URIs for native HTML5 Audio
function generateCoinWav(): string {
  const sampleRate = 22050;
  const duration = 0.4;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = t < 0.07 ? 987.77 : 1318.51; // B5 -> E6
    const phase = (t * freq) % 1;
    const tri = 2 * Math.abs(2 * phase - 1) - 1;
    const shimmer = 0.25 * Math.sin(2 * Math.PI * 2637 * t) * Math.exp(-t * 12);
    const decay = Math.exp(-t * 9);
    const s = (tri * 0.7 + shimmer) * decay;
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 28000)));
  }
  return createWavDataUri(sampleRate, buffer);
}

function generateChestOpenWav(): string {
  const sampleRate = 22050;
  const duration = 0.65;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;

    // Latch click at t < 0.05
    if (t < 0.05) {
      const clickFreq = 620 - (t / 0.05) * 440;
      s += Math.sin(2 * Math.PI * clickFreq * t) * Math.exp(-t * 80);
    }

    // Heavy wood creak (t: 0.04 to 0.45)
    if (t >= 0.04 && t < 0.48) {
      const creakT = t - 0.04;
      const creakFreq = 140 + creakT * 200;
      const creakPhase = (creakT * creakFreq) % 1;
      const saw = 2 * creakPhase - 1;
      s += saw * 0.35 * Math.sin((creakT / 0.44) * Math.PI);
    }

    // Wood thud at t >= 0.35
    if (t >= 0.35) {
      const thudT = t - 0.35;
      const thudFreq = Math.max(40, 110 - thudT * 200);
      s += Math.sin(2 * Math.PI * thudFreq * thudT) * 0.5 * Math.exp(-thudT * 14);
    }

    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 26000)));
  }
  return createWavDataUri(sampleRate, buffer);
}

function generateDiscoveryWav(): string {
  const sampleRate = 22050;
  const duration = 1.1;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);
  const notes = [
    { freq: 392.0, start: 0.0, dur: 0.12 }, // G4
    { freq: 523.25, start: 0.1, dur: 0.12 }, // C5
    { freq: 659.25, start: 0.2, dur: 0.14 }, // E5
    { freq: 783.99, start: 0.32, dur: 0.18 }, // G5
    { freq: 1046.5, start: 0.48, dur: 0.6 }, // C6
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    for (const n of notes) {
      if (t >= n.start && t < n.start + n.dur) {
        const nt = t - n.start;
        const phase = (nt * n.freq) % 1;
        const tri = 2 * Math.abs(2 * phase - 1) - 1;
        s += tri * 0.4 * Math.exp(-nt * 3.5);
      }
    }
    // Sub-harmonic warm bass on final note
    if (t >= 0.48) {
      const bt = t - 0.48;
      s += Math.sin(2 * Math.PI * 261.63 * bt) * 0.25 * Math.exp(-bt * 2.5);
    }
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 27000)));
  }
  return createWavDataUri(sampleRate, buffer);
}

function generateButtonTapWav(): string {
  const sampleRate = 22050;
  const duration = 0.06;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 340 - (t / 0.06) * 220;
    const phase = (t * freq) % 1;
    const tri = 2 * Math.abs(2 * phase - 1) - 1;
    const s = tri * Math.exp(-t * 45);
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 25000)));
  }
  return createWavDataUri(sampleRate, buffer);
}

function generateWrongWav(): string {
  const sampleRate = 22050;
  const duration = 0.25;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    // Two short sawtooth buzzes
    if ((t >= 0 && t < 0.09) || (t >= 0.12 && t < 0.21)) {
      const bt = t >= 0.12 ? t - 0.12 : t;
      const freq = 140 - bt * 350;
      const phase = (bt * freq) % 1;
      const saw = 2 * phase - 1;
      s = saw * 0.45 * Math.exp(-bt * 12);
    }
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 28000)));
  }
  return createWavDataUri(sampleRate, buffer);
}

function generateVictoryWav(): string {
  const sampleRate = 22050;
  const duration = 1.9;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);
  const notes = [
    { freq: 261.63, start: 0.0, dur: 0.12 },
    { freq: 261.63, start: 0.14, dur: 0.12 },
    { freq: 261.63, start: 0.28, dur: 0.12 },
    { freq: 392.0, start: 0.42, dur: 0.32 },
    { freq: 329.63, start: 0.76, dur: 0.18 },
    { freq: 392.0, start: 0.96, dur: 0.18 },
    { freq: 523.25, start: 1.16, dur: 0.7 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    for (const n of notes) {
      if (t >= n.start && t < n.start + n.dur) {
        const nt = t - n.start;
        const phase = (nt * n.freq) % 1;
        const tri = 2 * Math.abs(2 * phase - 1) - 1;
        s += tri * 0.42 * Math.exp(-nt * 2.8);
      }
    }
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(s * 28000)));
  }
  return createWavDataUri(sampleRate, buffer);
}

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private audioCache: Record<string, string> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('scavenger_sound_muted');
        this.isMuted = savedMute === 'true';
      } catch {
        // localStorage not available
      }

      // Pre-warm WAV audio cache
      try {
        this.audioCache = {
          coin: generateCoinWav(),
          chest: generateChestOpenWav(),
          discovery: generateDiscoveryWav(),
          tap: generateButtonTapWav(),
          wrong: generateWrongWav(),
          victory: generateVictoryWav(),
        };
      } catch (err) {
        console.warn('WAV cache generation error:', err);
      }

      // Robust Auto-unlock on first user gesture across mobile browsers (iOS & Android)
      const unlock = () => {
        const c = this.initContext();
        if (c && c.state === 'suspended') {
          c.resume().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchend', unlock);
        window.removeEventListener('click', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('touchend', unlock, { once: true, passive: true });
      window.addEventListener('click', unlock, { once: true, passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          // AudioContext blocked
        }
      }
    }
    return this.ctx;
  }

  private playHtml5Audio(soundKey: string): boolean {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
    try {
      let uri = this.audioCache[soundKey];
      if (!uri) {
        if (soundKey === 'coin') uri = generateCoinWav();
        else if (soundKey === 'chest') uri = generateChestOpenWav();
        else if (soundKey === 'discovery') uri = generateDiscoveryWav();
        else if (soundKey === 'tap') uri = generateButtonTapWav();
        else if (soundKey === 'wrong') uri = generateWrongWav();
        else if (soundKey === 'victory') uri = generateVictoryWav();
        if (uri) this.audioCache[soundKey] = uri;
      }

      if (!uri) return false;
      const audio = new Audio(uri);
      audio.volume = 0.85;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('scavenger_sound_muted', muted ? 'true' : 'false');
      } catch {
        // ignore
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * 1. GOLDEN COIN CLINK
   * Mid-fi 90s console golden coin clink (Mario 64 / Banjo doubloon collect).
   * Dual frequency chime with metallic shimmer and rapid decay using HTML5 Audio.
   */
  public playCoin(): boolean {
    if (this.isMuted) return false;
    this.playHtml5Audio('coin');

    const ctx = this.initContext();
    if (ctx && ctx.state !== 'suspended') {
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(987.77, now);
        osc1.frequency.setValueAtTime(1318.51, now + 0.07);

        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2637.02, now + 0.07);

        gain2.gain.setValueAtTime(0.18, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.45);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.35);
      } catch {
        // ignore
      }
    }
    return true;
  }

  /**
   * 2. WOODEN CHEST OPENING
   * Heavy creaking wooden lid resonance, latch pop, and resonant hollow wood thud.
   */
  public playChestOpen(): boolean {
    if (this.isMuted) return false;
    this.playHtml5Audio('chest');

    const ctx = this.initContext();
    if (ctx && ctx.state !== 'suspended') {
      try {
        const now = ctx.currentTime;
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(620, now);
        clickOsc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
        clickGain.gain.setValueAtTime(0.3, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.05);

        const creakOsc = ctx.createOscillator();
        const creakGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        creakOsc.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(750, now + 0.35);

        creakOsc.frequency.setValueAtTime(140, now + 0.04);
        creakOsc.frequency.linearRampToValueAtTime(240, now + 0.2);
        creakOsc.frequency.linearRampToValueAtTime(190, now + 0.38);

        creakGain.gain.setValueAtTime(0.01, now);
        creakGain.gain.linearRampToValueAtTime(0.28, now + 0.1);
        creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        creakOsc.connect(filter);
        filter.connect(creakGain);
        creakGain.connect(ctx.destination);

        creakOsc.start(now + 0.04);
        creakOsc.stop(now + 0.48);

        const thudOsc = ctx.createOscillator();
        const thudGain = ctx.createGain();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(110, now + 0.35);
        thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.65);

        thudGain.gain.setValueAtTime(0.35, now + 0.35);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        thudOsc.connect(thudGain);
        thudGain.connect(ctx.destination);

        thudOsc.start(now + 0.35);
        thudOsc.stop(now + 0.65);
      } catch {
        // ignore
      }
    }
    return true;
  }

  /**
   * 3. ADVENTURE DISCOVERY JINGLE
   * Classic 90s console 5-note discovery fanfare (Zelda/Banjo "Secret Discovered" arpeggio).
   * Notes: G4 -> C5 -> E5 -> G5 -> C6 with warm retro triangle harmony.
   */
  public playDiscoveryJingle(): boolean {
    if (this.isMuted) return false;
    this.playHtml5Audio('discovery');

    const ctx = this.initContext();
    if (ctx && ctx.state !== 'suspended') {
      try {
        const now = ctx.currentTime;
        const notes = [
          { freq: 392.0, time: 0.0, dur: 0.12 },
          { freq: 523.25, time: 0.1, dur: 0.12 },
          { freq: 659.25, time: 0.2, dur: 0.14 },
          { freq: 783.99, time: 0.32, dur: 0.18 },
          { freq: 1046.5, time: 0.48, dur: 0.65 },
        ];

        notes.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, now + note.time);

          gain.gain.setValueAtTime(0.28, now + note.time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + note.time);
          osc.stop(now + note.time + note.dur);
        });

        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(261.63, now + 0.48);
        subGain.gain.setValueAtTime(0.2, now + 0.48);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now + 0.48);
        subOsc.stop(now + 1.1);
      } catch {
        // ignore
      }
    }
    return true;
  }

  /**
   * 4. BUTTON TAP / WOODEN BLOCK CLICK
   * Chunky 90s UI wooden menu button tap.
   */
  public playButtonTap(): boolean {
    if (this.isMuted) return false;
    this.playHtml5Audio('tap');

    const ctx = this.initContext();
    if (ctx && ctx.state !== 'suspended') {
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
      } catch {
        // ignore
      }
    }
    return true;
  }

  /**
   * 5. WRONG ANSWER / ERROR BUZZ
   * Low retro 90s dual buzz for incorrect riddle answer.
   */
  public playWrong(): boolean {
    if (this.isMuted) return false;
    this.playHtml5Audio('wrong');

    const ctx = this.initContext();
    if (ctx && ctx.state !== 'suspended') {
      try {
        const now = ctx.currentTime;
        [0, 0.12].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now + offset);
          osc.frequency.linearRampToValueAtTime(95, now + offset + 0.09);

          gain.gain.setValueAtTime(0.25, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.09);
        });
      } catch {
        // ignore
      }
    }
    return true;
  }

  /**
   * 6. GRAND VICTORY FANFARE
   * Grand triumphant 90s console fanfare when all checkpoints are cleared!
   */
  public playVictory(): boolean {
    if (this.isMuted) return false;
    this.playHtml5Audio('victory');

    const ctx = this.initContext();
    if (ctx && ctx.state !== 'suspended') {
      try {
        const now = ctx.currentTime;
        const fanfareNotes = [
          { freq: 261.63, time: 0.0, dur: 0.12 },
          { freq: 261.63, time: 0.14, dur: 0.12 },
          { freq: 261.63, time: 0.28, dur: 0.12 },
          { freq: 392.0, time: 0.42, dur: 0.35 },
          { freq: 329.63, time: 0.78, dur: 0.2 },
          { freq: 392.0, time: 0.98, dur: 0.2 },
          { freq: 523.25, time: 1.18, dur: 0.9 },
        ];

        fanfareNotes.forEach((n) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, now + n.time);

          gain.gain.setValueAtTime(0.3, now + n.time);
          gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + n.time);
          osc.stop(now + n.time + n.dur);
        });
      } catch {
        // ignore
      }
    }
    return true;
  }
}

export const soundFX = new SoundFXEngine();
