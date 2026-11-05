// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

/** Frame clock providing delta and elapsed time in seconds. No global state — instantiate per app. */
export class Clock {
  private startTime = 0;
  private prevTime = 0;
  private running = false;
  elapsedTime = 0;

  start(): void {
    this.startTime = now();
    this.prevTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }

  stop(): void {
    this.getDelta();
    this.running = false;
  }

  /** Returns seconds since the previous call (or since start()), and advances internal state. */
  getDelta(): number {
    let diff = 0;
    if (this.running) {
      const t = now();
      diff = (t - this.prevTime) / 1000;
      this.prevTime = t;
      this.elapsedTime += diff;
    }
    return diff;
  }

  getElapsed(): number {
    return this.elapsedTime;
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
