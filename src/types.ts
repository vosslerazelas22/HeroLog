export type BuffType = 'DoubleLoot' | 'FocusElixir' | 'CrystalClarity' | 'RuneFortune' | 'StreakShield' | 'PixelOwl' | 'DragonQuill' | 'CrystalBall' | 'AncientTome';

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  buff: BuffType;
  price: number;
  desc: string;
  isEquipment?: boolean;
  charges?: number;
  maxCharges?: number;
}

export interface Skill {
  name: string;
  level: number;
  xp: number;
  emoji?: string;
  prestige?: number;
  tags?: string[];
}

export interface HistoryEntry {
  id: string;
  skillName: string;
  date: string;
  duration: number; // in minutes
  xp: number;
  gold: number;
  notes: string;
  wilderness: boolean;
  aiChronicle?: string;
  subskillTag?: string;
}

export interface Quest {
  id: string;
  name: string;
  desc: string;
  progress: number;
  target: number;
  rewardGold: number;
  rewardXp: number;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  notes: string;
  up: boolean;
  down: boolean;
  difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard';
  upCount: number;
  downCount: number;
  streak: number;
  tags: string[];
  lastTriggeredDate?: string;
}

export interface Daily {
  id: string;
  title: string;
  notes: string;
  difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  streak: number;
  repeats: 'Daily' | 'Weekly' | 'Monthly';
  every: number;
  tags: string[];
  checklist: { id: string; text: string; completed: boolean }[];
}

export interface Todo {
  id: string;
  title: string;
  notes: string;
  difficulty: 'Trivial' | 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  tags: string[];
  checklist: { id: string; text: string; completed: boolean }[];
}

export interface CharacterState {
  gold: number;
  totalXP: number;
  totalGoldEarned: number;
  totalSessions: number;
  totalMinutes: number;
  combatLevel: number;
  combatXP: number;
  skills: Skill[];
  history: HistoryEntry[];
  inventory: InventoryItem[];
  streak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  wildernessWins: number;
  combo: number;
  dungeonProgress: number; // index of unlocked floor
  isDungeonMode: boolean;
  dungeonSessions: number;
  achievements: string[]; // achievement ids
  charName: string;
  charClass: 'Mage' | 'Warrior' | 'Ranger';
  todayXP: number;
  todayMinutes: number;
  todayDate: string;
  hasClaimedLogin: boolean;
  hp: number;
  maxHp: number;
  habits: Habit[];
  dailies: Daily[];
  todos: Todo[];
  equippedTitle?: string | null;
  ownedTitles?: string[];
  equippedEquipment?: (InventoryItem | null)[];
  pomodoroSettings: PomodoroSettings;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (state: CharacterState) => boolean;
}

export interface ActiveSession {
  isActive: boolean;
  skillIdx: number;
  duration: number;    // duração total em ms
  endTime: number;     // Date.now() + duration
  startTime: number;
  isDungeon: boolean;
  dungeonStep: number;
  isWilderness?: boolean;
}

export interface CombatLevelUpType {
  type: 'combat';
  oldLevel: number;
  newLevel: number;
  charName: string;
  charClass: string;
}

export interface SkillLevelUpType {
  type: 'skill';
  skillName: string;
  emoji: string;
  oldLevel: number;
  newLevel: number;
}

export type LevelUpModalType = CombatLevelUpType | SkillLevelUpType;


