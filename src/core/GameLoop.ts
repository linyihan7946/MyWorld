export class GameLoop {
  private running: boolean = false;
  private lastTime: number = 0;
  private callbacks: ((dt: number) => void)[] = [];

  constructor() {}

  public add(callback: (dt: number) => void) {
    this.callbacks.push(callback);
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.animate);
  }

  public stop() {
    this.running = false;
  }

  private animate = (time: number) => {
    if (!this.running) return;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    for (const cb of this.callbacks) {
      cb(dt);
    }

    requestAnimationFrame(this.animate);
  };
}
