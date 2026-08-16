import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  ShieldUser,
  BookOpen,
  Compass,
  Castle,
  Check,
  UserCircle,
  Backpack,
  Repeat,
  Calendar,
  ClipboardList,
  ScrollText,
  History,
  Coins,
  Medal,
  Grid3x3,
  ChartColumn,
  Trophy,
  FileText,
  HelpCircle,
  LucideIcon,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BottomNavProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
}

interface SubTabOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const SUB_TABS: Record<string, SubTabOption[]> = {
  character: [
    { value: 'character', label: 'Status', icon: UserCircle, color: 'text-sky-400' },
    { value: 'inventory', label: 'Inventário', icon: Backpack, color: 'text-rose-400' },
  ],
  missions: [
    { value: 'habits', label: 'Capela de Hábitos', icon: Repeat, color: 'text-emerald-400' },
    { value: 'dailies', label: 'Tarefas Diárias', icon: Calendar, color: 'text-blue-400' },
    { value: 'todos', label: 'Missões Avulsas', icon: ClipboardList, color: 'text-slate-300' },
    { value: 'quests', label: 'CONTRATOS', icon: ScrollText, color: 'text-amber-300' },
    { value: 'history', label: 'Crônicas Diárias', icon: History, color: 'text-orange-400' },
  ],
  kingdom: [
    { value: 'shop', label: 'Bazar de Mystara', icon: Coins, color: 'text-yellow-400' },
    { value: 'titles', label: 'TÍTULOS', icon: Medal, color: 'text-violet-400' },
    { value: 'heatmap', label: 'Heatmap', icon: Grid3x3, color: 'text-blue-400' },
    { value: 'stats', label: 'ESTATÍSTICAS DO HERÓI', icon: ChartColumn, color: 'text-cyan-400' },
    { value: 'achievements', label: 'CONQUISTAS', icon: Trophy, color: 'text-yellow-500' },
    { value: 'logs', label: 'REGISTROS', icon: FileText, color: 'text-stone-300' },
    { value: 'guide', label: 'Tutorial', icon: HelpCircle, color: 'text-red-400' },
  ],
};

const MODULE_TITLES: Record<string, string> = {
  character: 'Herói',
  missions: 'Missões',
  kingdom: 'Reino',
};

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

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
      label: 'Herói',
      icon: ShieldUser,
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
      icon: Castle,
      targetTab: 'shop',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideNav = navRef.current?.contains(target);
      const clickedInsideSheet = sheetRef.current?.contains(target);
      if (!clickedInsideNav && !clickedInsideSheet) {
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

  return (
    <>
      <nav
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 bg-stone-950 border-t-2 border-amber-500/20 px-3 py-1.5 grid grid-cols-5 items-center z-40 lg:hidden backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeModule === item.id;
          const hasSubTabs = ['character', 'missions', 'kingdom'].includes(item.id);

          return (
            <div key={item.id} className="relative flex flex-col items-center w-full">
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 rounded bg-amber-500/[0.05] border border-amber-500/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
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
                className={`relative z-10 flex flex-col items-center justify-center gap-0.5 py-1 w-full px-1 rounded transition-all cursor-pointer ${
                  isActive
                    ? 'text-amber-400 font-bold scale-105 border border-transparent'
                    : 'text-amber-100/40 hover:text-amber-100/75 border border-transparent'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-amber-100/40'}`} />
                {isActive && (
                  <span className="text-[10px] font-serif uppercase tracking-wider">{item.label}</span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      <AnimatePresence>
        {openDropdown && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setOpenDropdown(null)}
            />
            <motion.div
              ref={sheetRef}
              key="sheet-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-[60] bg-stone-950 border-t-2 border-amber-500/30 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.8)] p-2.5 pb-4 max-h-[60vh] overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-500/10">
                <h3 className="font-serif font-black text-xs text-amber-400 tracking-wider uppercase">
                  {MODULE_TITLES[openDropdown]}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  className="text-amber-100/50 hover:text-amber-200 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {(SUB_TABS[openDropdown] || []).map((sub) => (
                  <button
                    key={sub.value}
                    type="button"
                    onClick={() => {
                      onChangeTab(sub.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-serif uppercase tracking-wider text-left transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                      activeTab === sub.value
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 font-bold shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-stone-900/60 text-amber-100/60 border-transparent hover:border-amber-500/20 hover:text-amber-100/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <sub.icon className={`w-3.5 h-3.5 shrink-0 ${sub.color}`} />
                      <span className="truncate">{sub.label}</span>
                    </div>
                    {activeTab === sub.value && (
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
