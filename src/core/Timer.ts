// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

/** Simple accumulating timer for throttling per-frame work (e.g. "update physics every 1/60s"). */
export class Timer {
  private accumulated = 0;
  readonly interval: number;

  constructor(intervalSeconds: number) {
    this.interval = intervalSeconds;
  }

  /** Advances by `dt` seconds; returns how many whole intervals have elapsed (0 if none yet). */
  tick(dt: number): number {
    this.accumulated += dt;
    let fired = 0;
    while (this.accumulated >= this.interval) {
      this.accumulated -= this.interval;
      fired++;
    }
    return fired;
  }

  reset(): void {
    this.accumulated = 0;
  }
}
