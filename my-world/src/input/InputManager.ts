/**
 * InputManager - 键盘和鼠标输入管理
 */
export class InputManager {
  private keys = new Map<string, boolean>()
  private mouseX = 0
  private mouseY = 0
  private mouseDX = 0
  private mouseDY = 0
  private mouseButtons = new Set<number>()
  private isPointerLocked = false
  private canvas: HTMLCanvasElement | null = null

  // Callbacks
  public onKeyDown: ((key: string) => void) | null = null
  public onKeyUp: ((key: string) => void) | null = null
  public onMouseMove: ((dx: number, dy: number) => void) | null = null
  public onMouseDown: ((button: number) => void) | null = null
  public onMouseUp: ((button: number) => void) | null = null
  public onPointerLockChange: ((locked: boolean) => void) | null = null

  constructor() {
    this.setupListeners()
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        canvas.requestPointerLock()
      }
    })
  }

  private setupListeners(): void {
    document.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true)
      this.onKeyDown?.(e.code)
    })

    document.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false)
      this.onKeyUp?.(e.code)
    })

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDX += e.movementX
        this.mouseDY += e.movementY
        this.onMouseMove?.(e.movementX, e.movementY)
      }
    })

    document.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button)
      this.onMouseDown?.(e.button)
    })

    document.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button)
      this.onMouseUp?.(e.button)
    })

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null
      this.onPointerLockChange?.(this.isPointerLocked)
    })

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  isKeyPressed(code: string): boolean {
    return this.keys.get(code) === true
  }

  isMouseButtonPressed(button: number): boolean {
    return this.mouseButtons.has(button)
  }

  /**
   * 获取并重置鼠标增量
   */
  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDX
    const dy = this.mouseDY
    this.mouseDX = 0
    this.mouseDY = 0
    return { dx, dy }
  }

  get locked(): boolean {
    return this.isPointerLocked
  }

  /**
   * 获取玩家移动输入
   */
  getMovement(): { forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean; sprint: boolean } {
    return {
      forward: this.isKeyPressed('KeyW'),
      backward: this.isKeyPressed('KeyS'),
      left: this.isKeyPressed('KeyA'),
      right: this.isKeyPressed('KeyD'),
      jump: this.isKeyPressed('Space'),
      sprint: this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight'),
    }
  }
}
