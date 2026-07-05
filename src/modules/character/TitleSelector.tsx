import React from 'react';
import { TITLE_CATALOG } from './titleCatalog';
import { Award, Shield } from 'lucide-react';

interface TitleSelectorProps {
  ownedTitles: string[];
  equippedTitle: string | null;
  onEquipTitle: (titleId: string | null) => void;
}

export const TitleSelector: React.FC<TitleSelectorProps> = ({
  ownedTitles,
  equippedTitle,
  onEquipTitle
}) => {
  // Map ownedTitle IDs to their catalog entries
  const unlockedTitles = TITLE_CATALOG.filter(t => ownedTitles.includes(t.id));

  return (
    <div className="space-y-6 font-serif leading-relaxed text-amber-100/90">
      {/* Intro Header Section */}
      <div className="flex flex-col gap-1 border-b border-amber-500/10 pb-4">
        <p className="text-xs uppercase font-serif tracking-[0.14em] text-amber-400 font-bold">
          Sua Coleção de Brasões & Títulos Nobres. Escolha seu título honorário ativo para projetar sua presença heróica e desfrutar de seus benefícios místicos.
        </p>
      </div>

      {unlockedTitles.length === 0 ? (
        <div className="py-12 text-center flex flex-col justify-center items-center bg-stone-900/20 border border-amber-500/5 rounded-lg p-6">
          <Award className="w-12 h-12 text-amber-500/20 mb-3 animate-pulse" />
          <span className="text-xs text-amber-400 font-serif font-semibold uppercase tracking-wider">Sua estante de brasões está vazia!</span>
          <span className="text-[10px] text-amber-100/40 font-serif mt-1 max-w-sm">
            Nenhum título honorífico foi conquistado ainda. Cultive sua força de vontade nas Missões de Foco ou compre patentes de prestígio no Bazar de Mystara!
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs uppercase font-bold tracking-widest text-amber-300">Seus Brasões Desbloqueados ({unlockedTitles.length})</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedTitles.map((title) => {
              const isEquipped = equippedTitle === title.id;

              return (
                <div
                  key={title.id}
                  className={`border p-3.5 rounded-lg flex flex-col justify-between transition-all duration-300 relative ${
                    isEquipped
                      ? 'border-amber-500 bg-[#1c1917]/90 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : title.colorClass
                  }`}
                >
                  {/* Equipped status badge */}
                  {isEquipped && (
                    <div className="absolute -top-2.5 -right-2 bg-amber-500 text-stone-950 font-serif uppercase text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider shadow">
                      Ativo
                    </div>
                  )}

                  <div>
                    {/* Header: Emoji and Name */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base select-none">{title.emoji}</span>
                      <strong className={`text-[12px] font-serif uppercase tracking-wider ${title.textGlowClass || 'text-amber-100/90'}`}>
                        {title.name}
                      </strong>
                    </div>

                    {/* Category Label */}
                    <span className="text-[8px] uppercase font-mono bg-stone-950/40 text-stone-400 px-1.5 py-0.5 rounded tracking-widest inline-block border border-stone-800/45 mb-2">
                      {title.category}
                    </span>

                    {/* Perks description */}
                    {title.perks && title.perks.length > 0 && (
                      <div className="space-y-0.5 my-1.5">
                        {title.perks.map((p, idx) => (
                          <span key={idx} className="text-[9px] text-[#38bdf8] block font-mono">
                            ⚡ {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Button Footer */}
                  <div className="border-t border-amber-500/5 pt-2 mt-3 flex justify-end">
                    {isEquipped ? (
                      <button
                        onClick={() => onEquipTitle(null)}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-serif font-black uppercase text-[8px] tracking-widest px-3 py-1.5 rounded transition-all cursor-pointer border border-stone-700/50"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        onClick={() => onEquipTitle(title.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-serif font-black uppercase text-[8px] tracking-widest px-3 py-1.5 rounded transition-all cursor-pointer shadow border border-amber-400"
                      >
                        Equipar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
