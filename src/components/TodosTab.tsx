import React, { useState } from 'react';
import { Todo } from '../types';
import { Plus, Trash2, Edit2, CheckCircle, Circle, ClipboardList, Filter, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TodosTabProps {
  todos: Todo[];
  onToggleTodo: (todoId: string) => void;
  onToggleChecklistItem: (todoId: string, itemId: string) => void;
  onAddTodo: (todo: Omit<Todo, 'id' | 'completed' | 'checklist'> & { checklist: string[] }) => void;
  onEditTodo: (todo: Todo) => void;
  onDeleteTodo: (todoId: string) => void;
}

export const TodosTab: React.FC<TodosTabProps> = ({
  todos,
  onToggleTodo,
  onToggleChecklistItem,
  onAddTodo,
  onEditTodo,
  onDeleteTodo,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

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
    <div className="p-4 space-y-4 font-serif text-amber-100/95 max-w-2xl mx-auto">
      <div className="flex justify-between items-center border-b border-amber-500/15 pb-2">
        <h3 className="text-sm md:text-base text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
          <span>✔️</span> TO DO LIST
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs font-bold text-amber-400 hover:text-amber-200 border border-amber-500/30 px-3 py-1 rounded bg-amber-500/5 cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Novo Afazer
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 text-xs border-b border-amber-500/5 pb-2">
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

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-stone-950/80 border border-amber-500/20 p-4 rounded-lg space-y-3 shadow-xl">
          <h4 className="text-xs text-amber-300 uppercase font-bold tracking-wider border-b border-amber-500/10 pb-1 flex flex-wrap items-center justify-between gap-2">
            <span>{editingTodo ? '🧙 Alterar Contrato de Trabalho' : '✨ Selar Novo Afazer'}</span>
            <button type="button" onClick={resetForm} className="text-[10px] text-amber-100/40 hover:text-amber-200 uppercase">Cancelar</button>
          </h4>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-amber-400">Título do Contrato</label>
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
            <label className="text-[10px] uppercase font-bold text-amber-400">Detalhamento e Manuscritos</label>
            <textarea
              placeholder="Ex: Utilizar abordagem de árvore binária de busca, revisar testes unitários..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-900/90 border border-amber-500/20 rounded px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 font-sans h-14 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-amber-400">Provação do Contrato</label>
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
              <label className="text-[10px] uppercase font-bold text-amber-400">Etiquetas / Tags</label>
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
              <label className="text-[10px] uppercase font-bold text-amber-400">Critérios de Aceitação (Checklist)</label>
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

          <div className="flex gap-2 pt-1.5">
            <button
              type="submit"
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-400/40 py-2 rounded text-xs uppercase font-bold cursor-pointer transition-all"
            >
              {editingTodo ? 'Salvar' : 'Criar Contrato'}
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

      {/* Todos List Viewport */}
      <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-10 bg-stone-950/20 border border-dashed border-amber-500/10 rounded-lg p-5">
            <p className="text-xs text-amber-100/40 italic">Nenhum afazer místico sob este filtro. Adicione novas aventuras e complete-as!</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const hasChecklist = todo.checklist && todo.checklist.length > 0;
            const completedCount = todo.checklist ? todo.checklist.filter(i => i.completed).length : 0;

            return (
              <div
                key={todo.id}
                className={`flex flex-col bg-stone-950/50 border rounded-lg overflow-hidden transition-all ${
                  todo.completed
                    ? 'border-emerald-500/30 bg-emerald-950/[0.03]'
                    : 'border-amber-500/10 hover:border-amber-500/25'
                }`}
              >
                {/* Main Card row */}
                <div className="flex items-center gap-3 p-2.5 md:p-3">
                  {/* Left Completion Tick */}
                  <button
                    onClick={() => onToggleTodo(todo.id)}
                    className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 shadow-lg ${
                      todo.completed
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-stone-900 border-amber-500/20 text-stone-700 hover:border-amber-500/40'
                    }`}
                    title={todo.completed ? 'Marcar incompleta' : 'Concluir aventura'}
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-amber-500/45 hover:bg-amber-500/10" />
                    )}
                  </button>

                  {/* Todo Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h4 className={`font-serif font-bold text-xs md:text-sm truncate transition-all ${
                        todo.completed ? 'text-stone-500 line-through' : 'text-amber-100'
                      }`}>
                        {todo.title}
                      </h4>
                      <span className={`text-[8px] font-bold px-1.5 py-0.1 border rounded uppercase ${
                        todo.difficulty === 'Trivial' ? 'bg-amber-500/10 text-amber-400/80 border-amber-500/10' :
                        todo.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/10' :
                        todo.difficulty === 'Medium' ? 'bg-purple-500/10 text-purple-400/80 border-purple-500/10' :
                        'bg-rose-500/10 text-rose-400/85 border-rose-500/10'
                      }`}>
                        {todo.difficulty === 'Trivial' ? 'Trivial' : todo.difficulty === 'Easy' ? 'Fácil' : todo.difficulty === 'Medium' ? 'Médio' : 'Difícil'}
                      </span>
                    </div>

                    {todo.notes && (
                      <p className="text-[10px] text-amber-100/50 font-sans mt-0.5 line-clamp-1">
                        {todo.notes}
                      </p>
                    )}

                    {/* Sub-strip Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[9px] text-amber-100/25 font-mono">
                      <span>• To-do de foco</span>
                      {hasChecklist && (
                        <span className="text-purple-400">
                          Checklist: [{completedCount}/{todo.checklist.length}]
                        </span>
                      )}
                      {todo.tags.map((tag) => (
                        <span key={tag} className="bg-stone-900 border border-amber-500/5 px-1 rounded-sm text-amber-400/40">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Settings / Edit Controls */}
                  <div className="flex items-center gap-1.5">
                    {hasChecklist && (
                      <button
                        onClick={() => toggleExpand(todo.id)}
                        className="p-1 text-amber-100/30 hover:text-amber-100 cursor-pointer"
                        title="Ver critérios"
                      >
                        {expandedTodoId === todo.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <div className="flex gap-0.5 opacity-40 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(todo)}
                        className="p-1 text-amber-100/40 hover:text-amber-300 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1 text-amber-100/40 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checklist Panel */}
                {hasChecklist && expandedTodoId === todo.id && (
                  <div className="bg-stone-900/40 border-t border-amber-500/5 px-4 py-2 space-y-1.5">
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
