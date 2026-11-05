// OpenCrate Core — 3D engine core
// SPDX-License-Identifier: MIT

export interface EngineEvent {
  type: string;
  target?: unknown;
}

type Listener<E extends EngineEvent> = (event: E) => void;

/** Minimal typed pub/sub used by Object3D and other engine classes. No global state. */
export class EventDispatcher<EventMap extends Record<string, EngineEvent> = Record<string, EngineEvent>> {
  private listeners: Map<keyof EventMap, Set<Listener<EngineEvent>>> | undefined;

  addEventListener<K extends keyof EventMap>(type: K, listener: Listener<EventMap[K]>): void {
    this.listeners ??= new Map();
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as Listener<EngineEvent>);
  }

  removeEventListener<K extends keyof EventMap>(type: K, listener: Listener<EventMap[K]>): void {
    this.listeners?.get(type)?.delete(listener as Listener<EngineEvent>);
  }

  hasEventListener<K extends keyof EventMap>(type: K, listener: Listener<EventMap[K]>): boolean {
    return this.listeners?.get(type)?.has(listener as Listener<EngineEvent>) ?? false;
  }

  dispatchEvent<K extends keyof EventMap>(event: EventMap[K]): void {
    const set = this.listeners?.get(event.type as K);
    if (!set) return;
    for (const listener of Array.from(set)) listener(event);
  }
}
