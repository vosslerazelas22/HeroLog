import React, { useState } from 'react';
import { Daily } from '../../types';
import { Plus, Trash2, Edit2, CheckSquare, Square, Check, Filter, Settings, PlusCircle, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { getScoreColor } from '../../utils/scoreColor';
import { Modal } from '../../components/Modal';

interface DailiesTabProps {
  dailies: Daily[];
  onToggleDaily: (dailyId: string) => void;
  onToggleChecklistItem: (dailyId: string, itemId: string) => void;
  onAddDaily: (daily: Omit<Daily, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => void;
  onEditDaily: (daily: Daily) => void;
  onDeleteDaily: (dailyId: string) => void;
}

export const DailiesTab: React.FC<DailiesTabProps> = ({
  dailies,
  onToggleDaily,
  onToggleChecklistItem,
  onAddDaily,
  onEditDaily,
  onDeleteDaily,
}) => {

  const [isCreating, setIsCreating] = useState(false);
  const [editingDaily, setEditingDaily] = useState<Daily | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const handleCancelAttempt = () => {
    setIsConfirmingCancel(true);
  };

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<Daily['difficulty']>('Easy');
  const [streak, setStreak] = useState(0);
  const [repeats, setRepeats] = useState<Daily['repeats']>('Daily');
  const [every, setEvery] = useState(1);
  const [tagInput, setTagInput] = useState('');
  
  // Checklist creator list
  const [checklistInput, setChecklistInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [expandedDailyId, setExpandedDailyId] = useState<string | null>(null);

  const handleAddChecklistRaw = () => {
    if (!checklistInput.trim()) return;
    setChecklistItems([...checklistItems, checklistInput.trim()]);
    setChecklistInput('');
  };

  const removeChecklistItemRaw = (idx: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setDifficulty('Easy');
    setStreak(0);
    setRepeats('Daily');
    setEvery(1);
    setTagInput('');
    setChecklistItems([]);
    setChecklistInput('');
    setIsCreating(false);
    setEditingDaily(null);
    setIsConfirmingDelete(false);
    setIsConfirmingCancel(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (editingDaily) {
      onEditDaily({
        ...editingDaily,
        title: title.trim(),
        notes: notes.trim(),
        difficulty,
        repeats,
        every,
        tags,
        streak, // can manual adjust
      });
    } else {
      onAddDaily({
        title: title.trim(),
        notes: notes.trim(),
        difficulty,
        streak,
        repeats,
        every,
        tags,
        checklist: checklistItems,
      });
    }
    resetForm();
  };

  const startEdit = (daily: Daily) => {
    setEditingDaily(daily);
    setTitle(daily.title);
    setNotes(daily.notes);
    setDifficulty(daily.difficulty);
    setStreak(daily.streak);
    setRepeats(daily.repeats);
    setEvery(daily.every);
    setTagInput(daily.tags.join(', '));
    // Checklist isn't re-appended in simpler edit, to keep it clean, but they persist in current daily
    setIsCreating(true);
    setIsConfirmingDelete(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedDailyId(expandedDailyId === id ? null : id);
  };

  return (
    <div className="bg-quest-panel border-0 sm:border border-amber-500/15 rounded-none sm:rounded-lg overflow-hidden px-0 py-4 sm:px-5 sm:py-5 shadow-none sm:shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-4 font-serif text-amber-100/95 max-w-none sm:max-w-2xl mx-0 sm:mx-auto flex flex-col min-h-[500px] w-full flex-1">
      <div className="flex justify-between items-center border-b border-amber-500/15 pb-2 shrink-0 px-4 sm:px-0">
        <h3 className="text-sm md:text-base text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
          <span>📅</span> Tarefas Diárias
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-200 border border-amber-500/30 px-3 py-1 rounded bg-amber-500/5 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Novo
          </button>
        )}
      </div>

      <Modal
        isOpen={isCreating}
        onClose={handleCancelAttempt}
        title={editingDaily ? 'Editar Tarefa' : 'Nova Tarefa'}
        variant="amber"
      >
        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Título</label>
            <input
              type="text"
              placeholder="Ex: Beber medicação, Fazer Duolingo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-900/90 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Notas</label>
            <textarea
              placeholder="Ex: Ao acordar em jejum, abrir lição no celular..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-900/90 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans h-14 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Dificuldade</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Daily['difficulty'])}
                className="w-full bg-stone-900 border border-amber-500/20 rounded px-2 py-1.5 text-xs text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="Trivial">Trivial</option>
                <option value="Easy">Fácil</option>
                <option value="Medium">Médio</option>
                <option value="Hard">Difícil</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Regularidade</label>
              <div className="flex gap-1">
                <select
                  value={repeats}
                  onChange={(e) => setRepeats(e.target.value as Daily['repeats'])}
                  className="bg-stone-900 border border-amber-500/20 rounded px-2 py-1.5 text-xs text-amber-200 focus:outline-none cursor-pointer flex-1"
                >
                  <option value="Daily">Diário</option>
                  <option value="Weekly">Semanal</option>
                  <option value="Monthly">Mensal</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={every}
                  onChange={(e) => setEvery(parseInt(e.target.value) || 1)}
                  className="w-12 bg-stone-900 border border-amber-500/20 rounded px-1.5 py-1 text-center text-xs text-amber-100"
                  title="Intervalo da regularidade"
                />
              </div>
            </div>
          </div>

          {/* Checklist Area (Only when creating, simplifies edits) */}
          {!editingDaily && (
            <div className="bg-stone-900/45 p-2 rounded border border-amber-500/5 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Checklist</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: Lição completa, Revisar caderno..."
                  value={checklistInput}
                  onChange={(e) => setChecklistInput(e.target.value)}
                  className="flex-1 bg-stone-950 border border-amber-500/10 rounded px-2 py-1 text-xs text-amber-100 font-sans focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistRaw(); } }}
                />
                <button
                  type="button"
                  onClick={handleAddChecklistRaw}
                  className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-300 font-bold"
                >
                  +
                </button>
              </div>

              {checklistItems.length > 0 && (
                <div className="space-y-1 pt-1 pl-1 max-h-24 overflow-y-auto">
                  {checklistItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-sans text-amber-100/60 bg-stone-950/20 px-2 py-0.5 rounded">
                      <span>• {item}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistItemRaw(idx)}
                        className="text-stone-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-amber-400">Série Inicial (Streak)</label>
              <input
                type="number"
                min="0"
                value={streak}
                onChange={(e) => setStreak(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-stone-900 border border-amber-500/20 rounded px-2 py-1 text-xs text-amber-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-amber-400">Categorias (Tags, separadas por vírgula)</label>
              <input
                type="text"
                placeholder="study, workout, health..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full bg-stone-900 border border-amber-500/20 rounded px-2 py-1 text-xs text-amber-100 font-sans"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1.5 flex-wrap">
            {editingDaily && (
              <>
                {!isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="bg-rose-950/40 hover:bg-rose-900/45 text-rose-300 border border-rose-500/30 px-3 py-2 rounded text-xs uppercase font-bold cursor-pointer transition-all"
                  >
                    Excluir
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/25 px-2.5 py-1.5 rounded animate-fadeIn">
                    <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider mr-1">Excluir?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteDaily(editingDaily.id);
                        resetForm();
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer transition-all"
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer transition-all"
                    >
                      Não
                    </button>
                  </div>
                )}
              </>
            )}
            <button
              type="submit"
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-400/40 py-2 rounded text-xs uppercase font-bold cursor-pointer transition-all"
            >
              {editingDaily ? 'Salvar' : 'Criar'}
            </button>
            {!isConfirmingCancel ? (
              <button
                type="button"
                onClick={handleCancelAttempt}
                className="px-4 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 py-2 rounded text-xs uppercase cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-2.5 py-1.5 rounded animate-fadeIn">
                <span className="text-[10px] text-stone-300 uppercase font-bold tracking-wider mr-1">Descartar?</span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-stone-700 hover:bg-stone-600 text-stone-100 px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer transition-all"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingCancel(false)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded text-[10px] uppercase font-bold cursor-pointer transition-all"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Dailies Layout Grid/List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1 px-4 sm:px-0">
        {dailies.length === 0 ? (
          <div className="text-center py-10 bg-stone-950/20 border border-dashed border-amber-500/10 rounded-lg p-5">
            <p className="text-xs text-amber-100/40 italic">Nenhum voto de prática diária estabelecido neste plano. Adicione tarefas para forjar hábitos duradouros todos os dias!</p>
          </div>
        ) : (
          dailies.map((d) => {
            const hasChecklist = d.checklist && d.checklist.length > 0;
            const completedCount = d.checklist ? d.checklist.filter(i => i.completed).length : 0;
            const isFullyChecked = hasChecklist ? completedCount === d.checklist.length : d.completed;

            const getFrequencyText = () => {
              if (d.repeats === 'Daily' && d.every === 1) return 'Repete diariamente';
              if (d.repeats === 'Weekly' && d.every === 1) return 'Repete semanalmente';
              if (d.repeats === 'Monthly' && d.every === 1) return 'Repete mensalmente';
              
              const freqName = d.repeats === 'Daily' ? 'Diário' : d.repeats === 'Weekly' ? 'Semanal' : 'Mensal';
              return `Repete: ${freqName} (a cada ${d.every}x)`;
            };

            const score = d.value ?? 0;

            return (
              <div
                key={d.id}
                className={`flex flex-col bg-gradient-to-r ${getScoreColor(score)} border rounded-lg relative overflow-hidden transition-all hover:border-amber-500/35 ${
                  d.completed ? 'opacity-70' : ''
                }`}
              >
                {/* Top Section / Primary Row */}
                <div className="flex items-stretch min-h-[56px]">
                  {/* Left Completion Toggle Button - Flush Band */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDaily(d.id);
                    }}
                    className={`w-12 self-stretch rounded-l-lg border-r transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 ${
                      d.completed
                        ? 'bg-sky-500/20 border-sky-500/25 text-sky-300 hover:bg-sky-500/30'
                        : 'bg-stone-900 border-amber-500/10 text-stone-600 hover:bg-stone-850 hover:border-amber-500/35 hover:text-amber-500/60'
                    }`}
                    title={d.completed ? 'Marcar incompleta' : 'Marcar concluída'}
                  >
                    {d.completed ? (
                      <Check className="w-6 h-6 font-bold" />
                    ) : (
                      <div className="w-2.5 h-2.5 bg-amber-500/40 rounded-sm" />
                    )}
                  </button>
 
                  {/* Daily details description - Content container */}
                  <div
                    onClick={() => startEdit(d)}
                    className="flex-1 min-w-0 text-left p-3 space-y-1.5 cursor-pointer"
                  >
                    {/* Nome do Daily & Estado (Difficulty badge) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`font-serif font-bold text-sm md:text-[15px] truncate transition-colors ${
                        d.completed ? 'text-sky-300/80 line-through' : 'text-amber-100'
                      }`}>
                        {d.title}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded leading-none uppercase ${
                        d.difficulty === 'Trivial' ? 'bg-amber-500/10 text-amber-400/80 border-amber-500/10' :
                        d.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/10' :
                        d.difficulty === 'Medium' ? 'bg-purple-500/10 text-purple-400/80 border-purple-500/10' :
                        'bg-rose-500/10 text-rose-400/85 border-rose-500/10'
                      }`}>
                        {d.difficulty === 'Trivial' ? 'Trivial' : d.difficulty === 'Easy' ? 'Fácil' : d.difficulty === 'Medium' ? 'Médio' : 'Difícil'}
                      </span>
                    </div>

                    {d.notes && (
                      <p className="text-xs text-amber-100/65 font-sans leading-relaxed mt-0.5">
                        {d.notes}
                      </p>
                    )}

                    {/* Sequência atual + Checklist Progress + Repetition */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[10px] md:text-[11px] font-mono leading-none text-amber-100/40">
                      {/* Sequência atual (com medalha) */}
                      <span className="font-semibold text-amber-300" title="Série de Dias">
                        🏅 {d.streak}
                      </span>

                      <span className="text-amber-500/20 select-none">•</span>

                      {/* Repetição info */}
                      <span>
                        {getFrequencyText()}
                      </span>

                      {hasChecklist && (
                        <>
                          <span className="text-amber-500/20 select-none">•</span>
                          {/* Checklist progress */}
                          <span className="text-purple-400 font-bold">
                            📋 {completedCount} de {d.checklist.length} critérios
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Checklist Toggle - Right Flush Band */}
                  {hasChecklist && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(d.id);
                      }}
                      className="px-3 self-stretch border-l border-amber-500/10 hover:bg-stone-900/35 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer text-amber-100/30 hover:text-amber-100"
                      title="Ver Checklist"
                    >
                      {expandedDailyId === d.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Expanded Checklist Sub-Items Panel */}
                {hasChecklist && (expandedDailyId === d.id || d.completed) && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-stone-900/40 border-t border-amber-500/5 px-4 py-2 space-y-1.5"
                  >
                    {d.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-xs font-sans text-amber-200/70 hover:text-amber-200 transition-all py-0.5"
                      >
                        <button
                          onClick={() => onToggleChecklistItem(d.id, item.id)}
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer ${
                            item.completed
                              ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                              : 'bg-stone-950 border-stone-700 text-stone-500 hover:border-amber-500/40'
                          }`}
                        >
                          {item.completed && <div className="w-1.5 h-1.5 bg-purple-400 rounded-sm" />}
                        </button>
                        <span className={`text-[11px] ${item.completed ? 'line-through text-stone-500' : 'text-amber-100/70'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
