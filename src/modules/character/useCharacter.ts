import React from 'react';
import { CharacterState } from '../../types';

export interface UseCharacterParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  addSystemLog?: (msg: string, flash?: boolean) => void;
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export interface UseCharacterReturn {
  applyCharacterSetupChanges: (name: string, characterClass: 'Mage' | 'Warrior' | 'Ranger') => void;
}

export function useCharacter(params: UseCharacterParams): UseCharacterReturn {
  const { setGameState, addSystemLog, setIsSettingsOpen } = params;

  const applyCharacterSetupChanges = (name: string, characterClass: 'Mage' | 'Warrior' | 'Ranger') => {
    const longBreakInput = document.getElementById('long-break-fld') as HTMLInputElement;
    let longBreakMins = longBreakInput ? parseInt(longBreakInput.value, 10) : 15;
    if (isNaN(longBreakMins) || longBreakMins < 1) longBreakMins = 15;
    if (longBreakMins > 120) longBreakMins = 120;

    setGameState(prev => ({
      ...prev,
      charName: name.trim().length > 0 ? name.trim() : prev.charName,
      charClass: characterClass,
      pomodoroSettings: {
        ...prev.pomodoroSettings,
        longBreakDuration: longBreakMins
      }
    }));

    addSystemLog?.(`⚙️ Assinatura do herói guardada nas runas templárias: [${name}] como [${characterClass}] | Descanso Longo: ${longBreakMins} min!`, true);
    setIsSettingsOpen?.(false);
  };

  return {
    applyCharacterSetupChanges,
  };
}
