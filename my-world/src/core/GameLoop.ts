/**
 * GameLoop - requestAnimationFrame 游戏循环
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

  start(onUpdate: (dt: number) => void, onRender: (dt: number) => void): void {
    this.updateCallback = onUpdate
    this.renderCallback = onRender
    this.running = true
    this.lastTime = performance.now()
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
