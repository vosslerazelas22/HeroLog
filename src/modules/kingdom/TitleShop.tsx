import React from 'react';
import { CharacterState } from '../../types';
import { TITLE_CATALOG, TitleItem } from '../character/titleCatalog';
import { ShoppingBag, Award, Sparkles, Coins } from 'lucide-react';

interface TitleShopProps {
  state: CharacterState;
  onBuyTitle: (titleId: string, price: number) => void;
  onClaimAchievementTitle: (titleId: string) => void;
}

export const TitleShop: React.FC<TitleShopProps> = ({
  state,
  onBuyTitle,
  onClaimAchievementTitle
}) => {
  const ownedTitles = state.ownedTitles || [];

  const renderTitleCard = (title: TitleItem) => {
    const isOwned = ownedTitles.includes(title.id);

    // Determine lock state for achievements
    let isAchievementUnlocked = false;
    if (title.category === 'achievement' && title.checkUnlocked) {
      isAchievementUnlocked = title.checkUnlocked(state);
    }

    return (
      <div
        key={title.id}
        className={`border p-3 rounded flex flex-col justify-between transition-all duration-300 relative ${title.colorClass}`}
      >
        <div>
          {/* Title Header */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm select-none">{title.emoji}</span>
            <strong className={`text-[11px] font-serif uppercase tracking-wider ${title.textGlowClass || 'text-amber-100/90'}`}>
              {title.name}
            </strong>
          </div>

          {/* Perks (Epic and Legendary / Achievement / Drops get blueprints) */}
          {title.perks && title.perks.length > 0 && (
            <div className="space-y-0.5 my-1.5">
              {title.perks.map((p, idx) => (
                <span key={idx} className="text-[9px] text-[#38bdf8] block font-mono">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="border-t border-amber-500/5 pt-2 mt-2 flex items-center justify-between">
          {/* Price or requirement text */}
          <div>
            {title.category === 'achievement' ? (
              <span className={`text-[9px] font-mono flex items-center gap-1 uppercase font-bold ${isOwned ? 'text-emerald-400' : isAchievementUnlocked ? 'text-amber-400' : 'text-stone-500'}`}>
                {isOwned ? '🔓 Adquirido' : `🔒 ${title.requirementText}`}
              </span>
            ) : title.category === 'drop' ? (
              <span className="text-[9px] font-bold text-amber-500/60 font-serif uppercase tracking-tight">
                ♦ {title.dropChanceText}
              </span>
            ) : (
              // purchasables
              !isOwned && title.price ? (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 font-mono">
                  {title.price.toLocaleString()} <span className="text-[8px] text-amber-600">GP</span>
                </span>
              ) : (
                <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Adquirido</span>
              )
            )}
          </div>

          {/* Interaction Button */}
          <div>
            {isOwned ? (
              <span className="text-[8px] font-mono text-emerald-400/80 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/[0.04] px-2 py-0.5 rounded font-bold">
                Desbloqueado
              </span>
            ) : title.category === 'achievement' ? (
              isAchievementUnlocked ? (
                <button
                  onClick={() => onClaimAchievementTitle(title.id)}
                  className="bg-amber-600 hover:bg-amber-500 text-amber-100 font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded transition-all cursor-pointer animate-pulse"
                >
                  Resgatar
                </button>
              ) : (
                <button
                  disabled
                  className="bg-stone-900 text-stone-600 font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded opacity-50 cursor-not-allowed border border-stone-800"
                >
                  Bloqueado
                </button>
              )
            ) : title.category === 'drop' ? (
              <button
                disabled
                className="bg-stone-900 text-stone-500 font-serif font-black uppercase text-[8px] tracking-widest px-2 px-1 py-1 rounded opacity-40 cursor-not-allowed border border-stone-800"
                title="Obtido aleatoriamente ao completar sessões do foco"
              >
                Loot Raro
              </button>
            ) : (
              // Shop purchasable
              <button
                onClick={() => title.price && onBuyTitle(title.id, title.price)}
                disabled={state.gold < (title.price || 0)}
                className={`font-serif font-black uppercase text-[8px] tracking-widest px-2.5 py-1 rounded transition-all cursor-pointer border ${
                  state.gold >= (title.price || 0)
                    ? 'bg-[#40301a] hover:bg-[#543f22] text-amber-300 border-amber-500/20'
                    : 'bg-stone-900 text-stone-600 border-stone-800 cursor-not-allowed opacity-50'
                }`}
              >
                Comprar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 font-serif leading-relaxed text-amber-100/90">
      
      {/* Intro Header Section */}
      <div className="flex flex-col gap-1 border-b border-amber-500/10 pb-4">
        <p className="text-xs uppercase font-serif tracking-[0.14em] text-amber-400 font-bold">
          Mercado de Títulos Nobres: Adquira brasões com seu GP acumulado ou resgate suas marcas de feitos gloriosos.
        </p>
      </div>

      {/* SECTION 1: PURCHASABLE TITLES */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-amber-300">Títulos Adquiríveis (GP)</h4>
        </div>

        {/* COMMON */}
        <div className="space-y-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-amber-100/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" /> COMMON · 150 - 500 GP
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'common').map(renderTitleCard)}
          </div>
        </div>

        {/* RARE */}
        <div className="space-y-2 pt-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-[#d97706] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> RARE · 1.500 - 6.000 GP
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'rare').map(renderTitleCard)}
          </div>
        </div>

        {/* EPIC */}
        <div className="space-y-2 pt-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-purple-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> EPIC · 10.000 - 50.000 GP <span className="text-[8px] text-[#38bdf8] font-serif font-normal lowercase">(concede atributos passivos ao equipar)</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'epic').map(renderTitleCard)}
          </div>
        </div>

        {/* LEGENDARY */}
        <div className="space-y-2 pt-2">
          <h5 className="text-[9px] uppercase font-mono tracking-widest text-yellow-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> LEGENDARY · 100.000 - 500.000 GP <span className="text-[8px] text-[#38bdf8] font-serif font-normal lowercase">(concede atributos supremos ao equipar)</span>
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TITLE_CATALOG.filter(t => t.category === 'legendary').map(renderTitleCard)}
          </div>
        </div>
      </div>

      {/* SECTION 2: ACHIEVEMENT MILESTONES */}
      <div className="space-y-4 pt-4 border-t border-amber-500/10">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
          <Award className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-purple-300">Achievements Titles · Resgate por Milestones de Conquista</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TITLE_CATALOG.filter(t => t.category === 'achievement').map(renderTitleCard)}
        </div>
      </div>

      {/* SECTION 3: RARE DROP TITLES */}
      <div className="space-y-4 pt-4 border-t border-amber-500/10">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs uppercase font-bold tracking-widest text-emerald-300">Rare Drop Titles · Sorteados ao Completar Sessões de Estudo</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TITLE_CATALOG.filter(t => t.category === 'drop').map(renderTitleCard)}
        </div>
      </div>
    </div>
  );
};
