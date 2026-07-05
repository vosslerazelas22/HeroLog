import React from 'react';
import { ToggleLeft, ToggleRight, Volume2, VolumeX } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { AmbientTrack } from './ambientSounds.constants';

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: string | null;
  volume: number;
  selectTrack: (id: string | null) => void;
  setVolume: (v: number) => void;
  tracks: AmbientTrack[];
}

export function AmbientSoundModal({
  isOpen,
  onClose,
  selectedTrack,
  volume,
  selectTrack,
  setVolume,
  tracks,
}: AmbientSoundModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sons Ambiente">
      <div className="space-y-6">
        {/* Volume Slider Section */}
        <div className="bg-stone-950/40 p-4 rounded-xl border border-amber-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-stone-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs font-serif font-black uppercase tracking-wider text-amber-100/80">
                Volume do Eco
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {volume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Tracks List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-serif font-black uppercase tracking-widest text-amber-500/60 pl-1 mb-2">
            Canalizar Sintonias
          </h3>
          <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
            {tracks.map((track) => {
              const isActive = selectedTrack === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                      : 'bg-stone-950/30 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {track.icone}
                    </span>
                    <div>
                      <span className="text-xs font-serif font-black uppercase text-amber-100/90 block">
                        {track.nome}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400/80 uppercase tracking-wider animate-pulse block">
                          Ativo e em Sintonia
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectTrack(isActive ? null : track.id)}
                    className="transition-colors cursor-pointer"
                    aria-label={`Toggle sound ${track.nome}`}
                  >
                    {isActive ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-stone-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Informative Footer */}
        <p className="text-[10px] text-amber-100/40 font-serif leading-relaxed text-center italic mt-2">
          Os sussurros do santuário reverberam somente enquanto sua mente estiver focada de fato (durante sessões de foco ativas, não pausadas).
        </p>
      </div>
    </Modal>
  );
}
