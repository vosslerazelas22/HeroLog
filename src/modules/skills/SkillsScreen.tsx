import React, { useState } from 'react';
import { Skill } from '../../types';
import { Pencil, Check, X, Plus } from 'lucide-react';
import { Modal } from '../../components/Modal';

export interface SkillsScreenProps {
  skills: Skill[];
  onAddTagToSkill: (skillIdx: number, newTag: string) => void;
  onRemoveTagFromSkill: (skillIdx: number, tagIdx: number) => void;
  onAddCustomSkill: (name: string, emoji: string) => void;
  onDeleteSkill: (idx: number) => boolean | void;
  onPrestigeSkill: (idx: number) => void;
  onRenameSkill: (idx: number, newName: string) => void;
}

const SKILL_SUGGESTIONS = [
  { name: 'Estudos', emoji: '📚' },
  { name: 'Foco Profundo', emoji: '🧠' },
  { name: 'Pesquisa', emoji: '🔬' },
  { name: 'Escrita', emoji: '✍️' },
  { name: 'Idiomas', emoji: '🗣️' },
  { name: 'Leitura', emoji: '📖' },
  { name: 'Programação', emoji: '💻' },
  { name: 'Exercícios', emoji: '🏋️' },
  { name: 'Meditação', emoji: '🧘' },
  { name: 'Artes & Pintura', emoji: '🎨' },
  { name: 'Culinária', emoji: '🍳' },
  { name: 'Finanças', emoji: '💰' },
  { name: 'Música', emoji: '🎵' },
  { name: 'Organização', emoji: '📅' },
  { name: 'Jogos & Estratégia', emoji: '🎮' },
  { name: 'Trabalho', emoji: '💼' }
];

const SKILL_EMOJIS = ['📚', '💻', '🧠', '✍️', '🗣️', '🏋️', '🎨', '🍳', '🔬', '🧘', '🎵', '💰', '💼', '🧪', '🛡️', '🎯'];

export const SkillsScreen: React.FC<SkillsScreenProps> = ({
  skills,
  onAddTagToSkill,
  onRemoveTagFromSkill,
  onAddCustomSkill,
  onDeleteSkill,
  onPrestigeSkill,
  onRenameSkill,
}) => {
  const [newSkillNameInput, setNewSkillNameInput] = useState<string>('');
  const [selectedNewSkillEmoji, setSelectedNewSkillEmoji] = useState<string>('📚');
  
  // Inline editing state for skill names
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const handleStartRename = (idx: number, currentName: string) => {
    setEditingIdx(idx);
    setEditNameValue(currentName);
  };

  const handleSaveRename = (idx: number) => {
    const trimmed = editNameValue.trim();
    if (trimmed) {
      onRenameSkill(idx, trimmed);
    }
    setEditingIdx(null);
  };

  const handleAddCustom = () => {
    const trimmed = newSkillNameInput.trim();
    if (trimmed) {
      onAddCustomSkill(trimmed, selectedNewSkillEmoji);
      setNewSkillNameInput('');
      setIsCreateModalOpen(false);
    }
  };

  const handleAddSuggestion = (name: string, emoji: string) => {
    onAddCustomSkill(name, emoji);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="px-0 pt-0 pb-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar w-full">
      {/* ACTIVE SKILLS LIST */}
      <div className="space-y-4 w-full px-4 sm:px-0">
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar w-full">
          {skills.map((sk, idx) => {
            const reqXP = sk.level * 80;
            const percent = Math.min((sk.xp / reqXP) * 100, 100);
            const isEditing = editingIdx === idx;

            return (
              <div
                key={idx}
                className="bg-stone-950/40 border border-amber-500/10 p-3 rounded hover:border-amber-500/30 transition-all space-y-2 w-full"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-lg select-none pt-0.5">{sk.emoji || '🎯'}</span>
                    
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(idx);
                              if (e.key === 'Escape') setEditingIdx(null);
                            }}
                            className="bg-stone-950 border border-amber-500/30 rounded px-2 py-0.5 text-xs text-amber-100 focus:outline-none focus:border-amber-400 w-full"
                            maxLength={30}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(idx)}
                            className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded cursor-pointer shrink-0"
                            title="Salvar Nome"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingIdx(null)}
                            className="p-1 hover:bg-red-500/20 text-red-400 rounded cursor-pointer shrink-0"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-amber-200 font-serif text-sm leading-tight break-words">{sk.name}</strong>
                            {sk.prestige && sk.prestige > 0 ? (
                              <span className="text-yellow-400 text-[10px] font-bold shrink-0" title={`Prestígio Nível ${sk.prestige}`}>
                                👑{'★'.repeat(sk.prestige)}
                              </span>
                            ) : null}
                            <button
                              onClick={() => handleStartRename(idx, sk.name)}
                              className="p-1 text-amber-100/30 hover:text-amber-300 rounded cursor-pointer shrink-0 transition-all"
                              title="Renomear Habilidade"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded">
                              Nível {sk.level}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 pt-0.5">
                    <button
                      onClick={() => onDeleteSkill(idx)}
                      className="text-[9px] uppercase tracking-wider text-red-400/70 hover:text-red-400 font-bold font-serif px-1.5 py-1 bg-red-500/[0.04] border border-red-500/10 hover:border-red-500/30 rounded cursor-pointer transition-all"
                      title="Esquecer Habilidade"
                    >
                      Esquecer
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-stone-950 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-amber-100/30 font-mono">
                    <span>Progresso: {sk.xp} / {reqXP} XP</span>
                    {sk.prestige ? <span className="text-yellow-500 font-semibold font-sans">Bônus: +{sk.prestige * 25}% XP</span> : null}
                  </div>
                </div>

                {/* Subskills / Tags inline manager under progress bar */}
                <div className="pt-1.5 border-t border-amber-500/5 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] uppercase font-serif tracking-wider text-amber-100/40">
                    <span>Subskills (Tags de Foco):</span>
                  </div>
                  {(!sk.tags || sk.tags.length === 0) ? (
                    <div className="text-[9px] text-amber-100/25 italic">Nenhuma subskill cadastrada para esta habilidade.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {sk.tags.map((tg, tIdx) => (
                        <span key={tIdx} className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[9px] rounded flex items-center gap-1 font-sans">
                          {tg}
                          <button
                            type="button"
                            onClick={() => onRemoveTagFromSkill(idx, tIdx)}
                            className="text-amber-100/40 hover:text-red-400 font-extrabold ml-0.5 cursor-pointer text-[9px]"
                            title={`Remover subskill ${tg}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Criar subskill (ex: Direito Processual, React, CSS...)"
                      id={`new-subskill-tag-input-${idx}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) {
                            onAddTagToSkill(idx, val);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1 bg-stone-950/50 border border-amber-500/10 rounded px-2 py-0.5 text-[10px] text-amber-100 placeholder-amber-100/15 focus:outline-none focus:border-amber-400 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`new-subskill-tag-input-${idx}`) as HTMLInputElement;
                        if (input && input.value.trim()) {
                          onAddTagToSkill(idx, input.value.trim());
                          input.value = '';
                        }
                      }}
                      className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-550 border border-amber-500/20 text-amber-300 hover:text-amber-100 text-[10px] font-bold rounded cursor-pointer transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {sk.level >= 99 && (
                  <button
                    type="button"
                    onClick={() => onPrestigeSkill(idx)}
                    className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-stone-950 text-[10px] font-black uppercase tracking-widest py-1.5 rounded font-serif shadow animate-pulse cursor-pointer text-center"
                  >
                    👑 Alcançar Prestígio (Resetar a Nível 1 & Ganhar +25% XP Definitivo)
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Skill Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full py-3 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border border-dashed border-amber-500/30 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-serif uppercase tracking-widest rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Habilidade
        </button>
      </div>


      {/* Create New Skill Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Nova Habilidade"
        variant="amber"
      >
        <div className="space-y-5 max-h-[70vh] pr-1">
          {/* Pick Emoji */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
              Selecione um Ícone/Emoji para a Habilidade:
            </label>
            <div className="grid grid-cols-8 gap-1 bg-stone-950/30 p-2 rounded border border-amber-500/10 justify-items-center">
              {SKILL_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedNewSkillEmoji(em)}
                  className={`w-7 h-7 text-sm flex items-center justify-center rounded transition-all cursor-pointer hover:bg-amber-500/15 ${
                    selectedNewSkillEmoji === em
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-stone-900/45 border border-transparent text-stone-400'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
              Nome da Habilidade de Foco:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillNameInput}
                onChange={(e) => setNewSkillNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustom();
                }}
                placeholder="Ex: Alquimia de Dados, Exercícios Físicos..."
                className="flex-1 bg-stone-950/80 border border-amber-500/20 rounded px-3 py-2 text-xs text-amber-100 placeholder-amber-100/15 focus:outline-none focus:border-amber-400"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-4 py-2 bg-amber-500/15 border border-amber-400 text-amber-300 text-xs font-serif uppercase tracking-widest hover:bg-amber-400 hover:text-stone-950 rounded transition-all cursor-pointer shrink-0"
              >
                Gravar
              </button>
            </div>
          </div>

          {/* Quick recommendations */}
          <div className="border-t border-amber-500/10 pt-4 space-y-2.5">
            <label className="text-[10px] uppercase font-serif tracking-widest text-amber-100/40 block">
              Sugestões Rápidas:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {SKILL_SUGGESTIONS.map((sug, sIdx) => {
                const alreadyHas = skills.some(s => s.name.toLowerCase() === sug.name.toLowerCase());
                return (
                  <button
                    key={sIdx}
                    disabled={alreadyHas}
                    type="button"
                    onClick={() => handleAddSuggestion(sug.name, sug.emoji)}
                    className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1.5 border text-[10px] sm:text-xs font-serif transition-all rounded leading-tight text-left min-w-0 ${
                      alreadyHas
                        ? 'bg-stone-900/25 border-stone-800/40 text-amber-100/25 cursor-not-allowed select-none'
                        : 'bg-stone-950/50 border-amber-500/5 text-amber-200 hover:bg-amber-500/10 hover:border-amber-400 cursor-pointer'
                    }`}
                  >
                    <span className="text-sm shrink-0">{sug.emoji}</span>
                    <span className="break-words flex-1 min-w-0">{sug.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
