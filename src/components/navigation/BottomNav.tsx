import React, { useState, useEffect, useRef } from 'react';
import { Timer, User, BookOpen, Compass, Map, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

interface SubTabOption {
  value: string;
  label: string;
  emoji: string;
}

const SUB_TABS: Record<string, SubTabOption[]> = {
  character: [
    { value: 'character', label: 'Status', emoji: '👤' },
    { value: 'inventory', label: 'Inventário', emoji: '🎒' },
  ],
  missions: [
    { value: 'habits', label: 'Capela de Hábitos', emoji: '⚡' },
    { value: 'dailies', label: 'Tarefas Diárias', emoji: '📅' },
    { value: 'todos', label: 'To Do List', emoji: '✅' },
    { value: 'quests', label: 'Contratos da Gilda', emoji: '📜' },
    { value: 'history', label: 'Crônicas Diárias', emoji: '📖' },
  ],
  kingdom: [
    { value: 'shop', label: 'Bazar de Mystara', emoji: '🪙' },
    { value: 'titles', label: 'Títulos de Foco', emoji: '🎖️' },
    { value: 'heatmap', label: 'Heatmap', emoji: '📅' },
    { value: 'stats', label: 'Ficha Corporal', emoji: '🛡️' },
    { value: 'achievements', label: 'Feitos de Alma', emoji: '🏆' },
    { value: 'logs', label: 'Logs', emoji: '📜' },
    { value: 'guide', label: 'Tutorial', emoji: '❓' },
  ],
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const getActiveModule = (tab: string): 'focus' | 'character' | 'skills' | 'missions' | 'kingdom' => {
    if (tab === 'focus') return 'focus';
    if (tab === 'character' || tab === 'inventory') return 'character';
    if (tab === 'skills') return 'skills';
    if (['habits', 'dailies', 'todos', 'quests', 'history'].includes(tab)) return 'missions';
    return 'kingdom';
  };

  const activeModule = getActiveModule(activeTab);

  const navItems = [
    {
      id: 'focus' as const,
      label: 'Foco',
      icon: Timer,
      targetTab: 'focus',
    },
    {
      id: 'character' as const,
      label: 'Personagem',
      icon: User,
      targetTab: 'character',
    },
    {
      id: 'skills' as const,
      label: 'Skills',
      icon: BookOpen,
      targetTab: 'skills',
    },
    {
      id: 'missions' as const,
      label: 'Missões',
      icon: Compass,
      targetTab: 'habits',
    },
    {
      id: 'kingdom' as const,
      label: 'Reino',
      icon: Map,
      targetTab: 'shop',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const getDropdownAlignClass = (itemId: string) => {
    if (itemId === 'kingdom') return 'right-0 translate-x-0';
    if (itemId === 'character') return 'left-0 translate-x-0';
    return 'left-1/2 -translate-x-1/2';
  };

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 bg-stone-950 border-t-2 border-amber-500/20 px-3 py-1.5 flex justify-around items-center z-40 lg:hidden backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeModule === item.id;
        const hasSubTabs = ['character', 'missions', 'kingdom'].includes(item.id);
        const subs = SUB_TABS[item.id] || [];

        return (
          <div key={item.id} className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (hasSubTabs) {
                  setOpenDropdown((prev) => (prev === item.id ? null : item.id));
                } else {
                  setOpenDropdown(null);
                  onChangeTab(item.targetTab);
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3.5 rounded transition-all cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold scale-105 bg-amber-500/[0.05] border border-amber-500/10'
                  : 'text-amber-100/40 hover:text-amber-100/75 border border-transparent'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-amber-100/40'}`} />
              <span className="text-[10px] font-serif uppercase tracking-wider">{item.label}</span>
            </button>

            <AnimatePresence>
              {openDropdown === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`absolute bottom-full mb-3 bg-stone-950 border-2 border-amber-500/30 rounded-lg p-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] min-w-[170px] z-50 flex flex-col gap-1 ${getDropdownAlignClass(
                    item.id
                  )}`}
                >
                  {subs.map((sub) => (
                    <button
                      key={sub.value}
                      type="button"
                      onClick={() => {
                        onChangeTab(sub.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full py-2 px-3 rounded text-[11px] font-serif uppercase tracking-wider text-left transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                        activeTab === sub.value
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                          : 'bg-stone-900/60 text-amber-100/60 border-transparent hover:border-amber-500/20 hover:text-amber-100/90'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[12px] select-none shrink-0">{sub.emoji}</span>
                        <span className="truncate">{sub.label}</span>
                      </div>
                      {activeTab === sub.value && (
                        <Check className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
};
