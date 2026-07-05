import React, { useState } from 'react';
import { VolumeX } from 'lucide-react';
import { AmbientSoundModal } from './AmbientSoundModal';
import { AmbientTrack } from './ambientSounds.constants';

interface AmbientSoundButtonProps {
  selectedTrack: string | null;
  volume: number;
  selectTrack: (id: string | null) => void;
  setVolume: (v: number) => void;
  tracks: AmbientTrack[];
  compact?: boolean;
}

export function AmbientSoundButton({
  selectedTrack,
  volume,
  selectTrack,
  setVolume,
  tracks,
  compact = false,
}: AmbientSoundButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeTrack = tracks.find((t) => t.id === selectedTrack);

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative w-10 h-10 rounded-full border border-amber-500/25 bg-stone-900/90 hover:bg-stone-850 hover:border-amber-400/50 text-amber-400 hover:text-amber-300 transition-all cursor-pointer select-none flex items-center justify-center shadow-lg group z-30"
          title="Sons Ambiente"
        >
          <span className="relative flex items-center justify-center">
            {activeTrack ? (
              <span className="text-base filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform">
                {activeTrack.icone}
              </span>
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
            )}
            {activeTrack && (
              <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-stone-950" />
            )}
          </span>
        </button>

        <AmbientSoundModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedTrack={selectedTrack}
          volume={volume}
          selectTrack={selectTrack}
          setVolume={setVolume}
          tracks={tracks}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative px-3 py-1.5 rounded-lg border border-amber-500/20 bg-stone-900/60 hover:bg-stone-850 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition-all cursor-pointer select-none flex items-center justify-center gap-1.5 shadow-sm group"
        title="Configurar Sons Ambiente"
      >
        <span className="relative flex items-center justify-center">
          {activeTrack ? (
            <span className="text-base filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform">
              {activeTrack.icone}
            </span>
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-400 transition-colors" />
          )}
          {activeTrack && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse border border-stone-950" />
          )}
        </span>
        <span className="text-[10px] font-serif font-black uppercase tracking-wider text-amber-100/70 group-hover:text-amber-100">
          {activeTrack ? 'Sintonizado' : 'Som Ambiente'}
        </span>
      </button>

      <AmbientSoundModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedTrack={selectedTrack}
        volume={volume}
        selectTrack={selectTrack}
        setVolume={setVolume}
        tracks={tracks}
      />
    </>
  );
}
