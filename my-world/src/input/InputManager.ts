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

  // Virtual (touch) input state
  private virtualForward = 0
  private virtualRight = 0
  private virtualActions = new Map<string, boolean>()

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

  // ── Virtual (touch) input API ──

  /** Set virtual joystick movement (-1..1 for forward/right). */
  setVirtualMovement(forward: number, right: number): void {
    this.virtualForward = forward
    this.virtualRight = right
  }

  /** Set virtual action button state and fire callbacks for common actions. */
  setVirtualAction(action: string, pressed: boolean): void {
    this.virtualActions.set(action, pressed)

    // Map virtual actions to keyboard/mouse callbacks
    if (action === 'attack') {
      if (pressed) this.onMouseDown?.(0)   // left click
      else this.onMouseUp?.(0)
    } else if (action === 'place') {
      if (pressed) this.onMouseDown?.(2)   // right click
      else this.onMouseUp?.(2)
    } else if (action === 'inventory' && pressed) {
      this.onKeyDown?.('KeyE')
    } else if (action === 'toggleCamera' && pressed) {
      this.onKeyDown?.('KeyV')
    } else if (action.startsWith('slot') && pressed) {
      const num = parseInt(action.replace('slot', ''))
      if (num >= 0 && num <= 8) {
        this.onKeyDown?.(`Digit${num + 1}`)
      }
    }
  }

  /**
   * 获取玩家移动输入（合并键盘和虚拟输入）
   */
  getMovement(): { forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean; sprint: boolean } {
    // Virtual joystick
    const vFwd = this.virtualForward
    const vRgt = this.virtualRight
    const vJump = this.virtualActions.get('jump') ?? false
    const vSneak = this.virtualActions.get('sneak') ?? false

    return {
      forward: this.isKeyPressed('KeyW') || vFwd > 0.3,
      backward: this.isKeyPressed('KeyS') || vFwd < -0.3,
      left: this.isKeyPressed('KeyA') || vRgt < -0.3,
      right: this.isKeyPressed('KeyD') || vRgt > 0.3,
      jump: this.isKeyPressed('Space') || vJump,
      sprint: this.isKeyPressed('ShiftLeft') || this.isKeyPressed('ShiftRight') || vSneak,
    }
  }
}
