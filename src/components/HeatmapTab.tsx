import React from 'react';
import { HistoryEntry } from '../types';
import { Calendar, Flame, Award } from 'lucide-react';

interface HeatmapTabProps {
  history: HistoryEntry[];
  streak: number;
}

export const HeatmapTab: React.FC<HeatmapTabProps> = ({ history, streak }) => {
  // Map study frequency per calendar dates
  const sessionsByDay: { [dateKey: string]: number } = {};

  history.forEach((entry) => {
    // Formats dates to standard locale string to parse correctly (e.g. key: "11/06/2026")
    const datePart = entry.date.split(',')[0].trim();
    if (datePart) {
      sessionsByDay[datePart] = (sessionsByDay[datePart] || 0) + 1;
    }
  });

  const cells = [];
  const today = new Date();

  // Create back-dated grid of 90 days
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateString = d.toLocaleDateString('pt-BR');
    const sessionCount = sessionsByDay[dateString] || 0;

    // Define color intensities based on study accomplishments (golden scale)
    let fillClass = 'bg-stone-900 border-amber-500/5 hover:border-amber-500/30';
    if (sessionCount === 1) {
      fillClass = 'bg-amber-950/40 border-amber-800/40 hover:border-amber-500/50';
    } else if (sessionCount === 2) {
      fillClass = 'bg-amber-900/60 border-amber-700/60 hover:border-amber-500/70';
    } else if (sessionCount === 3) {
      fillClass = 'bg-amber-700/80 border-amber-500/80 hover:border-amber-400';
    } else if (sessionCount >= 4) {
      fillClass = 'bg-amber-500 text-stone-950 border-amber-300 hover:scale-110';
    }

    cells.push({
      date: dateString,
      count: sessionCount,
      className: fillClass,
    });
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-5">
      <div className="bg-amber-500/[0.02] border border-amber-500/10 rounded-lg p-4 space-y-4 shadow-md">
        <div className="flex justify-between items-center bg-stone-950/20 p-3 rounded-lg border border-amber-500/5">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20 animate-pulse" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-amber-100/40 font-serif">Série de Ofício</p>
              <p className="text-sm font-semibold text-amber-200">{streak} dias ininterruptos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-amber-100/40 font-serif">Fase do Herói</p>
              <p className="text-xs text-amber-400 font-semibold font-serif">
                {streak >= 15 ? 'Grande Iluminado' : streak >= 7 ? 'Sábio Dedicado' : streak >= 3 ? 'Iniciado' : 'Errante Solitário'}
              </p>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] text-amber-100/30 uppercase font-serif tracking-widest px-1">
            <span>Há 90 dias</span>
            <span>Hoje</span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 md:gap-2">
            {cells.map((cell, idx) => (
              <div
                key={idx}
                className={`aspect-square w-full rounded border flex items-center justify-center text-[9px] font-mono select-none pointer-events-auto transition-all cursor-crosshair ${cell.className}`}
                title={`${cell.date}: ${cell.count} sessão(ões) concluída(s)`}
              >
                {cell.count > 0 && (
                  <span className={cell.count >= 4 ? 'text-stone-950 font-bold' : 'text-amber-300'}>
                    {cell.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 pt-2 text-[10px] text-amber-100/40 font-sans">
          <span>Menos Foco</span>
          <div className="w-3.5 h-3.5 bg-stone-900 border border-amber-500/5 rounded" />
          <div className="w-3.5 h-3.5 bg-amber-950/40 border border-amber-800/40 rounded" />
          <div className="w-3.5 h-3.5 bg-amber-900/60 border border-amber-700/60 rounded" />
          <div className="w-3.5 h-3.5 bg-amber-700/80 border border-amber-500/80 rounded" />
          <div className="w-3.5 h-3.5 bg-amber-500 rounded" />
          <span>Máximo</span>
        </div>
      </div>
    </div>
  );
};
