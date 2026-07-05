import React, { useState, useRef, useEffect } from 'react';
import { CharacterState, LevelUpModalType } from '../../types';

export interface UseLevelUpParams {
  gameState: CharacterState;
  muteSfx: boolean;
  sound: any;
}

export interface UseLevelUpReturn {
  activeLevelUp: LevelUpModalType | null;
  hasPendingLevelUps: boolean;
  dismissCurrentLevelUp: () => void;
  isImportingRef: React.MutableRefObject<boolean>;
  setLevelUpQueue: React.Dispatch<React.SetStateAction<LevelUpModalType[]>>;
}

export function useLevelUp(params: UseLevelUpParams): UseLevelUpReturn {
  const { gameState, muteSfx, sound } = params;

  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpModalType[]>([]);
  const lastKnownCombatLevelRef = useRef<number>(gameState.combatLevel);
  const lastKnownSkillLevelsRef = useRef<Record<string, number>>({});
  const isImportingRef = useRef<boolean>(false);

  // Initialize skills levels ref
  useEffect(() => {
    if (gameState.skills) {
      gameState.skills.forEach(sk => {
        if (lastKnownSkillLevelsRef.current[sk.name] === undefined) {
          lastKnownSkillLevelsRef.current[sk.name] = sk.level;
        }
      });
    }
  }, []);

  // Detect Level Ups
  useEffect(() => {
    const prevCombat = lastKnownCombatLevelRef.current;
    const currentCombat = gameState.combatLevel;

    if (isImportingRef.current) {
      lastKnownCombatLevelRef.current = currentCombat;
      if (gameState.skills) {
        gameState.skills.forEach(sk => {
          lastKnownSkillLevelsRef.current[sk.name] = sk.level;
        });
      }
      isImportingRef.current = false;
      return;
    }

    // Detect Combat Level Up
    if (currentCombat > prevCombat && prevCombat > 0) {
      setLevelUpQueue(prevQueue => [
        ...prevQueue,
        {
          type: 'combat',
          oldLevel: prevCombat,
          newLevel: currentCombat,
          charName: gameState.charName || 'Aventureiro',
          charClass: gameState.charClass || 'Guerreiro'
        }
      ]);
    }
    lastKnownCombatLevelRef.current = currentCombat;

    // Detect Skills Level Up
    if (gameState.skills) {
      gameState.skills.forEach(sk => {
        const prevSkillLvl = lastKnownSkillLevelsRef.current[sk.name];
        if (prevSkillLvl !== undefined && sk.level > prevSkillLvl && prevSkillLvl > 0) {
          setLevelUpQueue(prevQueue => [
            ...prevQueue,
            {
              type: 'skill',
              skillName: sk.name,
              emoji: sk.emoji || '🎯',
              oldLevel: prevSkillLvl,
              newLevel: sk.level
            }
          ]);
        }
        lastKnownSkillLevelsRef.current[sk.name] = sk.level;
      });
    }
  }, [gameState.combatLevel, gameState.skills, gameState.charName, gameState.charClass]);

  // Play sound when active level up changes
  useEffect(() => {
    if (levelUpQueue.length > 0 && !muteSfx) {
      sound.playLevelUp?.();
    }
  }, [levelUpQueue.length, muteSfx, sound]);

  const activeLevelUp = levelUpQueue.length > 0 ? levelUpQueue[0] : null;
  const hasPendingLevelUps = levelUpQueue.length > 1;

  const dismissCurrentLevelUp = () => {
    setLevelUpQueue(prev => prev.slice(1));
  };

  return {
    activeLevelUp,
    hasPendingLevelUps,
    dismissCurrentLevelUp,
    isImportingRef,
    setLevelUpQueue
  };
}
