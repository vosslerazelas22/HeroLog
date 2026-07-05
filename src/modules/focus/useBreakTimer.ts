import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../../utils/audio';

export interface UseBreakTimerParams {
  enterBreak: (breakMinutes: number) => void;
  exitBreak: () => void;
  cancelSession: () => void;
  onLog?: (msg: string, flash?: boolean) => void;
  muteSfx?: boolean;
  onBreakComplete?: () => void;
}

export function useBreakTimer(params: UseBreakTimerParams) {
  const {
    enterBreak,
    exitBreak,
    cancelSession,
    onLog,
    muteSfx,
    onBreakComplete,
  } = params;

  const [isBreakPrep, setIsBreakPrep] = useState<boolean>(false);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [selectedBreakMins, setSelectedBreakMins] = useState<number>(5);

  const breakTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakEndTimeRef = useRef<number | null>(null);

  // Handle visibility change for background tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isBreakActive && breakEndTimeRef.current !== null) {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((breakEndTimeRef.current - now) / 1000));
        enterBreak(remaining / 60);

        if (remaining <= 0) {
          if (breakTimerIntervalRef.current) clearInterval(breakTimerIntervalRef.current);
          setIsBreakActive(false);
          onLog?.('🍃 O intervalo sagrado foi concluído! Suas forças foram recarregadas para o próximo ciclo de foco.', true);
          if (!muteSfx) sound.playLevelUp();
          onBreakComplete?.();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isBreakActive, enterBreak, onLog, muteSfx]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (breakTimerIntervalRef.current) clearInterval(breakTimerIntervalRef.current);
    };
  }, []);

  const enterBreakPrep = () => {
    setIsBreakPrep(true);
  };

  const startBreakTimer = (minutes: number) => {
    cancelSession();
    setIsBreakPrep(false);
    setIsBreakActive(true);
    setSelectedBreakMins(minutes);

    enterBreak(minutes);

    const endTime = Date.now() + minutes * 60 * 1000;
    breakEndTimeRef.current = endTime;

    if (breakTimerIntervalRef.current) clearInterval(breakTimerIntervalRef.current);
    breakTimerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTime - now) / 1000));

      enterBreak(remaining / 60);

      if (remaining <= 0) {
        clearInterval(breakTimerIntervalRef.current!);
        setIsBreakActive(false);
        onLog?.('🍃 O intervalo sagrado foi concluído! Suas forças foram recarregadas para o próximo ciclo de foco.', true);
        if (!muteSfx) sound.playLevelUp();
        onBreakComplete?.();
      }
    }, 1000);
  };

  const skipBreak = () => {
    if (breakTimerIntervalRef.current) clearInterval(breakTimerIntervalRef.current);
    setIsBreakActive(false);
    setIsBreakPrep(false);
    exitBreak();
    onLog?.('🍃 Intervalo pulado voluntariamente. Que o foco retorne à sua mente.', false);
  };

  return {
    isBreakPrep,
    setIsBreakPrep,
    isBreakActive,
    setIsBreakActive,
    selectedBreakMins,
    setSelectedBreakMins,
    breakEndTimeRef,
    breakTimerIntervalRef,
    enterBreakPrep,
    startBreakTimer,
    skipBreak,
  };
}
