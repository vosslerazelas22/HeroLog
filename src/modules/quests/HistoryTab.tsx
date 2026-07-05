import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryEntry } from '../../types';
import { BookOpen, Sparkles, AlertTriangle, ShieldCheck, Map, Eye, EyeOff, FileText } from 'lucide-react';

interface HistoryTabProps {
  history: HistoryEntry[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const [expandedChronicleId, setExpandedChronicleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'notes'>('all');

  const toggleChronicle = (id: string) => {
    setExpandedChronicleId(expandedChronicleId === id ? null : id);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-amber-100/50">
        <BookOpen className="w-12 h-12 mb-4 opacity-40 text-amber-500" />
        <p className="font-serif italic text-lg">Seu diário de jornada ainda está em branco.</p>
        <p className="text-xs text-amber-100/30 mt-1">Conclua sua primeira Missão de Foco para registrar novos feitos!</p>
      </div>
    );
  }

  const notesEntries = history.filter(entry => entry.notes && entry.notes.trim().length > 0);

  const renderToggle = () => (
    <div className="flex bg-stone-950/60 p-1.5 rounded-lg border border-amber-500/10 mb-4 gap-2">
      <button
        onClick={() => setViewMode('all')}
        className={`flex-1 text-center py-1.5 rounded text-[10px] md:text-xs font-serif uppercase tracking-widest transition-all cursor-pointer ${
          viewMode === 'all'
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold shadow-md'
            : 'text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/40'
        }`}
        id="history-tab-all-btn"
      >
        🛡️ Crônicas completas
      </button>
      <button
        onClick={() => setViewMode('notes')}
        className={`flex-1 text-center py-1.5 rounded text-[10px] md:text-xs font-serif uppercase tracking-widest transition-all cursor-pointer ${
          viewMode === 'notes'
            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold shadow-md'
            : 'text-amber-100/50 hover:text-amber-200 hover:bg-stone-900/40'
        }`}
        id="history-tab-notes-btn"
      >
        📝 Compilado de Notas
      </button>
    </div>
  );

  return (
    <div className="space-y-4 p-4 max-w-xl mx-auto">
      <h3 className="font-serif text-lg text-amber-400 border-b border-amber-500/20 pb-2 mb-4 tracking-wider uppercase flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-amber-500" />
        Crônicas da Alma (Histórico)
      </h3>

      {renderToggle()}

      {viewMode === 'notes' ? (
        notesEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-amber-100/50 bg-stone-950/20 border border-amber-500/5 rounded-lg p-6">
            <FileText className="w-10 h-10 mb-3 opacity-30 text-amber-500" />
            <p className="font-serif italic text-sm text-amber-150">Nenhuma Nota de Estudo registrada ainda.</p>
            <p className="text-[11px] text-amber-100/30 mt-1.5 max-w-xs leading-relaxed">
              Digite notas de estudo no formulário de foco ("Notas Teológicas") antes de iniciar suas missões para compilar teus registros aqui!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notesEntries.map((entry) => (
              <motion.div
                key={`compiled_note_${entry.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-950/40 border border-amber-500/10 rounded-lg p-4 space-y-2.5 relative shadow-md"
              >
                <div className="flex justify-between items-center text-[10px] text-amber-100/40 font-mono pb-1.5 border-b border-amber-500/5">
                  <span className="font-serif text-amber-400 font-bold uppercase tracking-wider">{entry.skillName}</span>
                  <span>{entry.date}</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-serif italic pl-3.5 border-l-2 border-amber-500/30">
                  "{entry.notes}"
                </p>
                <div className="text-[10px] text-amber-100/30 font-mono pt-1 text-right">
                  Duração do Estudo: {entry.duration} min
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {history.map((entry) => {
            const isExpanded = expandedChronicleId === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-950/10 border border-amber-500/10 rounded-lg p-3 hover:border-amber-500/30 transition-all shadow-md relative overflow-hidden"
              >
                {/* Gold light reflection detail on items developed with Wilderness mode */}
                {entry.wilderness && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rotate-45 translate-x-12 -translate-y-12 pointer-events-none" />
                )}

                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-amber-200 text-sm md:text-base font-serif flex items-center gap-2">
                      {entry.skillName}
                      {entry.wilderness && (
                        <span className="flex items-center gap-1 text-[10px] bg-red-950/40 border border-red-500/30 text-red-400 px-2 py-0.5 rounded uppercase font-sans tracking-widest">
                          Terra Selvagem
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-amber-100/40 font-mono mt-0.5">{entry.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 text-xs font-mono font-bold flex items-center justify-end gap-1">
                      ⚡ +{entry.xp} XP
                    </div>
                    <div className="text-amber-400 text-xs font-mono font-bold flex items-center justify-end gap-1">
                      💎 +{entry.gold} GP
                    </div>
                  </div>
                </div>

                {/* Study session notes */}
                {entry.notes && (
                  <div className="bg-amber-500/5 rounded p-2 text-xs text-amber-200/70 italic border-l-2 border-amber-500/30 leading-relaxed mb-2 font-serif">
                    "{entry.notes}"
                  </div>
                )}

                <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-amber-500/5">
                  <span className="text-amber-100/50 font-mono">⏱ Duração: {entry.duration}m</span>

                  {entry.aiChronicle ? (
                    <button
                      onClick={() => toggleChronicle(entry.id)}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold uppercase text-[10px] tracking-wider cursor-pointer select-none"
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Ocultar Crônica Mística
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Revelar Crônica Mística
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-[10px] text-amber-100/30 italic font-serif">
                      Nenhuma crônica antiga disponível
                    </div>
                  )}
                </div>

                {/* Expansible AI Chronicle in Magical Scroll aspect */}
                <AnimatePresence>
                  {isExpanded && entry.aiChronicle && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-b from-amber-500/[0.04] to-purple-500/[0.04] border border-amber-500/20 text-amber-100/80 leading-relaxed font-serif text-xs md:text-sm shadow-inner relative">
                        <div className="absolute top-2 right-2 opacity-15">
                          <Sparkles className="w-10 h-10 text-amber-400" />
                        </div>
                        <div className="whitespace-pre-wrap font-serif" style={{ fontStyle: 'normal' }}>
                          {entry.aiChronicle}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
