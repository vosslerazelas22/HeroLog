import React from 'react';
import { CharacterState } from '../../types';
import { BarChart3, Clock, Flame, Coins, ShieldAlert, Swords, Timer, Zap } from 'lucide-react';

interface StatsTabProps {
  state: CharacterState;
}

export const StatsTab: React.FC<StatsTabProps> = ({ state }) => {
  const averageSessionLength = state.totalSessions > 0 
    ? Math.floor(state.totalMinutes / state.totalSessions) 
    : 0;

  const totalHours = (state.totalMinutes / 60).toFixed(1);

  const stats = [
    {
      label: 'Sessões Fechadas',
      value: state.totalSessions,
      desc: 'Missões completadas na gilda',
      icon: Swords,
      color: 'text-amber-400 border-amber-500/10 bg-amber-500/[0.02]',
    },
    {
      label: 'Tempo Acumulado',
      value: `${totalHours} horas`,
      desc: 'Horas totais de transcendência',
      icon: Clock,
      color: 'text-purple-400 border-purple-500/10 bg-purple-500/[0.02]',
    },
    {
      label: 'Média de Incursão',
      value: `${averageSessionLength} min`,
      desc: 'Duração média de cada missão',
      icon: Timer,
      color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/[0.02]',
    },
    {
      label: 'Maior Série Histórica',
      value: `${state.bestStreak} dias`,
      desc: 'Série máxima de dias cultivados',
      icon: Flame,
      color: 'text-red-400 border-red-500/10 bg-red-500/[0.02]',
    },
    {
      label: 'Moedas Acumuladas',
      value: `${state.totalGoldEarned} GP`,
      desc: 'Soma total de espólios extraídos',
      icon: Coins,
      color: 'text-amber-500 border-amber-500/10 bg-amber-550/[0.02]',
    },
    {
      label: 'Vitórias da Wilderness',
      value: state.wildernessWins,
      desc: 'Sobrevivências em terra selvagem',
      icon: ShieldAlert,
      color: 'text-rose-400 border-rose-500/10 bg-rose-500/[0.02]',
    }
  ];

  return (
    <div className="p-4 max-w-xl mx-auto space-y-5">
      <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-amber-500" />
        Santuário das Crônicas (Análise)
      </h3>

      <div className="grid grid-cols-2 gap-3.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 border rounded-lg flex flex-col justify-between shadow-md hover:border-amber-500/20 transition-all ${stat.color}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-serif tracking-wider text-amber-100/40">
                  {stat.label}
                </span>
                <Icon className="w-4 h-4 opacity-50" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold font-mono text-amber-100">{stat.value}</p>
                <p className="text-[10px] text-amber-100/30 mt-0.5 leading-tight">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
