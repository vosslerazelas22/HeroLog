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
          className="flex flex-col items-center justify-center gap-1 py-2 min-h-[48px] rounded-lg hover:bg-stone-900/40 transition-all cursor-pointer select-none"
          title="Sons Ambiente"
        >
          <span className="relative w-5 h-5 flex items-center justify-center">
            {activeTrack ? (
              <span className="text-base leading-none select-none">
                {activeTrack.icone}
              </span>
            ) : (
              <VolumeX className="w-5 h-5 text-zinc-400" />
            )}
            {activeTrack && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-stone-950" />
            )}
          </span>
          <span className="text-[9px] font-serif uppercase tracking-wider text-zinc-300/70">Som</span>
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
        className="relative flex items-center justify-start p-3 rounded-lg border-2 border-amber-500/20 bg-stone-900/60 hover:bg-stone-850 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition-all cursor-pointer select-none shadow-sm group min-h-[64px] w-full"
        title="Configurar Sons Ambiente"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
            {activeTrack ? (
              <span className="text-lg filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-transform">
                {activeTrack.icone}
              </span>
            ) : (
              <VolumeX className="w-5 h-5 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
            )}
            {activeTrack && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse border border-stone-950" />
            )}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-serif font-black uppercase tracking-wider text-amber-100 group-hover:text-amber-200 truncate">
              Som Ambiente
            </span>
            <span className="text-[9px] font-medium text-amber-200/70">
              {activeTrack ? 'Sintonizado' : 'Desativado'}
            </span>
          </div>
        </div>
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
