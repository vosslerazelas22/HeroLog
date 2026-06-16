import React from 'react';
import { CharacterState, Achievement } from '../types';
import { Award, Lock, Sparkles } from 'lucide-react';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_quest',
    name: 'Primeira Incursão',
    desc: 'Concluiu com êxito a primeira Missão de Foco.',
    icon: '⚔️',
    check: (s) => s.totalSessions >= 1,
  },
  {
    id: 'streak_3',
    name: 'Fagulha de Disciplina',
    desc: 'Manteve uma série consecutiva de 3 dias de estudo.',
    icon: '🔥',
    check: (s) => s.bestStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Inabalável',
    desc: 'Conquistou a lendária marca de 7 dias focando em sequência.',
    icon: '🏆',
    check: (s) => s.bestStreak >= 7,
  },
  {
    id: 'xp_1000',
    name: 'Mestre Alfabetizado',
    desc: 'Acumulou uma soma de 1000 pontos totais de XP.',
    icon: '📚',
    check: (s) => s.totalXP >= 1000,
  },
  {
    id: 'xp_10000',
    name: 'Sábio Iluminado',
    desc: 'Superou a extraordinária marca de 10.000 pontos totais de XP.',
    icon: '🧙',
    check: (s) => s.totalXP >= 10000,
  },
  {
    id: 'gp_1000',
    name: 'Rico em Espólios',
    desc: 'Armazenou nas arcas um patrimônio eterno de 1000 GP gulosamente.',
    icon: '💰',
    check: (s) => s.totalGoldEarned >= 1000,
  },
  {
    id: 'sessions_10',
    name: 'Veterano de Guerras',
    desc: 'Concluiu um total de 10 sessões na Gilda dos Aventureiros.',
    icon: '🎖️',
    check: (s) => s.totalSessions >= 10,
  },
  {
    id: 'survive_wilderness',
    name: 'Superação Extrema',
    desc: 'Sobreviveu à perigosa incursão sob o efeito de Wilderness.',
    icon: '💀',
    check: (s) => s.wildernessWins >= 1,
  }
];

interface AchievementsTabProps {
  state: CharacterState;
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({ state }) => {
  return (
    <div className="p-4 max-w-xl mx-auto space-y-5">
      <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
        <Award className="w-5 h-5 text-amber-500" />
        Feitos Gloriosos (Conquistas)
      </h3>

      <div className="space-y-2.5">
        {ACHIEVEMENTS_LIST.map((ach) => {
          const isUnlocked = state.achievements.includes(ach.id) || ach.check(state);
          
          return (
            <div
              key={ach.id}
              className={`border rounded-lg p-3 flex items-center gap-4 transition-all ${
                isUnlocked
                  ? 'bg-amber-500/[0.03] border-amber-500/30'
                  : 'bg-stone-950/10 border-stone-900 opacity-40'
              }`}
            >
              <div className="text-3xl p-1.5 rounded bg-stone-950/40 select-none flex-shrink-0">
                {isUnlocked ? ach.icon : <Lock className="w-6 h-6 text-stone-600 p-0.5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-bold text-sm tracking-wide text-amber-100/90">
                    {ach.name}
                  </h4>
                  {isUnlocked && (
                    <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Desbloqueado
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-100/40 font-serif mt-0.5">{ach.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
