import React, { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ModeType = 'work' | 'dungeon' | 'wilderness' | 'break' | 'urgent' | 'paused';
export type OrbConceptType = 'A' | 'B' | 'C' | 'D';

interface CommonOrbProps {
  progress: number; // 0 to 1
  timeLeftSeconds: number;
  totalSeconds: number;
  mode: ModeType;
  isRunning: boolean;
  size?: 'compact' | 'standard' | 'fullscreen';
  className?: string;
}

export interface FocusOrbProps {
  timeLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isBreakActive?: boolean;
  isDungeonMode?: boolean;
  isWildernessMode?: boolean;
  size?: 'compact' | 'standard' | 'fullscreen';
  className?: string;
  orbConcept?: OrbConceptType;
}

// ---------------------------------------------------------------------------
// Sizing (necessário pra produção — mockup original era tamanho fixo w-64 h-64)
// ---------------------------------------------------------------------------
const SIZE_CLASSES = {
  compact: 'w-[172px] h-[172px]',
  standard: 'w-64 h-64',
  fullscreen: 'w-[253px] h-[253px] sm:w-[345px] sm:h-[345px] lg:w-[437px] lg:h-[437px]',
};

const TEXT_SIZES = {
  compact: 'text-xl',
  standard: 'text-3xl',
  fullscreen: 'text-4xl sm:text-5xl lg:text-6xl',
};

// ---------------------------------------------------------------------------
// HELPER: Format Time
// ---------------------------------------------------------------------------
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Helper: Sine wave path generator
// ---------------------------------------------------------------------------
const generateWave = (baseY: number, phase: number, amplitude: number, width = 120, startX = -10, pointsCount = 12) => {
  const points = [];
  for (let i = 0; i <= pointsCount; i++) {
    const x = startX + (i * width) / pointsCount;
    const angle = (x / width) * Math.PI * 2 * 1.2 + phase;
    const y = baseY + Math.sin(angle) * amplitude;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M -10,110 L ${points.join(' L ')} L 110,110 Z`;
};

// ===========================================================================
// CONCEPT A: "The Chrono-Relic" (Astrolábio de Obsidiana & Ouro Suíço)
// ===========================================================================
export function OrbConceptA({ progress, timeLeftSeconds, mode, isRunning, size = 'standard', className = '' }: CommonOrbProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isRunning || mode === 'paused') return;
    const interval = setInterval(() => {
      setPhase((p) => (p + 0.06) % (Math.PI * 2));
    }, 33);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const baseY = 100 - progress * 100;
  const amplitude = isRunning && mode !== 'paused' && progress > 0.02 && progress < 0.98 ? 3.5 * Math.sin(progress * Math.PI) : 0;
  const frontPath = generateWave(baseY, phase, amplitude);
  const backPath = generateWave(baseY, -phase * 0.8 + Math.PI, amplitude * 0.7);

  const colorMap = {
    work: {
      accent: '#e5c158',
      ringGrad: ['#d4af37', '#e5c158', '#fef08a'],
      frontGrad: ['#fef08a', '#e5c158', '#855d14'],
      backGrad: ['#a1781b', '#3b2505'],
      glow: 'rgba(229, 193, 88, 0.25)',
      tickColor: '#e5c158',
    },
    dungeon: {
      accent: '#c084fc',
      ringGrad: ['#9333ea', '#c084fc', '#e9d5ff'],
      frontGrad: ['#e9d5ff', '#a855f7', '#581c87'],
      backGrad: ['#6b21a8', '#2e1065'],
      glow: 'rgba(192, 132, 252, 0.25)',
      tickColor: '#c084fc',
    },
    wilderness: {
      accent: '#fb7185',
      ringGrad: ['#e11d48', '#fb7185', '#ffe4e6'],
      frontGrad: ['#ffe4e6', '#f43f5e', '#881337'],
      backGrad: ['#be123c', '#4c0519'],
      glow: 'rgba(251, 113, 133, 0.25)',
      tickColor: '#fb7185',
    },
    break: {
      accent: '#10b981',
      ringGrad: ['#059669', '#10b981', '#a7f3d0'],
      frontGrad: ['#a7f3d0', '#10b981', '#064e3b'],
      backGrad: ['#047857', '#022c22'],
      glow: 'rgba(16, 185, 129, 0.25)',
      tickColor: '#10b981',
    },
    urgent: {
      accent: '#f43f5e',
      ringGrad: ['#dc2626', '#f43f5e', '#fecdd3'],
      frontGrad: ['#fecdd3', '#ef4444', '#7f1d1d'],
      backGrad: ['#b91c1c', '#450a0a'],
      glow: 'rgba(244, 63, 94, 0.4)',
      tickColor: '#f43f5e',
    },
    paused: {
      accent: '#a1a1aa',
      ringGrad: ['#71717a', '#a1a1aa', '#d4d4d8'],
      frontGrad: ['#d4d4d8', '#71717a', '#27272a'],
      backGrad: ['#52525b', '#18181b'],
      glow: 'rgba(161, 161, 170, 0.1)',
      tickColor: '#71717a',
    },
  }[mode];

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`relative ${SIZE_CLASSES[size]} flex items-center justify-center select-none ${className}`}>
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
        style={{ background: colorMap.glow }}
      />

      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.8)]">
        <defs>
          <clipPath id="concept-a-clip">
            <circle cx="50" cy="50" r="39.5" />
          </clipPath>

          <linearGradient id="concept-a-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorMap.frontGrad[0]} stopOpacity="0.9" />
            <stop offset="40%" stopColor={colorMap.frontGrad[1]} stopOpacity="0.92" />
            <stop offset="100%" stopColor={colorMap.frontGrad[2]} stopOpacity="0.98" />
          </linearGradient>

          <linearGradient id="concept-a-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorMap.backGrad[0]} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colorMap.backGrad[1]} stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id="concept-a-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorMap.ringGrad[0]} />
            <stop offset="50%" stopColor={colorMap.ringGrad[1]} />
            <stop offset="100%" stopColor={colorMap.ringGrad[2]} />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48.5" fill="#0c0c10" stroke="#27272a" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#18181b" strokeWidth="3" />

        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          return (
            <line
              key={i}
              x1="50"
              y1="2.5"
              x2="50"
              y2={i % 3 === 0 ? '6.5' : '5'}
              stroke={colorMap.tickColor}
              strokeWidth={i % 3 === 0 ? '1.2' : '0.6'}
              opacity={i % 3 === 0 ? '0.9' : '0.4'}
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#concept-a-gauge)"
          strokeWidth="2.2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-300"
        />

        <circle cx="50" cy="50" r="40" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />

        <g clipPath="url(#concept-a-clip)">
          <path d={backPath} fill="url(#concept-a-back)" />
          <path d={frontPath} fill="url(#concept-a-front)" />

          <line x1="0" y1={baseY} x2="100" y2={baseY} stroke="#ffffff" strokeWidth="0.6" opacity="0.3" />

          <circle cx="35" cy="58" r="0.9" fill="#ffffff" opacity="0.3" />
          <circle cx="68" cy="68" r="1.3" fill="#ffffff" opacity="0.2" />
          <circle cx="50" cy="78" r="1.1" fill="#ffffff" opacity="0.25" />
        </g>

        <path
          d="M 20,30 A 32,32 0 0,1 80,30 A 35,35 0 0,0 20,30 Z"
          fill="#ffffff"
          opacity="0.12"
          className="pointer-events-none"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <span
          className={`font-mono font-black ${TEXT_SIZES[size]} tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]`}
          style={{ color: colorMap.accent }}
        >
          {formatTime(timeLeftSeconds)}
        </span>
        <span className="text-[9px] font-serif uppercase tracking-[0.2em] text-zinc-400 font-bold mt-0.5">
          {Math.round(progress * 100)}% Restante
        </span>
      </div>
    </div>
  );
}

// ===========================================================================
// CONCEPT B: "The Obsidian Core" (Reator Rúnico & Cristal Negro Translúcido)
// ===========================================================================
export function OrbConceptB({ progress, timeLeftSeconds, mode, isRunning, size = 'standard', className = '' }: CommonOrbProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isRunning || mode === 'paused') return;
    const interval = setInterval(() => {
      setPhase((p) => (p + 0.05) % (Math.PI * 2));
    }, 33);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const baseY = 100 - progress * 100;
  const amplitude = isRunning && mode !== 'paused' && progress > 0.02 && progress < 0.98 ? 4.2 * Math.sin(progress * Math.PI) : 0;
  const frontPath = generateWave(baseY, phase, amplitude);
  const backPath = generateWave(baseY, -phase * 0.75 + Math.PI, amplitude * 0.75);

  const colors = {
    work: {
      accent: '#fef08a',
      liquidFront: ['#fef08a', '#e5c158', '#713f12'],
      liquidBack: ['#b48c26', '#422006'],
      glow: 'rgba(229,193,88,0.2)',
      rune: '#e5c158',
    },
    dungeon: {
      accent: '#e9d5ff',
      liquidFront: ['#e9d5ff', '#a855f7', '#3b0764'],
      liquidBack: ['#7e22ce', '#1e0538'],
      glow: 'rgba(168,85,247,0.2)',
      rune: '#a855f7',
    },
    wilderness: {
      accent: '#ffe4e6',
      liquidFront: ['#ffe4e6', '#f43f5e', '#4c0519'],
      liquidBack: ['#be123c', '#20020a'],
      glow: 'rgba(244,63,94,0.2)',
      rune: '#f43f5e',
    },
    break: {
      accent: '#a7f3d0',
      liquidFront: ['#a7f3d0', '#10b981', '#022c22'],
      liquidBack: ['#059669', '#011711'],
      glow: 'rgba(16,185,129,0.2)',
      rune: '#10b981',
    },
    urgent: {
      accent: '#fecdd3',
      liquidFront: ['#fecdd3', '#ef4444', '#450a0a'],
      liquidBack: ['#b91c1c', '#200404'],
      glow: 'rgba(239,68,68,0.35)',
      rune: '#ef4444',
    },
    paused: {
      accent: '#e4e4e7',
      liquidFront: ['#d4d4d8', '#71717a', '#18181b'],
      liquidBack: ['#52525b', '#09090b'],
      glow: 'rgba(113,113,122,0.1)',
      rune: '#71717a',
    },
  }[mode];

  return (
    <div className={`relative ${SIZE_CLASSES[size]} flex items-center justify-center select-none ${className}`}>
      <div
        className="absolute inset-2 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
        style={{ background: colors.glow }}
      />

      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_16px_36px_rgba(0,0,0,0.9)]">
        <defs>
          <clipPath id="concept-b-clip">
            <circle cx="50" cy="50" r="43" />
          </clipPath>

          <linearGradient id="concept-b-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.liquidFront[0]} stopOpacity="0.9" />
            <stop offset="45%" stopColor={colors.liquidFront[1]} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colors.liquidFront[2]} stopOpacity="0.98" />
          </linearGradient>

          <linearGradient id="concept-b-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.liquidBack[0]} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.liquidBack[1]} stopOpacity="0.75" />
          </linearGradient>

          <radialGradient id="concept-b-vignette" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="50" r="45" fill="#09090b" stroke="#1f1f23" strokeWidth="1" />

        <g opacity="0.08" stroke={colors.rune} strokeWidth="0.8" fill="none">
          <polygon points="50,15 78,65 22,65" />
          <polygon points="50,85 78,35 22,35" />
          <circle cx="50" cy="50" r="18" />
        </g>

        <g clipPath="url(#concept-b-clip)">
          <path d={backPath} fill="url(#concept-b-back)" />
          <path d={frontPath} fill="url(#concept-b-front)" />

          <line x1="0" y1={baseY} x2="100" y2={baseY} stroke="#ffffff" strokeWidth="1" opacity="0.35" />

          <circle cx="38" cy="62" r="1.2" fill="#ffffff" opacity="0.4" className="animate-pulse" />
          <circle cx="64" cy="74" r="1.5" fill="#ffffff" opacity="0.25" className="animate-pulse" />
          <circle cx="48" cy="82" r="0.9" fill="#ffffff" opacity="0.3" className="animate-pulse" />
        </g>

        <circle cx="50" cy="50" r="43" fill="url(#concept-b-vignette)" className="pointer-events-none" />

        <circle cx="50" cy="50" r="44.5" fill="none" stroke="#e5c158" strokeWidth="0.75" opacity="0.3" />
        <circle cx="50" cy="50" r="45.5" fill="none" stroke="#27272a" strokeWidth="0.5" />

        <path
          d="M 16,36 A 38,38 0 0,1 84,36 A 42,42 0 0,0 16,36 Z"
          fill="#ffffff"
          opacity="0.22"
          className="pointer-events-none"
        />
        <circle cx="75" cy="75" r="2.5" fill="#ffffff" opacity="0.08" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <span
          className={`font-mono font-black ${TEXT_SIZES[size]} tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]`}
          style={{ color: colors.accent }}
        >
          {formatTime(timeLeftSeconds).split(':')[0]}
          <span className={isRunning && mode !== 'paused' ? 'animate-pulse' : ''}>:</span>
          {formatTime(timeLeftSeconds).split(':')[1]}
        </span>
        <span className="text-[9px] font-mono tracking-widest text-zinc-400 font-bold uppercase mt-1">
          {mode === 'work' ? '⚔️ Foco Puro' : mode === 'dungeon' ? '🗝️ Masmorra' : mode === 'wilderness' ? '💀 Selvagem' : '☕ Pausa'}
        </span>
      </div>
    </div>
  );
}

// ===========================================================================
// CONCEPT C: "The Arcane Dial" (Minimalismo Alquímico Contemporâneo)
// ===========================================================================
export function OrbConceptC({ progress, timeLeftSeconds, mode, isRunning, size = 'standard', className = '' }: CommonOrbProps) {
  const colors = {
    work: { track: '#e5c158', trackBg: '#27272a', bgGlow: 'rgba(229,193,88,0.15)', text: '#fef08a' },
    dungeon: { track: '#c084fc', trackBg: '#2e1065', bgGlow: 'rgba(192,132,252,0.15)', text: '#e9d5ff' },
    wilderness: { track: '#fb7185', trackBg: '#4c0519', bgGlow: 'rgba(251,113,133,0.15)', text: '#ffe4e6' },
    break: { track: '#10b981', trackBg: '#022c22', bgGlow: 'rgba(16,185,129,0.15)', text: '#a7f3d0' },
    urgent: { track: '#f43f5e', trackBg: '#450a0a', bgGlow: 'rgba(244,63,94,0.3)', text: '#fecdd3' },
    paused: { track: '#71717a', trackBg: '#18181b', bgGlow: 'rgba(113,113,122,0.05)', text: '#d4d4d8' },
  }[mode];

  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`relative ${SIZE_CLASSES[size]} flex items-center justify-center select-none ${className}`}>
      <div
        className="absolute inset-4 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
        style={{ background: colors.bgGlow }}
      />

      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
        <defs>
          <linearGradient id="concept-c-track-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="40%" stopColor={colors.track} />
            <stop offset="100%" stopColor={colors.track} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="#111116" stroke="#27272a" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="46.5" fill="#09090b" />

        <g stroke="#ffffff" strokeWidth="0.3" opacity="0.06" fill="none">
          <circle cx="50" cy="50" r="32" strokeDasharray="1, 3" />
          <circle cx="50" cy="50" r="20" />
          <line x1="50" y1="18" x2="50" y2="82" />
          <line x1="18" y1="50" x2="82" y2="50" />
          <line x1="27" y1="27" x2="73" y2="73" />
          <line x1="27" y1="73" x2="73" y2="27" />
        </g>

        <circle cx="50" cy="50" r={radius} fill="none" stroke={colors.trackBg} strokeWidth="3" />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#concept-c-track-grad)"
          strokeWidth="3.2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-all duration-300"
        />

        <circle cx="50" cy="50" r="36" fill="#0c0c10" stroke="#1f1f23" strokeWidth="0.75" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <span className="text-[10px] font-serif uppercase tracking-[0.25em] text-zinc-500 font-bold">
          {mode === 'break' ? 'Recuperação' : 'Cronômetro'}
        </span>
        <span
          className={`font-mono font-black ${TEXT_SIZES[size]} tracking-tighter my-0.5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]`}
          style={{ color: colors.text }}
        >
          {formatTime(timeLeftSeconds)}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors.track }} />
          <span className="text-[9.5px] font-mono font-bold text-zinc-400">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// CONCEPT D: "The Master Alchemist Flask" (Elixir de Joalheria + Guia de Respiração)
// ===========================================================================
export function OrbConceptD({ progress, timeLeftSeconds, mode, isRunning, size = 'standard', className = '' }: CommonOrbProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isRunning || mode === 'paused') return;
    const interval = setInterval(() => {
      setPhase((p) => (p + 0.05) % (Math.PI * 2));
    }, 33);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const baseY = 100 - progress * 100;
  const amplitude = isRunning && mode !== 'paused' && progress > 0.02 && progress < 0.98 ? 3.8 * Math.sin(progress * Math.PI) : 0;
  const frontPath = generateWave(baseY, phase, amplitude);
  const backPath = generateWave(baseY, -phase * 0.8 + Math.PI, amplitude * 0.7);

  const colors = {
    work: { text: '#fef08a', liquid: ['#fef08a', '#e5c158', '#854d0e'], back: ['#a16207', '#451a03'], glow: 'rgba(229,193,88,0.25)' },
    dungeon: { text: '#e9d5ff', liquid: ['#e9d5ff', '#a855f7', '#581c87'], back: ['#7e22ce', '#3b0764'], glow: 'rgba(168,85,247,0.25)' },
    wilderness: { text: '#ffe4e6', liquid: ['#ffe4e6', '#f43f5e', '#881337'], back: ['#be123c', '#4c0519'], glow: 'rgba(244,63,94,0.25)' },
    break: { text: '#a7f3d0', liquid: ['#a7f3d0', '#10b981', '#064e3b'], back: ['#059669', '#022c22'], glow: 'rgba(16,185,129,0.25)' },
    urgent: { text: '#fecdd3', liquid: ['#fecdd3', '#ef4444', '#7f1d1d'], back: ['#b91c1c', '#450a0a'], glow: 'rgba(239,68,68,0.35)' },
    paused: { text: '#d4d4d8', liquid: ['#d4d4d8', '#71717a', '#27272a'], back: ['#52525b', '#18181b'], glow: 'rgba(113,113,122,0.1)' },
  }[mode];

  return (
    <div className={`relative ${SIZE_CLASSES[size]} flex items-center justify-center select-none ${className}`}>
      <div className={`relative w-full h-full flex items-center justify-center ${isRunning && mode !== 'paused' ? 'animate-pulse' : ''}`} style={{ animationDuration: '4s' }}>
        <div
          className="absolute inset-2 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
          style={{ background: colors.glow }}
        />

        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_14px_32px_rgba(0,0,0,0.85)]">
          <defs>
            <clipPath id="concept-d-clip">
              <circle cx="50" cy="50" r="43.5" />
            </clipPath>

            <linearGradient id="concept-d-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.liquid[0]} stopOpacity="0.92" />
              <stop offset="45%" stopColor={colors.liquid[1]} stopOpacity="0.94" />
              <stop offset="100%" stopColor={colors.liquid[2]} stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="concept-d-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.back[0]} stopOpacity="0.65" />
              <stop offset="100%" stopColor={colors.back[1]} stopOpacity="0.75" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="45" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />

          <polygon
            points="50,6 81,19 94,50 81,81 50,94 19,81 6,50 19,19"
            fill="none"
            stroke="#e5c158"
            strokeWidth="0.5"
            opacity="0.15"
          />

          <g clipPath="url(#concept-d-clip)">
            <path d={backPath} fill="url(#concept-d-back)" />
            <path d={frontPath} fill="url(#concept-d-front)" />

            <line x1="0" y1={baseY} x2="100" y2={baseY} stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />

            <circle cx="35" cy="55" r="1.3" fill="#ffffff" opacity="0.4" />
            <circle cx="65" cy="65" r="1.8" fill="#ffffff" opacity="0.25" />
            <circle cx="45" cy="78" r="1.1" fill="#ffffff" opacity="0.3" />
            <circle cx="58" cy="88" r="1.4" fill="#ffffff" opacity="0.2" />
          </g>

          <circle cx="50" cy="50" r="44.5" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.2" />
          <path
            d="M 18,34 A 36,36 0 0,1 82,34 A 40,40 0 0,0 18,34 Z"
            fill="#ffffff"
            opacity="0.2"
            className="pointer-events-none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
          <span
            className={`font-mono font-black ${TEXT_SIZES[size]} tracking-wider drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]`}
            style={{ color: colors.text }}
          >
            {formatTime(timeLeftSeconds)}
          </span>
          <span className="text-[8.5px] font-serif uppercase tracking-[0.2em] text-zinc-400 font-bold mt-0.5">
            Ritmo de Foco
          </span>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// PRODUCTION WRAPPER: FocusOrb
// ===========================================================================
export function FocusOrb({
  timeLeft,
  totalSeconds,
  isRunning,
  isPaused,
  isBreakActive = false,
  isDungeonMode = false,
  isWildernessMode = false,
  size = 'standard',
  className = '',
  orbConcept = 'D',
}: FocusOrbProps) {
  const isUrgent = timeLeft <= 60 && isRunning && !isPaused;

  const mode: ModeType = isBreakActive
    ? 'break'
    : isUrgent
      ? 'urgent'
      : isPaused
        ? 'paused'
        : isDungeonMode
          ? 'dungeon'
          : isWildernessMode
            ? 'wilderness'
            : 'work';

  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalSeconds)) : 0;

  const conceptProps: CommonOrbProps = {
    progress,
    timeLeftSeconds: timeLeft,
    totalSeconds,
    mode,
    isRunning,
    size,
    className,
  };

  switch (orbConcept) {
    case 'A':
      return <OrbConceptA {...conceptProps} />;
    case 'B':
      return <OrbConceptB {...conceptProps} />;
    case 'C':
      return <OrbConceptC {...conceptProps} />;
    case 'D':
    default:
      return <OrbConceptD {...conceptProps} />;
  }
}