import { Daily } from '../types';

/**
 * Verifica se uma Daily estava agendada para uma determinada data.
 * No caso de Daily com repeats: 'Daily', calcula matematicamente com base em createdAt e every.
 * Para Weekly/Monthly, atualmente retorna true como fallback seguro (limitação conhecida de falta de dados).
 */
export function wasDailyScheduledForDate(daily: Daily, date: Date): boolean {
  if (daily.repeats === 'Daily') {
    if (!daily.createdAt) return true; // Fallback seguro para legados
    
    const created = new Date(daily.createdAt);
    
    // Normaliza ambas as datas para o início do dia local para calcular a diferença real de dias
    const createdZero = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = dateZero.getTime() - createdZero.getTime();
    const diffDays = Math.round(diffTime / 86400000);
    
    const every = daily.every > 0 ? daily.every : 1;
    return diffDays >= 0 && diffDays % every === 0;
  }
  
  // LIMITAÇÃO CONHECIDA: Weekly/Monthly não têm dados suficientes (como dia específico da semana/mês)
  // para verificação precisa. Elas são tratadas como sempre agendadas por enquanto.
  return true;
}
