import React, { useState } from 'react';
import { Habit } from '../types';
import { Plus, Minus, Trash2, Edit2, RotateCcw, AlertTriangle, Sparkles, Filter, PlusCircle } from 'lucide-react';

interface HabitsTabProps {
  habits: Habit[];
  onTriggerHabit: (habitId: string, isUp: boolean) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'upCount' | 'downCount' | 'streak'>) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsTab: React.FC<HabitsTabProps> = ({
  habits,
  onTriggerHabit,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [up, setUp] = useState(true);
  const [down, setDown] = useState(false);
  const [difficulty, setDifficulty] = useState<Habit['difficulty']>('Easy');
  const [tagInput, setTagInput] = useState('');

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setUp(true);
    setDown(false);
    setDifficulty('Easy');
    setTagInput('');
    setIsCreating(false);
    setEditingHabit(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (editingHabit) {
      onEditHabit({
        ...editingHabit,
        title: title.trim(),
        notes: notes.trim(),
        up,
        down,
        difficulty,
        tags,
      });
    } else {
      onAddHabit({
        title: title.trim(),
        notes: notes.trim(),
        up,
        down,
        difficulty,
        tags,
      });
    }
    resetForm();
  };

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setNotes(habit.notes);
    setUp(habit.up);
    setDown(habit.down);
    setDifficulty(habit.difficulty);
    setTagInput(habit.tags.join(', '));
    setIsCreating(true);
  };

  // Get color for habit score (upCount - downCount)
  const getHabitScoreColor = (habit: Habit) => {
    const score = habit.upCount - habit.downCount;
    if (score > 5) return 'from-emerald-950/40 to-emerald-900/10 border-emerald-500/20';
    if (score > 0) return 'from-teal-950/40 to-teal-900/10 border-teal-500/20';
    if (score === 0) return 'from-amber-950/20 to-stone-900/10 border-amber-500/10';
    if (score > -5) return 'from-orange-950/40 to-orange-900/10 border-orange-500/20';
    return 'from-rose-950/50 to-rose-900/20 border-rose-500/30';
  };

  return (
    <div className="p-4 space-y-4 font-serif text-amber-100/95 max-w-2xl mx-auto">
      <div className="flex justify-between items-center border-b border-amber-500/15 pb-2">
        <h3 className="text-sm md:text-base text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
          <span>⚡</span> Capela de Hábitos
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-200 border border-amber-500/30 px-3 py-1 rounded bg-amber-500/5 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Novo Hábito
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-stone-950/80 border border-amber-500/20 p-4 rounded-lg space-y-3 shadow-xl">
          <h4 className="text-xs text-amber-300 uppercase font-bold tracking-wider border-b border-amber-500/10 pb-1 flex flex-wrap items-center justify-between gap-2">
            <span>{editingHabit ? '🧙 Editar Pergaminho de Hábito' : '✨ Consagrar Novo Hábito'}</span>
            <button type="button" onClick={resetForm} className="text-[10px] text-amber-100/40 hover:text-amber-200 uppercase">Cancelar</button>
          </h4>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Título do Hábito</label>
            <input
              type="text"
              placeholder="Ex: Beber água purificada, Estudar grimório, Procrastinar..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-900/90 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Notas / Sábios Detalhes</label>
            <textarea
              placeholder="Ex: Cada gole limpa a mente, estudar por 20 minutos consecutivamente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-900/90 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans h-16 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Caminhos Permitidos</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUp(!up)}
                  className={`flex-1 py-1.5 px-2 text-xs rounded border transition-all uppercase font-bold flex items-center justify-center gap-1 cursor-pointer ${
                    up ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-stone-900 border-stone-800 text-stone-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Positivo (+)
                </button>
                <button
                  type="button"
                  onClick={() => setDown(!down)}
                  className={`flex-1 py-1.5 px-2 text-xs rounded border transition-all uppercase font-bold flex items-center justify-center gap-1 cursor-pointer ${
                    down ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-stone-900 border-stone-800 text-stone-500'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Negativo (-)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Grau de Dificuldade</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Habit['difficulty'])}
                className="w-full bg-stone-900 border border-amber-500/20 rounded px-2 py-1.5 text-xs text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="Trivial">Trivial</option>
                <option value="Easy">Fácil</option>
                <option value="Medium">Médio</option>
                <option value="Hard">Difícil</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Etiquetas/Tags (separados por vírgula)</label>
            <input
              type="text"
              placeholder="study, workout, health..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-stone-900 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          <div className="flex gap-2 pt-1.5">
            <button
              type="submit"
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-400/40 py-2 rounded text-xs uppercase font-bold cursor-pointer transition-all"
            >
              {editingHabit ? 'Salvar' : 'Criar Hábito'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 py-2 rounded text-xs uppercase cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {habits.length === 0 ? (
          <div className="text-center py-10 bg-stone-950/20 border border-dashed border-amber-500/10 rounded-lg p-5">
            <p className="text-xs text-amber-100/40 italic">A heráldica de seus hábitos está em branco. Comece definindo comportamentos diários positivos ou rituais de quebra de vícios!</p>
          </div>
        ) : (
          habits.map((h) => {
            const score = h.upCount - h.downCount;
            return (
              <div
                key={h.id}
                className={`flex items-center gap-3 bg-gradient-to-r ${getHabitScoreColor(h)} border rounded-lg p-2 md:p-3 transition-all relative overflow-hidden group`}
              >
                {/* Trigger Up Button */}
                {h.up ? (
                  <button
                    onClick={() => onTriggerHabit(h.id, true)}
                    className="w-8 h-8 rounded bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400 text-emerald-400 hover:text-emerald-200 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 shadow-lg"
                    title="Registrar ação positiva"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="w-8 h-8 flex-shrink-0" />
                )}

                {/* Habit Body */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-serif font-bold text-xs md:text-sm text-amber-100 truncate">
                      {h.title}
                    </h4>
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded leading-none uppercase select-none ${
                      h.difficulty === 'Trivial' ? 'bg-amber-500/10 text-amber-400/80 border border-amber-500/10' :
                      h.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10' :
                      h.difficulty === 'Medium' ? 'bg-purple-500/10 text-purple-400/80 border border-purple-500/10' :
                      'bg-rose-500/10 text-rose-400/85 border border-rose-500/10'
                    }`}>
                      {h.difficulty === 'Trivial' ? 'Trivial' : h.difficulty === 'Easy' ? 'Fácil' : h.difficulty === 'Medium' ? 'Médio' : 'Difícil'}
                    </span>
                  </div>

                  {h.notes && (
                    <p className="text-[10px] text-amber-100/55 font-sans mt-0.5 max-w-[95%]">
                      {h.notes}
                    </p>
                  )}

                  {/* Sub-tags and counts */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[9px] text-amber-100/30 font-mono">
                    <span>Série de Hábitos: <strong className="text-amber-400 font-bold">{score > 0 ? `+${score}` : score}</strong></span>
                    <span>• (+{h.upCount} | -{h.downCount})</span>
                    {h.tags.map((tag) => (
                      <span key={tag} className="bg-stone-900 border border-amber-500/5 px-1 py-0.2 rounded-sm text-amber-400/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trigger Down Button & Options */}
                <div className="flex items-center gap-1">
                  {h.down && (
                    <button
                      onClick={() => onTriggerHabit(h.id, false)}
                      className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/35 hover:border-rose-400 text-rose-400 hover:text-white transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 shadow-lg mr-1"
                      title="Registrar desvio negativo"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}

                  {/* Edit/Delete Controls */}
                  <div className="flex flex-row gap-1.5 self-center opacity-75 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(h)}
                      className="p-1.5 text-amber-100/60 hover:text-amber-300 cursor-pointer bg-stone-900/40 rounded border border-amber-500/10 hover:border-amber-500/40 transition-all flex items-center justify-center"
                      title="Editar Hábito"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHabit(h.id)}
                      className="p-1.5 text-amber-100/60 hover:text-rose-400 cursor-pointer bg-stone-900/40 rounded border border-amber-500/10 hover:border-rose-500/40 transition-all flex items-center justify-center"
                      title="Apagar Hábito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
