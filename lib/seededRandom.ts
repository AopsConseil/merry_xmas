// lib/seededRandom.ts

// Petit PRNG déterministe (mulberry32) → même suite pseudo-aléatoire
export function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0;

  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    r = (r ^ (r >>> 14)) >>> 0;
    return r / 4294967296; // dans [0,1[
  };
}
