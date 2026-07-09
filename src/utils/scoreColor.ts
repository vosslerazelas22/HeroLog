/**
 * Retorna as classes CSS de gradiente e borda com base no score (pontuação) do hábito ou diária.
 * Adota o sistema de 7 faixas de cor aprovado para garantir contraste excelente e progressão visual clara.
 */
export const getScoreColor = (score: number): string => {
  if (score >= 10) return 'from-sky-900/60 to-cyan-950/40 border-sky-400/60';           // Azul brilhante
  if (score >= 5)  return 'from-sky-950/50 to-indigo-950/25 border-sky-500/40';         // Azul claro
  if (score >= 1)  return 'from-emerald-950/55 to-teal-950/25 border-emerald-500/50';   // Verde
  if (score >= -1) return 'from-amber-950/50 to-stone-900/30 border-amber-400/50';       // Amarelo (neutro)
  if (score >= -10) return 'from-orange-900/50 to-orange-800/25 border-orange-400/40';   // Laranja
  if (score >= -20) return 'from-red-950/60 to-red-900/30 border-red-500/40';           // Vermelho
  return 'from-red-950/85 to-black/60 border-red-700/60';                                // Vermelho escuro
};
