/** Deterministic choreography, independent of refresh rate. */
export const ASSEMBLY_SECONDS = 2.6;
export const TRAVEL_SECONDS = 1.65;
export const MAX_DELAY = ASSEMBLY_SECONDS - TRAVEL_SECONDS;
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
export function smootherstep(t: number): number {
  const x = clamp(t);
  return clamp(x * x * x * (x * (x * 6 - 15) + 10));
}
export function pieceProgress(seconds: number, delay: number): number {
  return smootherstep((seconds - clamp(delay, 0, MAX_DELAY)) / TRAVEL_SECONDS);
}
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashName(name: string): number {
  let hash = 2166136261;
  for (const char of name) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function defaultDelay(name: string): number {
  const base = /trim|glow/i.test(name) ? .72 : /eye/i.test(name) ? .6
    : /face|nose|lip|ear/i.test(name) ? .45 : /hair|beard/i.test(name) ? .24 : 0;
  return clamp(base + seededRandom(hashName(name))() * .18, 0, MAX_DELAY);
}
