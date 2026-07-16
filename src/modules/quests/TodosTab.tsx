import React, { useState } from 'react';
import { Todo } from '../../types';
import { Plus, Trash2, Edit2, CheckCircle, Circle, ClipboardList, Filter, PlusCircle, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { getScoreColor } from '../../utils/scoreColor';
import { getTodoDecayValue } from '../../utils/todoDecay';
import { Modal } from '../../components/Modal';

interface TodosTabProps {
  todos: Todo[];
  onToggleTodo: (todoId: string) => void;
  onToggleChecklistItem: (todoId: string, itemId: string) => void;
  onAddTodo: (todo: Omit<Todo, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (todoId: string) => void;
  todayDate: string;
}

export const TodosTab: React.FC<TodosTabProps> = ({
  todos,
  onToggleTodo,
  onToggleChecklistItem,
  onAddTodo,
  onEditTodo,
  onDeleteTodo,
  todayDate,
}) => {

  const [isCreating, setIsCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const handleCancelAttempt = () => {
    setIsConfirmingCancel(true);
  };

  // Form states
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<Todo['difficulty']>('Easy');
  const [tagInput, setTagInput] = useState('');
  
  // Checklist creator list
  const [checklistInput, setChecklistInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);

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
    setTagInput('');
    setChecklistItems([]);
    setChecklistInput('');
    setIsCreating(false);
    setEditingTodo(null);
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

    if (editingTodo) {
      onEditTodo({
        ...editingTodo,
        title: title.trim(),
        notes: notes.trim(),
        difficulty,
        tags,
      });
    } else {
      onAddTodo({
        title: title.trim(),
        notes: notes.trim(),
        difficulty,
        tags,
        checklist: checklistItems,
        createdAt: new Date().toISOString(),
      });
    }
    resetForm();
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setNotes(todo.notes);
    setDifficulty(todo.difficulty);
    setTagInput(todo.tags.join(', '));
    setIsCreating(true);
    setIsConfirmingDelete(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedTodoId(expandedTodoId === id ? null : id);
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed;
    return true;
  });

  return (
    <div className="bg-quest-panel border-0 sm:border border-amber-500/15 rounded-none sm:rounded-lg overflow-hidden px-0 py-4 sm:px-5 sm:py-5 shadow-none sm:shadow-[0_12px_40px_rgba(0,0,0,0.7)] space-y-4 font-serif text-amber-100/95 max-w-none sm:max-w-2xl mx-0 sm:mx-auto flex flex-col min-h-[500px] w-full flex-1">
      <div className="flex justify-between items-center border-b border-amber-500/15 pb-2 shrink-0 px-4 sm:px-0">
        <h3 className="text-sm md:text-base text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
          <span>🗒️</span> Missões Avulsas
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

      {/* Filter tabs */}
      <div className="flex gap-2 text-xs border-b border-amber-500/5 pb-2 px-4 sm:px-0">
        <button
          type="button"
          disabled={editingTodo !== null}
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded border transition-all ${
            editingTodo !== null
              ? 'border-transparent text-amber-100/20 cursor-not-allowed opacity-50'
              : filter === 'pending'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 cursor-pointer'
                : 'border-transparent text-amber-100/40 hover:text-amber-200 cursor-pointer'
          }`}
        >
          Pendentes
        </button>
        <button
          type="button"
          disabled={editingTodo !== null}
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 rounded border transition-all ${
            editingTodo !== null
              ? 'border-transparent text-amber-100/20 cursor-not-allowed opacity-50'
              : filter === 'completed'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 cursor-pointer'
                : 'border-transparent text-amber-100/40 hover:text-amber-200 cursor-pointer'
          }`}
        >
          Concluídos
        </button>
        <button
          type="button"
          disabled={editingTodo !== null}
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded border transition-all ${
            editingTodo !== null
              ? 'border-transparent text-amber-100/20 cursor-not-allowed opacity-50'
              : filter === 'all'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 cursor-pointer'
                : 'border-transparent text-amber-100/40 hover:text-amber-200 cursor-pointer'
          }`}
        >
          Todos
        </button>
      </div>

      <Modal
        isOpen={isCreating}
        onClose={handleCancelAttempt}
        title={editingTodo ? 'Editar Tarefa' : 'Nova Tarefa'}
        variant="amber"
      >
        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Título</label>
            <input
              type="text"
              placeholder="Ex: Resolver 3 problemas de Algoritmo, Escrever redação..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-900/90 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Notas</label>
            <textarea
              placeholder="Ex: Utilizar abordagem de árvore binária de busca, revisar testes unitários..."
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
                onChange={(e) => setDifficulty(e.target.value as Todo['difficulty'])}
                className="w-full bg-stone-900 border border-amber-500/20 rounded px-2 py-1.5 text-xs text-amber-200 focus:outline-none cursor-pointer"
              >
                <option value="Trivial">Trivial</option>
                <option value="Easy">Fácil</option>
                <option value="Medium">Médio</option>
                <option value="Hard">Difícil</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Categorias (Tags, separadas por vírgula)</label>
              <input
                type="text"
                placeholder="study, workout, project..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full bg-stone-900 border border-amber-500/20 rounded px-2 py-1.5 text-xs text-amber-100 font-sans focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Checklist Area (Only when creating, simplifies edits) */}
          {!editingTodo && (
            <div className="bg-stone-900/45 p-2 rounded border border-amber-500/5 space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Checklist</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: Resolver estrutura básica, Fazer deploy..."
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

          <div className="flex gap-2 pt-1.5 flex-wrap">
            {editingTodo && (
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
                        onDeleteTodo(editingTodo.id);
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
              {editingTodo ? 'Salvar' : 'Criar'}
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

      {/* Todos List Viewport */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1 px-4 sm:px-0">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-10 bg-stone-950/20 border border-dashed border-amber-500/10 rounded-lg p-5">
            <p className="text-xs text-amber-100/40 italic">Nenhum afazer místico sob este filtro. Adicione novas aventuras e complete-as!</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const hasChecklist = todo.checklist && todo.checklist.length > 0;
            const completedCount = todo.checklist ? todo.checklist.filter(i => i.completed).length : 0;

            const score = getTodoDecayValue(todo, new Date(todayDate));

            return (
              <div
                key={todo.id}
                className={`flex flex-col border rounded-lg relative overflow-hidden transition-all ${
                  todo.completed
                    ? 'border-emerald-500/30 bg-emerald-950/[0.03]'
                    : `bg-gradient-to-r ${getScoreColor(score)} border-amber-500/10 hover:border-amber-500/35`
                }`}
              >
                {/* Main Card row */}
                <div className="flex items-stretch min-h-[56px]">
                  {/* Left Completion Tick - Flush Band */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTodo(todo.id);
                    }}
                    className={`w-12 self-stretch rounded-l-lg border-r transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 ${
                      todo.completed
                        ? 'bg-emerald-500/20 border-emerald-500/25 text-emerald-300'
                        : 'bg-stone-900 border-amber-500/10 text-stone-700 hover:bg-stone-850 hover:border-amber-500/35 hover:text-amber-500/60'
                    }`}
                    title={todo.completed ? 'Marcar incompleta' : 'Concluir aventura'}
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-amber-500/45 hover:bg-amber-500/10" />
                    )}
                  </button>

                  {/* Todo Text details - Content container */}
                  <div
                    onClick={() => startEdit(todo)}
                    className="flex-1 min-w-0 text-left p-3 space-y-1.5 cursor-pointer"
                  >
                    {/* Nome do Todo & Estado (Difficulty badge) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`font-serif font-bold text-sm md:text-[15px] truncate transition-all ${
                        todo.completed ? 'text-stone-500 line-through' : 'text-amber-100'
                      }`}>
                        {todo.title}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded leading-none uppercase ${
                        todo.difficulty === 'Trivial' ? 'bg-amber-500/10 text-amber-400/80 border-amber-500/10' :
                        todo.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/10' :
                        todo.difficulty === 'Medium' ? 'bg-purple-500/10 text-purple-400/80 border-purple-500/10' :
                        'bg-rose-500/10 text-rose-400/85 border-rose-500/10'
                      }`}>
                        {todo.difficulty === 'Trivial' ? 'Trivial' : todo.difficulty === 'Easy' ? 'Fácil' : todo.difficulty === 'Medium' ? 'Médio' : 'Difícil'}
                      </span>
                    </div>

                    {todo.notes && (
                      <p className="text-xs text-amber-100/65 font-sans leading-relaxed mt-0.5">
                        {todo.notes}
                      </p>
                    )}

                    {/* Meta-info & Checklist progress */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[10px] md:text-[11px] font-mono leading-none text-amber-100/40">
                      <span className="text-amber-450/60">
                        🛡️ Tarefa Única
                      </span>
                      {hasChecklist && (
                        <>
                          <span className="text-amber-500/20 select-none">•</span>
                          <span className="text-purple-400 font-bold">
                            📋 {completedCount} de {todo.checklist.length} critérios
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
                        toggleExpand(todo.id);
                      }}
                      className="px-3 self-stretch border-l border-amber-500/10 hover:bg-stone-900/35 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer text-amber-100/30 hover:text-amber-100"
                      title="Ver critérios"
                    >
                      {expandedTodoId === todo.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {/* Checklist Panel */}
                {hasChecklist && expandedTodoId === todo.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-stone-900/40 border-t border-amber-500/5 px-4 py-2 space-y-1.5"
                  >
                    {todo.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-xs font-sans text-amber-200/70 hover:text-amber-200 transition-all py-0.5"
                      >
                        <button
                          onClick={() => onToggleChecklistItem(todo.id, item.id)}
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center cursor-pointer ${
                            item.completed
                              ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                              : 'bg-stone-950 border-stone-700 text-stone-500 hover:border-amber-500/40'
                          }`}
                        >
                          {item.completed && <div className="w-1.5 h-1.5 bg-purple-400 rounded-sm" />}
                        </button>
                        <span className={`text-[11px] ${item.completed ? 'line-through text-stone-500 font-bold' : 'text-amber-100/70'}`}>
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
