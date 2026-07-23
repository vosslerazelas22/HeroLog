import { BuffType } from '../../types';

export interface SessionConfig {
  selectedSkillIdx: number;
  isWildernessChecked: boolean;
  isDungeonMode: boolean;
  dungeonSessions: number;
  sessionNotes?: string;
  isFocusMode: boolean;
}

export interface RewardsModalData {
  visible: boolean;
  skillName: string;
  skillIdx: number;
  xpEarned: number;
  goldEarned: number;
  notes: string;
  durationMins: number;
  lootName?: string;
  lootEmoji?: string;
  droppedTitleName?: string;
  droppedTitleEmoji?: string;
  aiChronicleLoading: boolean;
  aiChronicleResult?: string;
  dungeonClearGoldBonus: number;
  hasUsedDoubleLoot: boolean;
  hasUsedFocusElixir: boolean;
  hasUsedRuneFortune: boolean;
  hasUsedCrystalClarity: boolean;
  usedEquipmentIndicesAndCharges: { index: number; charges: number }[];
  lootedItem?: { name: string; emoji: string };
  lootedItems?: Array<{ name: string; emoji: string; desc: string; buff: BuffType; price: number; isEquipment: boolean; charges: number; maxCharges: number; rarity: 'comum' | 'especial' }>;
  droppedTitle?: { id: string; name: string; emoji: string };
  isWildernessChecked: boolean;
  isDungeonMode: boolean;
  pauseCount: number;
  comboBonusPercent: number;
}

