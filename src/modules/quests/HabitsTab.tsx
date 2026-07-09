import React, { useState } from 'react';
import { Habit } from '../../types';
import { Plus, Minus, Trash2, Edit2, RotateCcw, AlertTriangle, Sparkles, Filter, PlusCircle, MoreVertical } from 'lucide-react';
import { getScoreColor } from '../../utils/scoreColor';
import { Modal } from '../../components/Modal';

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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const handleCancelAttempt = () => {
    setIsConfirmingCancel(true);
  };

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
    setIsConfirmingDelete(false);
  };

  // Get color for habit score (upCount - downCount)
  const getHabitScoreColor = (habit: Habit) => {
    return getScoreColor(habit.upCount - habit.downCount);
  };

  return (
    <div className="bg-quest-panel border border-amber-500/15 rounded-lg overflow-hidden px-0 py-4 sm:px-5 sm:py-5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-4 font-serif text-amber-100/95 max-w-2xl mx-auto flex flex-col min-h-[500px] w-full">
      <div className="flex justify-between items-center border-b border-amber-500/15 pb-2 shrink-0 px-4 sm:px-0">
        <h3 className="text-sm md:text-base text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
          <span>⚡</span> Capela de Hábitos
        </h3>
        <div className="flex items-center gap-2">
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-200 border border-amber-500/30 px-3 py-1 rounded bg-amber-500/5 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Novo
            </button>
          )}
        </div>
      </div>



      <Modal
        isOpen={isCreating}
        onClose={handleCancelAttempt}
        title={editingHabit ? 'Editar Tarefa' : 'Nova Tarefa'}
        variant="amber"
      >
        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Título</label>
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
            <label className="text-[10px] uppercase font-bold text-amber-400">Notas</label>
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
              <label className="text-[10px] uppercase font-bold text-amber-400">Dificuldade</label>
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
            <label className="text-[10px] uppercase font-bold text-amber-400">Categorias (Tags, separadas por vírgula)</label>
            <input
              type="text"
              placeholder="study, workout, health..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-stone-900 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          <div className="flex gap-2 pt-1.5 flex-wrap">
            {editingHabit && (
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
                        onDeleteHabit(editingHabit.id);
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
              {editingHabit ? 'Salvar' : 'Criar'}
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

      {/* Habits List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1 px-4 sm:px-0">
        {habits.length === 0 ? (
          <div className="text-center py-10 bg-stone-950/20 border border-dashed border-amber-500/10 rounded-lg p-5">
            <p className="text-xs text-amber-100/40 italic">A heráldica de seus hábitos está em branco. Comece definindo comportamentos diários positivos ou rituais de quebra de vícios!</p>
          </div>
        ) : (
          habits.map((h) => {
            const isRecordedToday = h.lastTriggeredDate === new Date().toDateString();
            return (
              <div
                key={h.id}
                className={`flex items-stretch bg-gradient-to-r ${getHabitScoreColor(h)} border rounded-lg transition-all relative overflow-hidden group hover:border-amber-500/35`}
              >
                {/* Trigger Up Button / Left Flush Band */}
                {h.up ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerHabit(h.id, true);
                    }}
                    className="w-12 self-stretch bg-emerald-500/10 border-r border-amber-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-200 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 shadow-inner"
                    title="Registrar ação positiva"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                ) : (
                  <div className="w-2 self-stretch bg-stone-900 border-r border-amber-500/10 flex-shrink-0" />
                )}

                {/* Habit Body - Middle Content */}
                <div
                  onClick={() => startEdit(h)}
                  className="flex-1 min-w-0 p-3 md:p-4 space-y-1.5 text-left cursor-pointer"
                >
                  {/* Nome do hábito & Estado do hábito */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif font-bold text-sm md:text-[15px] text-amber-100 tracking-wide leading-tight">
                      {h.title}
                    </h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none uppercase select-none ${
                      h.difficulty === 'Trivial' ? 'bg-amber-500/10 text-amber-400/80 border border-amber-500/10' :
                      h.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10' :
                      h.difficulty === 'Medium' ? 'bg-purple-500/10 text-purple-400/80 border border-purple-500/10' :
                      'bg-rose-500/10 text-rose-400/85 border border-rose-500/10'
                    }`}>
                      {h.difficulty === 'Trivial' ? 'Trivial' : h.difficulty === 'Easy' ? 'Fácil' : h.difficulty === 'Medium' ? 'Médio' : 'Difícil'}
                    </span>
                  </div>

                  {h.notes && (
                    <p className="text-xs text-amber-100/65 font-sans leading-relaxed mt-0.5 max-w-[95%]">
                      {h.notes}
                    </p>
                  )}

                  {/* Sequência atual, Registrado hoje, Estatísticas */}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[10px] md:text-[11px] font-mono leading-none">
                    {/* Registrado hoje */}
                    {isRecordedToday ? (
                      <span className="text-amber-400 font-medium">
                        ✓ Feito hoje
                      </span>
                    ) : (
                      <span className="text-stone-500">
                        ○ Pendente hoje
                      </span>
                    )}

                    <span className="text-amber-500/20 select-none">•</span>

                    {/* Estatísticas detalhadas */}
                    <span className="text-amber-100/40">
                      (+{h.upCount} | -{h.downCount})
                    </span>
                  </div>


                </div>

                {/* Trigger Down Button / Right Flush Band */}
                {h.down ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerHabit(h.id, false);
                    }}
                    className="w-12 self-stretch bg-rose-500/10 border-l border-amber-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-white transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 shadow-inner"
                    title="Registrar desvio negativo"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                ) : (
                  <div className="w-2 self-stretch bg-stone-900 border-l border-amber-500/10 flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
