import React, { useState } from 'react';
import { CharacterState } from '../../types';

export interface UseTimerControlsParams {
  gameState: CharacterState;
  setGameState: React.Dispatch<React.SetStateAction<CharacterState>>;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  isBreakActive: boolean;
}

export function useTimerControls(params: UseTimerControlsParams) {
  const {
    gameState,
    setGameState,
    setTimeLeft,
    isRunning,
    isBreakActive,
  } = params;

  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [customInputMins, setCustomInputMins] = useState<string>('25');

  const changeDuration = (minutes: number) => {
    if (isRunning || isBreakActive) return;
    setGameState(prev => ({
      ...prev,
      pomodoroSettings: {
        ...prev.pomodoroSettings,
        focusDuration: minutes
      }
    }));
    setTimeLeft(minutes * 60);
    setIsCustomTime(false);
  };

  const selectCustomTime = () => {
    if (isRunning || isBreakActive) return;
    setIsCustomTime(true);
  };

  const applyCustomTime = () => {
    if (isRunning || isBreakActive) return;
    const minsVal = parseInt(customInputMins);
    if (!isNaN(minsVal) && minsVal > 0) {
      setGameState(prev => ({
        ...prev,
        pomodoroSettings: {
          ...prev.pomodoroSettings,
          focusDuration: minsVal
        }
      }));
      setTimeLeft(minsVal * 60);
    }
  };

  return {
    isCustomTime,
    setIsCustomTime,
    customInputMins,
    setCustomInputMins,
    changeDuration,
    selectCustomTime,
    applyCustomTime,
  };
}
