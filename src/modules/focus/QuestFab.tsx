import React, { useState } from 'react';
import { CharacterState } from '../../types';
import { getRotatingDailyQuests, guildQuests, isQuestClaimed } from '../quests';
import { Scroll, X } from 'lucide-react';
import { Modal } from '../../components/Modal';

interface QuestFabProps {
  gameState: CharacterState;
  setActiveTab: (tab: string) => void;
  setIsMobileSidebarOpen?: (open: boolean) => void;
  isRunning?: boolean;
}

export const QuestFab: React.FC<QuestFabProps> = ({
  gameState,
  setActiveTab,
  setIsMobileSidebarOpen,
  isRunning = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const state = gameState;
  const dailies = getRotatingDailyQuests(3).map((quest) => ({
    ...quest,
    progress: quest.getProgress(state),
  }));
  
  const guilds = guildQuests.map((quest) => ({
    ...quest,
    progress: quest.getProgress(state),
  }));

  const unclaimedGuilds = guilds.filter(g => !isQuestClaimed(state, g.id));
  let closestGuildQuest = null;
  if (unclaimedGuilds.length > 0) {
    closestGuildQuest = unclaimedGuilds.reduce((prev, current) => {
      const prevPct = prev.progress / prev.target;
      const currPct = current.progress / current.target;
      return currPct > prevPct ? current : prev;
    });
  }

  // Calculate pending active quests (unclaimed dailies, as specified: dailies.filter(q => !q.isClaimed))
  const pendingQuestsCount = dailies.filter(
    (q) => !isQuestClaimed(state, q.id)
  ).length;

  return (
    <>
      {/* Floating Action Button (FAB)
          ROBUST FIXED POSITION:
          - A single, constant vertical position (bottom-[72px] right-3 / lg:bottom-6 lg:right-6)
            independent of isRunning or any other state. This guarantees layout stability across any future content changes.
          - Positioned at `right-3` to stay clear of active button content columns.
          - Styled with `shadow-[0_8px_30px_rgba(0,0,0,0.85)]`, `border-[#E2B054]/40`, and `backdrop-blur-md`
            to explicitly convey high elevation and floating hierarchy.
      */}
      <div className="fixed z-30 bottom-[72px] right-3 lg:bottom-6 lg:right-6 transition-all duration-300">
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-4 rounded-full border-2 border-[#E2B054]/40 bg-stone-900/90 backdrop-blur-md text-amber-400 hover:text-amber-300 hover:border-[#E2B054]/70 shadow-[0_8px_30px_rgba(0,0,0,0.85)] active:scale-95 transition-all cursor-pointer group flex items-center justify-center w-14 h-14"
          title="Ver Contratos Ativos"
        >
          <Scroll className="w-6 h-6 group-hover:scale-110 transition-transform text-[#E2B054]" />

          {/* Badge count for active/unclaimed quests */}
          {pendingQuestsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 border border-red-400 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-md select-none">
              {pendingQuestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Quest Details Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="📜 CONTRATOS ATIVOS"
        variant="amber"
      >
        <div className="space-y-5">
          {/* Daily Quests Block */}
          <div className="space-y-3 bg-stone-950/40 p-4 rounded-xl border border-amber-500/10">
            <span className="text-[10px] uppercase font-serif tracking-widest text-[#E2B054]/60 font-black block mb-1">
              🎯 Contratos Diários
            </span>
            <div className="space-y-2.5">
              {dailies.map((q) => {
                const isCompleted = q.progress >= q.target;
                const isClaimed = isQuestClaimed(state, q.id);
                return (
                  <div key={q.id} className="flex flex-col gap-1 border-b border-amber-500/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isClaimed 
                            ? 'bg-stone-600' 
                            : isCompleted 
                              ? 'bg-amber-400 animate-pulse' 
                              : 'bg-amber-500/30'
                        }`} />
                        <span className={`font-serif font-black text-xs truncate ${
                          isClaimed 
                            ? 'text-amber-100/30 line-through' 
                            : isCompleted 
                              ? 'text-[#E2B054]' 
                              : 'text-amber-100/80'
                        }`}>
                          {q.name}
                        </span>
                      </div>
                      <span className={`font-mono text-xs flex-shrink-0 ${
                        isCompleted ? 'text-amber-400 font-bold' : 'text-amber-100/40'
                      }`}>
                        {q.progress}/{q.target}
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-100/50 font-serif leading-relaxed pl-3.5">
                      {q.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guild Quest Block */}
          <div className="bg-stone-950/40 p-4 rounded-xl border border-amber-500/10">
            <span className="text-[10px] uppercase font-serif tracking-widest text-[#E2B054]/60 font-black block mb-2">
              🛡️ Marcos da Jornada
            </span>
            {closestGuildQuest ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="font-serif font-black text-[#E2B054] text-xs truncate" title={closestGuildQuest.desc}>
                      {closestGuildQuest.name}
                    </h5>
                    <p className="text-[10px] text-amber-100/60 font-serif leading-relaxed mt-1">
                      {closestGuildQuest.desc}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-amber-400 font-bold flex-shrink-0">
                    {closestGuildQuest.progress}/{closestGuildQuest.target}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="h-2 w-full bg-stone-900 border border-amber-500/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, (closestGuildQuest.progress / closestGuildQuest.target) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center flex flex-col justify-center items-center">
                <span className="text-xs text-emerald-400 font-serif font-black uppercase">🏆 Todas as teses conquistadas!</span>
                <span className="text-[9px] text-amber-100/40 font-serif mt-1">Glória eterna para a sua dinastia!</span>
              </div>
            )}
          </div>

          {/* Nav Link Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setActiveTab('quests');
                if (setIsMobileSidebarOpen) {
                  setIsMobileSidebarOpen(false);
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-850 hover:to-stone-750 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition-all text-[10px] font-serif font-black uppercase tracking-widest rounded-lg cursor-pointer text-center select-none"
            >
              Ir para Painel de Contratos →
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
