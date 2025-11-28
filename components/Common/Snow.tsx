// components/Effects/Snow.tsx
"use client";

import { useEffect, useState } from "react";

type Flake = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: string;
  char: string;
};

const snowChars = ["❄", "❅", "❆", "✦"];

function makeFlakes(count: number): Flake[] {
  const flakes: Flake[] = [];
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = 8 + Math.random() * 7;
    const size = 10 + Math.random() * 10;
    const char = snowChars[i % snowChars.length];

    flakes.push({
      id: i,
      left: `${left}%`,
      delay: `${delay}s`,
      duration: `${duration}s`,
      size: `${size}px`,
      char,
    });
  }
  return flakes;
}

export function Snow() {
  const [flakes, setFlakes] = useState<Flake[]>([]);

  useEffect(() => {
    // Ne s’exécute que côté client → pas de problème d’hydratation
    setFlakes(makeFlakes(80));
  }, []);

  if (!flakes.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            fontSize: flake.size,
          }}
        >
          {flake.char}
        </div>
      ))}
    </div>
  );
}
