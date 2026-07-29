/**
 * WeatherAudio — procedural weather sound effects using the Web Audio API.
 * No external sound files required; all sounds are synthesised in real time.
 */
export class WeatherAudio {
  private ctx: AudioContext | null = null

  // Rain — filtered noise
  private rainNode: AudioBufferSourceNode | null = null
  private rainGain: GainNode | null = null
  private rainFilter: BiquadFilterNode | null = null

  // Wind / ambient — low filtered noise
  private windNode: AudioBufferSourceNode | null = null
  private windGain: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null

  // Thunder — one-shot rumble
  private thunderGain: GainNode | null = null

  // Master
  private masterGain: GainNode | null = null
  private enabled = false

  // Target volume per channel (smoothed each frame)
  private targetRainVol = 0
  private targetWindVol = 0
  private currentRainVol = 0
  private currentWindVol = 0

  // ─── Public API ───

  /** Must be called from a user-gesture handler to unlock the AudioContext. */
  init(): void {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (this.ctx.state === 'suspended') this.ctx.resume()
    } catch {
      console.warn('[WeatherAudio] Web Audio API not available')
      return
    }

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.5
    this.masterGain.connect(this.ctx.destination)

    this.createRainGenerator()
    this.createWindGenerator()
    this.createThunderChain()

    this.enabled = true
  }

  /** Set target rain volume 0..1. Called every frame. */
  setRain(target: number): void {
    this.targetRainVol = Math.max(0, Math.min(1, target))
  }

  /** Set target wind volume 0..1. */
  setWind(target: number): void {
    this.targetWindVol = Math.max(0, Math.min(1, target))
  }

  /** Fire a thunder clap (0..1 loudness). */
  triggerThunder(loudness: number): void {
    if (!this.enabled || !this.ctx || !this.thunderGain) return
    const now = this.ctx.currentTime
    const gain = this.thunderGain

    // Quick attack, long decay
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(loudness * 0.9, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + Math.random() * 1.5)
  }

  /** Tick every frame to smooth volume transitions. */
  update(dt: number): void {
    if (!this.enabled) return
    const speed = 2.5 // smoothing speed
    this.currentRainVol += (this.targetRainVol - this.currentRainVol) * Math.min(dt * speed, 1)
    this.currentWindVol += (this.targetWindVol - this.currentWindVol) * Math.min(dt * speed, 1)

    if (this.rainGain) this.rainGain.gain.value = this.currentRainVol
    if (this.windGain) this.windGain.gain.value = this.currentWindVol
  }

  dispose(): void {
    this.enabled = false
    try {
      this.rainNode?.stop()
      this.windNode?.stop()
      this.ctx?.close()
    } catch { /* ignore */ }
  }

  // ─── Generator builders ───

  /** Continuous filtered noise — used for rain and wind. */
  private createNoiseBuffer(durationSec: number): AudioBuffer {
    const ctx = this.ctx!
    const sr = ctx.sampleRate
    const len = sr * durationSec
    const buf = ctx.createBuffer(1, len, sr)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buf
  }

  private createRainGenerator(): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const buf = this.createNoiseBuffer(8)
    this.rainNode = ctx.createBufferSource()
    this.rainNode.buffer = buf
    this.rainNode.loop = true

    // Band-pass: focus on mid-high frequencies for rain hiss
    this.rainFilter = ctx.createBiquadFilter()
    this.rainFilter.type = 'bandpass'
    this.rainFilter.frequency.value = 4200
    this.rainFilter.Q.value = 0.7

    this.rainGain = ctx.createGain()
    this.rainGain.gain.value = 0

    this.rainNode.connect(this.rainFilter)
    this.rainFilter.connect(this.rainGain)
    this.rainGain.connect(this.masterGain)
    this.rainNode.start()
  }

  private createWindGenerator(): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const buf = this.createNoiseBuffer(12)
    this.windNode = ctx.createBufferSource()
    this.windNode.buffer = buf
    this.windNode.loop = true

    // Low-pass: deep rumble for wind
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'lowpass'
    this.windFilter.frequency.value = 400
    this.windFilter.Q.value = 0.5

    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0

    this.windNode.connect(this.windFilter)
    this.windFilter.connect(this.windGain)
    this.windGain.connect(this.masterGain)
    this.windNode.start()
  }

  private createThunderChain(): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    // Brown-ish noise burst for thunder rumble
    const dur = 2.5
    const sr = ctx.sampleRate
    const len = sr * dur
    const buf = ctx.createBuffer(1, len, sr)
    const data = buf.getChannelData(0)
    // Brown noise: integrate white noise
    let acc = 0
    for (let i = 0; i < len; i++) {
      acc += (Math.random() * 2 - 1) * 0.1
      acc *= 0.998
      data[i] = acc
    }

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = false

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 280
    filter.Q.value = 0.6

    this.thunderGain = ctx.createGain()
    this.thunderGain.gain.value = 0

    src.connect(filter)
    filter.connect(this.thunderGain)
    this.thunderGain.connect(this.masterGain)
    src.start()
  }
}
