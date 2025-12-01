// components/Common/ChristmasPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  src: string;
  title: string;
};

const tracks: Track[] = [
  { src: "/happy_xmas.mp3", title: "Christmas vibes #1" },
  { src: "/all_i_want.mp3", title: "Christmas vibes #2" },
  { src: "/jingle_bells.mp3", title: "Christmas vibes #3" },
  { src: "/last_christmas.mp3", title: "Christmas vibes #4" },
  { src: "/vive_le_vent.mp3", title: "Christmas vibes #5" },
  { src: "/petit_papa_noel.mp3", title: "Christmas vibes #6" },
  { src: "/wish_merry_xmas.mp3", title: "Christmas vibes #7" },
  { src: "/wonderful_time.mp3", title: "Christmas vibes #8" },
  { src: "/the_christmas_song.mp3", title: "Christmas vibes #9" },
  { src: "/look_a_lot_like_christmas.mp3", title: "Christmas vibes #10" },
  { src: "/let_it_snow.mp3", title: "Christmas vibes #11" },
  { src: "/rockin_around.mp3", title: "Christmas vibes #12" },
];

function getRandomIndex(exclude?: number): number {
  if (tracks.length === 1) return 0;
  let idx = Math.floor(Math.random() * tracks.length);
  if (exclude !== undefined) {
    while (idx === exclude) {
      idx = Math.floor(Math.random() * tracks.length);
    }
  }
  return idx;
}

export function ChristmasPlayer() {
  // ⚠️ initial state déterministe pour éviter les erreurs d’hydratation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Choix aléatoire initial côté client uniquement
  useEffect(() => {
    setCurrentIndex(getRandomIndex());
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // Autoplay peut être bloqué, l'utilisateur devra cliquer sur Play
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentIndex]);

  const handleEnded = () => {
    setCurrentIndex((prev) => getRandomIndex(prev));
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const playRandom = () => {
    setCurrentIndex((prev) => getRandomIndex(prev));
    setIsPlaying(true);
  };

  const currentTrack = tracks[currentIndex];

  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-amber-500/40 bg-slate-900/80 px-4 py-2 text-xs text-slate-200 shadow-lg shadow-amber-500/20">
      {/* Bouton Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
        aria-label={isPlaying ? "Mettre en pause" : "Lire la musique"}
      >
        {isPlaying ? "⏸" : "▶️"}
      </button>

      {/* Infos piste */}
      <div className="flex flex-col min-w-0">
        <span className="flex items-center gap-1 text-[0.75rem] uppercase tracking-[0.18em] text-amber-200">
          <span role="img" aria-label="note">
            🎶
          </span>
          Ambiance Noël
        </span>
        <span className="text-[0.7rem] text-slate-400 truncate">
          {currentTrack.title}
        </span>
      </div>

      {/* Bouton piste aléatoire */}
      <button
        type="button"
        onClick={playRandom}
        className="flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-[0.7rem] text-slate-200 hover:border-amber-400 hover:text-amber-200 transition-colors"
        aria-label="Changer de chanson aléatoirement"
      >
        ⏭<span className="hidden sm:inline">Chanson aléatoire</span>
      </button>

      <audio
        ref={audioRef}
        src={currentTrack.src}
        onEnded={handleEnded}
        loop={false}
      />
    </div>
  );
}
