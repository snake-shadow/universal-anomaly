
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private lastZoomSoundTime: number = 0;
  private beepInterval: ReturnType<typeof setTimeout> | null = null;

  init() {
    if (this.isInitialized) return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.15; // Moderate master volume
      this.masterGain.connect(this.ctx.destination);
      
      this.startAmbient();
      this.isInitialized = true;
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  toggleMute(): boolean {
    if (!this.masterGain || !this.ctx) return true;
    
    this.isMuted = !this.isMuted;
    
    // Smooth fade
    const currentTime = this.ctx.currentTime;
    if (this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(currentTime);
      this.masterGain.gain.setTargetAtTime(0, currentTime, 0.2);
    } else {
      this.masterGain.gain.cancelScheduledValues(currentTime);
      this.masterGain.gain.setTargetAtTime(0.15, currentTime, 0.2);
    }
    
    // Resume context if suspended (common browser policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.isMuted;
  }

  private startAmbient() {
    if (this.beepInterval) clearInterval(this.beepInterval);
    this.scheduleNextBeep();
  }

  private scheduleNextBeep() {
    // Schedule random beeps between 3 and 8 seconds
    const delay = 3000 + Math.random() * 5000;
    
    this.beepInterval = setTimeout(() => {
      this.playCosmicBeep();
      this.scheduleNextBeep();
    }, delay);
  }

  private playCosmicBeep() {
    if (!this.ctx || !this.masterGain || this.ctx.state === 'suspended' || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();

    osc.type = 'sine';
    
    // Soft, pentatonic scale frequencies for a pleasant, magical feel
    const frequencies = [392.00, 523.25, 587.33, 659.25, 783.99, 1046.50]; // G4, C5, D5, E5, G5, C6
    const freq = frequencies[Math.floor(Math.random() * frequencies.length)];
    
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    
    // Very soft envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.5); // Slow attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0); // Long, gentle decay

    // Random stereo panning
    pan.pan.setValueAtTime(-0.7 + Math.random() * 1.4, now);

    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 3.5);
  }

  playClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sci-fi "Glass" ping
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playSearch() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.resume();

    // Computer processing data sound
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + (i * 0.08);

        osc.type = 'square';
        osc.frequency.setValueAtTime(400 + Math.random() * 800, time);
        
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.05);
    }
  }

  playZoom() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    // Throttle zoom sound to avoid machine-gun effect
    if (Date.now() - this.lastZoomSoundTime < 150) return;
    this.lastZoomSoundTime = Date.now();
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Low "Whoosh"
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    // Filter to make it sound more like wind/movement
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  private resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audio = new AudioService();
