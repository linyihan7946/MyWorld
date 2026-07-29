/**
 * GameLoop - requestAnimationFrame 游戏循环
 * 带有帧率限制以避免 GPU 空转和过热
 */
export class GameLoop {
  private running = false
  private animationFrameId: number | null = null
  private lastTime = 0
  private updateCallback: ((dt: number) => void) | null = null
  private renderCallback: ((dt: number) => void) | null = null

  // FPS tracking
  private frameCount = 0
  private fpsTime = 0
  public fps = 0

  // 帧率限制：避免高刷屏 GPU 空转
  private frameInterval: number
  private lastFrameTime = 0

  constructor(targetFps = 60) {
    this.frameInterval = 1000 / targetFps
  }

  start(onUpdate: (dt: number) => void, onRender: (dt: number) => void): void {
    this.updateCallback = onUpdate
    this.renderCallback = onRender
    this.running = true
    this.lastTime = performance.now()
    this.lastFrameTime = this.lastTime
    this.fpsTime = this.lastTime
    this.tick(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private tick = (currentTime: number): void => {
    if (!this.running) return

    this.animationFrameId = requestAnimationFrame(this.tick)

    // 帧率限制：跳过过早到来的帧
    const elapsed = currentTime - this.lastFrameTime
    if (elapsed < this.frameInterval) return
    this.lastFrameTime = currentTime - (elapsed % this.frameInterval)

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1) // Cap at 100ms
    this.lastTime = currentTime

    // Update FPS counter
    this.frameCount++
    if (currentTime - this.fpsTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.fpsTime = currentTime
    }

    // Update game logic
    this.updateCallback?.(dt)

    // Render
    this.renderCallback?.(dt)
  }
}
