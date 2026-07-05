import React from 'react';
import { Modal } from './Modal';
import { TITLE_CATALOG, TitleItem } from '../modules/character/titleCatalog';
import { Award, Shield, Check } from 'lucide-react';

interface TitleEquipModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedTitles: string[];
  equippedTitle: string | null;
  onEquipTitle: (titleId: string | null) => void;
}

export function TitleEquipModal({
  isOpen,
  onClose,
  ownedTitles,
  equippedTitle,
  onEquipTitle,
}: TitleEquipModalProps) {
  // Map ownedTitle IDs to their catalog entries
  const unlockedTitles = TITLE_CATALOG.filter(t => ownedTitles.includes(t.id));

  // Define categories to show in order
  const categoriesConfig = [
    {
      key: 'legendary',
      label: '— LENDÁRIOS —',
      titleColor: 'text-rose-400',
      borderColor: 'border-rose-500/20',
      bgColor: 'bg-rose-950/[0.04]',
    },
    {
      key: 'epic',
      label: '— ÉPICOS —',
      titleColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      bgColor: 'bg-purple-950/[0.04]',
    },
    {
      key: 'rare',
      label: '— RAROS —',
      titleColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      bgColor: 'bg-amber-950/[0.04]',
    },
    {
      key: 'common',
      label: '— COMUNS —',
      titleColor: 'text-stone-300',
      borderColor: 'border-stone-800',
      bgColor: 'bg-stone-900/[0.04]',
    },
    {
      key: 'conquests',
      label: '— CONQUISTAS —',
      titleColor: 'text-[#38bdf8]',
      borderColor: 'border-sky-500/20',
      bgColor: 'bg-sky-950/[0.04]',
    },
  ];

  // Group titles
  const groupedTitles: { [key: string]: TitleItem[] } = {
    legendary: [],
    epic: [],
    rare: [],
    common: [],
    conquests: [],
  };

  unlockedTitles.forEach((t) => {
    if (t.category === 'legendary') {
      groupedTitles.legendary.push(t);
    } else if (t.category === 'epic') {
      groupedTitles.epic.push(t);
    } else if (t.category === 'rare') {
      groupedTitles.rare.push(t);
    } else if (t.category === 'common') {
      groupedTitles.common.push(t);
    } else if (t.category === 'achievement' || t.category === 'drop') {
      groupedTitles.conquests.push(t);
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Equipar Título Honorífico"
      variant="amber"
    >
      <div className="space-y-5 max-h-[65vh] pr-1">
        <p className="text-xs text-amber-100/60 font-serif leading-relaxed italic">
          Selecione qual brasão ou título honorífico você deseja carregar em sua ficha de herói:
        </p>

        {unlockedTitles.length === 0 ? (
          <div className="py-10 text-center flex flex-col justify-center items-center bg-stone-950/40 border border-stone-850 rounded-lg p-5">
            <Award className="w-10 h-10 text-amber-500/20 mb-2.5 animate-pulse" />
            <span className="text-xs text-amber-400 font-serif font-semibold uppercase tracking-wider">Sua estante de brasões está vazia!</span>
            <span className="text-[10px] text-amber-100/40 font-serif mt-1 max-w-xs leading-normal">
              Nenhum título honorífico foi conquistado ainda. Cultive seu foco nas missões ou compre brasões no Bazar!
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {categoriesConfig.map((cat) => {
              const list = groupedTitles[cat.key];
              if (list.length === 0) return null;

              return (
                <div key={cat.key} className="space-y-2">
                  {/* Category Section Header */}
                  <div className={`text-[10px] font-black uppercase tracking-widest text-center py-1 rounded border ${cat.bgColor} ${cat.borderColor} ${cat.titleColor} font-serif`}>
                    {cat.label}
                  </div>

                  {/* Vertical List of cards */}
                  <div className="space-y-2">
                    {list.map((title) => {
                      const isEquipped = equippedTitle === title.id;

                      return (
                        <button
                          key={title.id}
                          type="button"
                          onClick={() => {
                            if (isEquipped) {
                              onEquipTitle(null);
                            } else {
                              onEquipTitle(title.id);
                            }
                            onClose();
                          }}
                          className={`w-full text-left p-3.5 rounded-lg border transition-all duration-300 relative group flex flex-col justify-between cursor-pointer ${
                            isEquipped
                              ? 'border-amber-400 bg-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-500/[0.04]'
                              : title.colorClass || 'border-stone-800 bg-stone-950/40 hover:border-amber-500/35 hover:bg-amber-500/[0.01]'
                          }`}
                        >
                          {/* Active / Equipped Badge */}
                          {isEquipped && (
                            <div className="absolute top-3.5 right-3.5 bg-amber-400 text-stone-950 text-[9px] uppercase font-serif font-black px-2 py-0.5 rounded shadow flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Equipado
                            </div>
                          )}

                          {/* Info Section */}
                          <div className="space-y-1.5 pr-20">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base shrink-0 select-none">{title.emoji}</span>
                              <h4 className={`text-xs font-serif font-bold uppercase tracking-wider ${title.textGlowClass || 'text-amber-100/90'}`}>
                                {title.name}
                              </h4>
                            </div>

                            {/* Perks details */}
                            {title.perks && title.perks.length > 0 ? (
                              <div className="space-y-0.5">
                                {title.perks.map((p, idx) => (
                                  <span key={idx} className="text-[9.5px] text-[#38bdf8] block font-mono">
                                    ⚡ {p}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[9px] text-stone-500 italic block font-sans">
                                Sem efeitos adicionais ativos.
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
