export class InputManager {
  public keys: { [key: string]: boolean } = {};
  public mouse: { x: number, y: number, down: boolean, leftDown: boolean, rightDown: boolean } = { x: 0, y: 0, down: false, leftDown: false, rightDown: false };
  public locked: boolean = false;

  constructor(domElement: HTMLElement) {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    
    domElement.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      if (e.button === 0) this.mouse.leftDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
      
      if (!this.locked) {
        domElement.requestPointerLock();
      }
    });

    domElement.addEventListener('mouseup', (e) => {
      this.mouse.down = false;
      if (e.button === 0) this.mouse.leftDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === domElement;
    });

    domElement.addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.mouse.x = e.movementX;
        this.mouse.y = e.movementY;
      }
    });
  }

  public getMovement() {
    const x = this.mouse.x;
    const y = this.mouse.y;
    this.mouse.x = 0;
    this.mouse.y = 0;
    return { x, y };
  }
}
