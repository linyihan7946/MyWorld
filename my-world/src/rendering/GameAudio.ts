/**
 * GameAudio — 程序化游戏音效系统
 * 使用 Web Audio API 合成所有音效，无需外部音频文件
 */
export class GameAudio {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private enabled = false

  /** 音量 (0-1) */
  volume = 0.6

  /** 初始化（需在用户手势中调用） */
  init(): void {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (this.ctx.state === 'suspended') this.ctx.resume()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.ctx.destination)
      this.enabled = true
    } catch {
      console.warn('[GameAudio] Web Audio not available')
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.masterGain) this.masterGain.gain.value = this.volume
  }

  // ═══════════════════════════════════════
  // 方块音效
  // ═══════════════════════════════════════

  /** 破坏方块 */
  playBlockBreak(type: 'stone' | 'wood' | 'dirt' | 'sand' | 'glass' | 'metal' = 'stone'): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    const freqs: Record<string, number> = {
      stone: 180, wood: 260, dirt: 120, sand: 90, glass: 800, metal: 400,
    }
    const baseFreq = freqs[type] ?? 180

    // 噪声爆发 → 模拟撞击
    const buf = this.createNoiseBuffer(0.15)
    const src = this.ctx.createBufferSource()
    src.buffer = buf

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = baseFreq
    filter.Q.value = 1.2

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    src.start(now)
    src.stop(now + 0.15)

    // 低频 thud
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(baseFreq * 0.6, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + 0.08)

    const oscGain = this.ctx.createGain()
    oscGain.gain.setValueAtTime(0, now)
    oscGain.gain.linearRampToValueAtTime(0.3, now + 0.005)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    osc.connect(oscGain)
    oscGain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  /** 放置方块 */
  playBlockPlace(type: 'stone' | 'wood' | 'dirt' | 'sand' | 'glass' | 'metal' = 'stone'): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    const freqs: Record<string, number> = {
      stone: 200, wood: 300, dirt: 140, sand: 100, glass: 700, metal: 450,
    }
    const baseFreq = freqs[type] ?? 200

    // 闷声放置
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(baseFreq, now)
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.06)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  // ═══════════════════════════════════════
  // 玩家音效
  // ═══════════════════════════════════════

  /** 脚步声 */
  playFootstep(surface: 'grass' | 'stone' | 'wood' | 'sand' | 'water' = 'stone'): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    const freqs: Record<string, number> = {
      grass: 100, stone: 160, wood: 220, sand: 70, water: 300,
    }
    const baseFreq = freqs[surface] ?? 160

    const buf = this.createNoiseBuffer(0.06)
    const src = this.ctx.createBufferSource()
    src.buffer = buf

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = baseFreq * 3

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    src.start(now)
    src.stop(now + 0.06)
  }

  /** 受伤 */
  playHurt(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  /** 坠落 */
  playFall(distance: number): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const vol = Math.min(0.5, distance * 0.05)
    if (vol < 0.05) return
    const now = this.ctx.currentTime

    const buf = this.createNoiseBuffer(0.2)
    const src = this.ctx.createBufferSource()
    src.buffer = buf

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 150

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(vol, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain!)
    src.start(now)
    src.stop(now + 0.2)
  }

  // ═══════════════════════════════════════
  // 传送门音效
  // ═══════════════════════════════════════

  private portalAmbientOsc: OscillatorNode | null = null
  private portalAmbientGain: GainNode | null = null
  private portalActive = false

  /** 传送门激活音效 */
  playPortalActivate(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    // 嗡鸣 swoosh
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.6)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
    gain.gain.setValueAtTime(0.2, now + 0.35)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.7)

    this.startPortalAmbient()
  }

  /** 传送门环境嗡鸣 */
  private startPortalAmbient(): void {
    if (this.portalActive || !this.ctx || !this.masterGain) return
    this.portalActive = true

    this.portalAmbientOsc = this.ctx.createOscillator()
    this.portalAmbientOsc.type = 'sine'
    this.portalAmbientOsc.frequency.value = 120

    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 0.5
    const lfoGain = this.ctx.createGain()
    lfoGain.gain.value = 40
    lfo.connect(lfoGain)
    lfoGain.connect(this.portalAmbientOsc.frequency)
    lfo.start()

    this.portalAmbientGain = this.ctx.createGain()
    this.portalAmbientGain.gain.value = 0.04

    this.portalAmbientOsc.connect(this.portalAmbientGain)
    this.portalAmbientGain.connect(this.masterGain)
    this.portalAmbientOsc.start()
  }

  /** 停止传送门嗡鸣 */
  stopPortalAmbient(): void {
    if (!this.portalActive) return
    this.portalActive = false
    try {
      this.portalAmbientOsc?.stop()
      this.portalAmbientGain?.disconnect()
    } catch { /* ignore */ }
    this.portalAmbientOsc = null
    this.portalAmbientGain = null
  }

  /** 传送 */
  playTeleport(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    this.stopPortalAmbient()

    // 上升音阶
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.5)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.6)
  }

  // ═══════════════════════════════════════
  // UI 音效
  // ═══════════════════════════════════════

  /** 背包开关 */
  playInventoryToggle(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(500, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.06)
  }

  /** 物品拾取 */
  playPickup(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.1, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain!)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  // ═══════════════════════════════════════
  // 工具
  // ═══════════════════════════════════════

  private createNoiseBuffer(durationSec: number): AudioBuffer {
    const ctx = this.ctx!
    const sr = ctx.sampleRate
    const len = Math.floor(sr * durationSec)
    const buf = ctx.createBuffer(1, len, sr)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buf
  }

  dispose(): void {
    this.enabled = false
    this.stopPortalAmbient()
    try { this.ctx?.close() } catch { /* ignore */ }
  }
}
