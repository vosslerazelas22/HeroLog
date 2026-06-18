import React from 'react';
import { HistoryEntry } from '../types';

interface HeatmapTabProps {
  history: HistoryEntry[];
  streak: number;
  bestStreak?: number;
}

export const HeatmapTab: React.FC<HeatmapTabProps> = ({ history, streak }) => {
  // 1. Mapear o total de minutos focados por dia
  const minutesByDay: { [dateKey: string]: number } = {};
  
  history.forEach((entry) => {
    const datePart = entry.date.split(',')[0].trim(); // Formato esperado "DD/MM/YYYY" ou "D/M/YYYY"
    if (datePart) {
      minutesByDay[datePart] = (minutesByDay[datePart] || 0) + (entry.duration || 0);
    }
  });

  // Função auxiliar de parsing para converter string "DD/MM/YYYY" em objeto Date correto
  const parseDatePart = (dateStr: string): Date => {
    const parts = dateStr.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d);
  };

  // 2. Calcular estatísticas úteis baseadas em minutos
  const todayDate = new Date();
  const todayMidnight = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  
  // Encontrar a segunda-feira desta semana
  const currentDayOfWeek = todayMidnight.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const thisMonday = new Date(todayMidnight);
  thisMonday.setDate(todayMidnight.getDate() - daysToMonday);

  // Início do mês vigente
  const thisMonthStart = new Date(todayMidnight.getFullYear(), todayMidnight.getMonth(), 1);

  // Estatística: Dias de Estudo (contar dias únicos com algum minuto focado)
  const totalStudyDays = Object.values(minutesByDay).filter(mins => mins > 0).length;

  // Estatística: Melhor Dia (recorde absoluto de minutos)
  const bestDayMinutes = Object.values(minutesByDay).length > 0 
    ? Math.max(...Object.values(minutesByDay)) 
    : 0;

  // Estatística: Esta Semana (Soma total dos focos a partir de segunda-feira)
  // Estatística: Este Mês (Soma total dos focos a partir do dia 1 do mês)
  let thisWeekMinutes = 0;
  let thisMonthMinutes = 0;

  Object.entries(minutesByDay).forEach(([dateKey, minutes]) => {
    try {
      const cellDate = parseDatePart(dateKey);
      const cellMidnight = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());

      if (cellMidnight >= thisMonday && cellMidnight <= todayMidnight) {
        thisWeekMinutes += minutes;
      }
      if (cellMidnight >= thisMonthStart && cellMidnight <= todayMidnight) {
        thisMonthMinutes += minutes;
      }
    } catch {
      // Ignorar erros de Parsing em dados corrompidos
    }
  });

  // Formatar minutos para string amigável (ex: "85 Min", "15 Min" ou "2h 15m")
  const formatMinutes = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0 Min';
    if (minutes < 60) return `${minutes} Min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // 3. Montar a Grelha de 24 Semanas (últimas 24 semanas - 168 dias, Segunda a Domingo)
  // A última semana na grelha inicia na segunda-feira atual (thisMonday) e finaliza no próximo domingo.
  // Então, a data de início da grelha é segunda-feira de 23 semanas atrás.
  const startMondayOfGrid = new Date(thisMonday);
  startMondayOfGrid.setDate(thisMonday.getDate() - 23 * 7);

  const cells: {
    date: string;
    dateObj: Date;
    minutes: number;
    className: string;
    isFuture: boolean;
    isToday: boolean;
  }[] = [];

  for (let i = 0; i < 168; i++) {
    const d = new Date(startMondayOfGrid);
    d.setDate(startMondayOfGrid.getDate() + i);

    const dateKey = d.toLocaleDateString('pt-BR');
    const dayMinutes = minutesByDay[dateKey] || 0;

    // Verificar se a data é futura
    const isFuture = d > todayMidnight;
    const isToday = d.toDateString() === todayMidnight.toDateString();

    // Determinar a classe de cor conforme escala:
    // 0 MIN: Sem preenchimento sob moldura escura.
    // 1–29 MIN: Verde escuro místico.
    // 30–59 MIN: Verde médio vívido.
    // 60–89 MIN: Verde claro brilhante.
    // 90+ MIN: Dourado heráldico refinado.
    let fillClass = '';

    if (isFuture) {
      fillClass = 'bg-stone-900 border-amber-500/[0.01] opacity-20 cursor-not-allowed';
    } else if (dayMinutes === 0) {
      fillClass = isToday
        ? 'bg-stone-950/40 border-[#C29544] shadow-[0_0_8px_rgba(194,149,68,0.25)]'
        : 'bg-stone-950/40 border-amber-500/5 hover:border-amber-500/25';
    } else if (dayMinutes >= 1 && dayMinutes <= 29) {
      fillClass = 'bg-[#132c1c] border-[#1a452a] hover:border-emerald-600/50';
    } else if (dayMinutes >= 30 && dayMinutes <= 59) {
      fillClass = 'bg-[#1b5e20] border-[#2e7d32] hover:border-emerald-400/50 text-emerald-100 font-medium';
    } else if (dayMinutes >= 60 && dayMinutes <= 89) {
      fillClass = 'bg-[#4caf50] border-[#81c784] text-stone-950 font-bold hover:border-emerald-100';
    } else { // 90+ MIN (Dourado heráldico)
      fillClass = 'bg-[#C29544] border-amber-300 text-stone-950 font-black shadow-[0_0_8px_rgba(194,149,68,0.45)] hover:border-white';
    }

    cells.push({
      date: dateKey,
      dateObj: d,
      minutes: dayMinutes,
      className: fillClass,
      isFuture,
      isToday,
    });
  }

  // 4. Mapear rótulos mensais nas colunas da grelha (24 colunas)
  const monthLabels: { col: number; name: string }[] = [];
  const monthNames = ['JAN.', 'FEV.', 'MAR.', 'ABR.', 'MAI.', 'JUN.', 'JUL.', 'AGO.', 'SET.', 'OUT.', 'NOV.', 'DEZ.'];

  for (let col = 0; col < 24; col++) {
    // Pegamos a segunda-feira correspondente àquela semana
    const wMonday = new Date(startMondayOfGrid);
    wMonday.setDate(startMondayOfGrid.getDate() + col * 7);

    // Se for col 0 ou se o mês mudar em relação à coluna anterior
    let shouldAdd = col === 0;
    if (col > 0) {
      const prevWMonday = new Date(startMondayOfGrid);
      prevWMonday.setDate(startMondayOfGrid.getDate() + (col - 1) * 7);
      if (wMonday.getMonth() !== prevWMonday.getMonth()) {
        shouldAdd = true;
      }
    }

    if (shouldAdd) {
      monthLabels.push({
        col,
        name: monthNames[wMonday.getMonth()],
      });
    }
  }

  return (
    <div className="p-1 space-y-5 text-amber-100 font-serif">
      {/* Bloco do Mapa de Calor com visual medieval/computação RPG */}
      <div className="bg-stone-950/25 border border-amber-500/10 p-4 rounded-lg space-y-4 relative shadow-2xl">
        
        {/* Título do Painel superior */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-500/10 pb-2 mb-1 gap-1 select-none">
          <div>
            <h4 className="text-[10px] sm:text-xs uppercase tracking-widest text-[#E2B054] font-bold font-serif">
              CONSERVAÇÃO DO DEVER — ÚLTIMAS 24 SEMANAS
            </h4>
            <p className="text-[9px] text-amber-100/35 font-serif italic mt-0.5">Sua consagração é medida em horas e minutos focados</p>
          </div>
          <div className="text-[10px] font-mono text-[#E2B054] font-black bg-[#C29544]/5 px-2 py-0.5 rounded border border-[#C29544]/20">
            Streak Atual: {streak} {streak === 1 ? 'Dia' : 'Dias'} 🔥
          </div>
        </div>

        {/* Linha dos Meses */}
        <div className="flex gap-2 select-none relative">
          {/* Alinhamento ao primeiro dia da semana */}
          <div className="w-7 flex-shrink-0" />
          
          <div className="flex-1 grid gap-1 md:gap-1.5" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
            {Array.from({ length: 24 }).map((_, col) => {
              const label = monthLabels.find(l => l.col === col);
              return (
                <div key={col} className="text-center">
                  {label ? (
                    <span className="text-[8.5px] font-bold text-amber-500/80 font-serif block truncate tracking-tight">
                      {label.name}
                    </span>
                  ) : (
                    <span className="block h-3.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Matriz Principal */}
        <div className="flex gap-2">
          {/* Dias da semana (SEG, QUA, SEX, DOM) */}
          <div className="flex flex-col justify-between text-[8px] font-sans font-bold pr-1 text-right select-none w-7 flex-shrink-0 text-amber-100/40 text-right leading-[14px]">
            <span>SEG</span>
            <span className="opacity-0">TER</span>
            <span>QUA</span>
            <span className="opacity-0">QUI</span>
            <span>SEX</span>
            <span className="opacity-0">SÁB</span>
            <span>DOM</span>
          </div>

          {/* Grelha de Colunas (Semanas) */}
          <div className="flex-1 grid gap-1 md:gap-1.5" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
            {Array.from({ length: 24 }).map((_, col) => {
              return (
                <div key={col} className="flex flex-col gap-1 md:gap-1.5">
                  {Array.from({ length: 7 }).map((_, row) => {
                    const cellIndex = col * 7 + row;
                    const cell = cells[cellIndex];
                    if (!cell) return null;

                    // Texto descritivo para tooltip clássico
                    const tooltipText = cell.isFuture 
                      ? "Portal do Amanhã (No Futuro)" 
                      : `${cell.date}: Foco de ${formatMinutes(cell.minutes)}`;

                    return (
                      <div
                        key={row}
                        className={`aspect-square w-full rounded-[2px] border cursor-help transition-all flex items-center justify-center text-[7.5px] font-sans ${cell.className}`}
                        title={tooltipText}
                      >
                        {/* Indicador discreto para focos heróicos (90m+) no celular/desktop */}
                        {cell.minutes >= 90 && !cell.isFuture && (
                          <span className="font-extrabold select-none">★</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda de minutos */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2 border-t border-amber-500/[0.05] select-none">
          <span className="text-[9px] text-[#A2A2A2] font-mono">
            Passe o mouse ou toque nos blocos para ver os detalhes diários de estudo.
          </span>
          
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-100/40">
            <span>MENOS</span>
            <div className="w-2.5 h-2.5 bg-stone-950/40 border border-amber-500/5 rounded-[2px]" title="0 min" />
            <div className="w-2.5 h-2.5 bg-[#132c1c] border border-[#1a452a] rounded-[2px]" title="1 - 29 min" />
            <div className="w-2.5 h-2.5 bg-[#1b5e20] border border-[#2e7d32] rounded-[2px]" title="30 - 59 min" />
            <div className="w-2.5 h-2.5 bg-[#4caf50] border border-[#81c784] rounded-[2px]" title="60 - 89 min" />
            <div className="w-2.5 h-2.5 bg-[#C29544] border border-amber-300 rounded-[2px]" title="90+ min (Dourado de Elite)" />
            <span>MAIS</span>
          </div>
        </div>
      </div>

      {/* Painéis de Estatísticas Estilo RPG conforme o Print Anexo */}
      <div className="space-y-2">
        {/* Linha Tripla superior */}
        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Dias de Estudo */}
          <div className="bg-stone-950/40 border border-[#C29544]/20 hover:border-[#C29544]/40 transition-all rounded p-2.5 text-center flex flex-col justify-center items-center min-w-0 select-none border-stone-800/80">
            <span className="text-[8.5px] uppercase tracking-widest text-[#9F9F9F]">DIAS DE ESTUDO</span>
            <span className="text-[11.5px] font-bold text-amber-200 mt-1 uppercase">
              {totalStudyDays} {totalStudyDays === 1 ? 'Dia' : 'Dias'}
            </span>
          </div>

          {/* Card 2: Melhor Dia */}
          <div className="bg-stone-950/40 border border-[#C29544]/20 hover:border-[#C29544]/40 transition-all rounded p-2.5 text-center flex flex-col justify-center items-center min-w-0 select-none border-stone-800/80">
            <span className="text-[8.5px] uppercase tracking-widest text-[#9F9F9F]">MELHOR DIA</span>
            <span className="text-[11.5px] font-bold text-[#E2B054] mt-1 uppercase">
              {formatMinutes(bestDayMinutes)}
            </span>
          </div>

          {/* Card 3: Esta Semana */}
          <div className="bg-stone-950/40 border border-[#C29544]/20 hover:border-[#C29544]/40 transition-all rounded p-2.5 text-center flex flex-col justify-center items-center min-w-0 select-none border-stone-800/80">
            <span className="text-[8.5px] uppercase tracking-widest text-[#9F9F9F]">ESTA SEMANA</span>
            <span className="text-[11.5px] font-bold text-amber-200 mt-1 uppercase">
              {formatMinutes(thisWeekMinutes)}
            </span>
          </div>
        </div>

        {/* Bloco Largo Inferior: Este Mês */}
        <div className="bg-stone-950/50 border border-[#C29544]/30 hover:border-[#C29544]/50 transition-all rounded p-3 text-center flex flex-col justify-center items-center select-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
          <span className="text-[9px] uppercase tracking-widest text-[#A2A2A2]">ESTE MÊS</span>
          <span className="text-sm font-black text-[#E2B054] mt-1 tracking-wide uppercase">
            {formatMinutes(thisMonthMinutes)}
          </span>
        </div>
      </div>
    </div>
  );
};
