import React, { useEffect, useRef } from 'react';

interface FocusOrbProps {
  timeLeft: number;      // remaining seconds
  totalSeconds: number;  // total duration of the current session or break
  isRunning: boolean;
  isPaused: boolean;
  isBreakActive?: boolean;
  size?: 'compact' | 'standard' | 'fullscreen';
  className?: string;
}

export function FocusOrb({
  timeLeft,
  totalSeconds,
  isRunning,
  isPaused,
  isBreakActive = false,
  size = 'standard',
  className = '',
}: FocusOrbProps) {
  const frontWaveRef = useRef<SVGPathElement>(null);
  const backWaveRef = useRef<SVGPathElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Keep latest props in refs to prevent stale closure captures in requestAnimationFrame
  const timeLeftRef = useRef(timeLeft);
  const totalSecondsRef = useRef(totalSeconds);
  const isRunningRef = useRef(isRunning);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    totalSecondsRef.current = totalSeconds;
    isRunningRef.current = isRunning;
    isPausedRef.current = isPaused;
  }, [timeLeft, totalSeconds, isRunning, isPaused]);

  // Format seconds to digital digits (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Helper to generate the closed wave SVG path
  // Coordinates are based on a 100x100 viewBox
  const generateWavePath = (baseY: number, phase: number, amplitude: number) => {
    const points = [];
    const N = 12; // 12 points is perfect: smooth curve and extremely light overhead
    const width = 120;
    const startX = -10;

    for (let i = 0; i <= N; i++) {
      const x = startX + (i * width) / N;
      // Frequency is adjusted for ~1.2 cycles across the width
      const angle = (x / width) * Math.PI * 2 * 1.2 + phase;
      const y = baseY + Math.sin(angle) * amplitude;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // Closed path: starts at bottom-left, goes up, sweeps across the wave, goes down to bottom-right, and closes
    return `M -10,110 L ${points.join(' L ')} L 110,110 Z`;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      } else {
        startLoop();
      }
    };

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;

      const elapsed = timestamp - lastFrameTimeRef.current;

      // Throttle to roughly 30fps (~33ms) to save battery and reduce CPU cycles
      if (elapsed >= 33) {
        lastFrameTimeRef.current = timestamp;

        // Advance phase
        phaseRef.current += 0.05;
        if (phaseRef.current > Math.PI * 2) {
          phaseRef.current -= Math.PI * 2;
        }

        const currentTotal = totalSecondsRef.current;
        const currentLeft = timeLeftRef.current;
        const progress = currentTotal > 0 ? currentLeft / currentTotal : 0;
        const baseY = 100 - progress * 100;

        // Wave amplitude peaks at 50% progress and goes to 0 at empty/full to prevent clipping
        let amplitude = 0;
        if (isRunningRef.current && !isPausedRef.current && progress > 0.01 && progress < 0.99) {
          amplitude = 3.8 * Math.sin(progress * Math.PI);
        }

        const frontPath = generateWavePath(baseY, phaseRef.current, amplitude);
        const backPath = generateWavePath(baseY, -phaseRef.current * 0.8 + Math.PI, amplitude * 0.8);

        if (frontWaveRef.current) {
          frontWaveRef.current.setAttribute('d', frontPath);
        }
        if (backWaveRef.current) {
          backWaveRef.current.setAttribute('d', backPath);
        }
      }

      if (isRunningRef.current && !isPausedRef.current && !document.hidden) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    const startLoop = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (isRunningRef.current && !isPausedRef.current && !document.hidden) {
        lastFrameTimeRef.current = 0;
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        drawStatic();
      }
    };

    const drawStatic = () => {
      const currentTotal = totalSecondsRef.current;
      const currentLeft = timeLeftRef.current;
      const progress = currentTotal > 0 ? currentLeft / currentTotal : 0;
      const baseY = 100 - progress * 100;

      // When static/paused, render zero amplitude flat or micro-waveless surface
      const frontPath = generateWavePath(baseY, phaseRef.current, 0);
      const backPath = generateWavePath(baseY, -phaseRef.current * 0.8 + Math.PI, 0);

      if (frontWaveRef.current) {
        frontWaveRef.current.setAttribute('d', frontPath);
      }
      if (backWaveRef.current) {
        backWaveRef.current.setAttribute('d', backPath);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startLoop();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Effect to update level immediately when timeLeft or totalSeconds changes while paused/idle
  useEffect(() => {
    const isLoopActive = isRunning && !isPaused && !document.hidden;
    if (!isLoopActive) {
      const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
      const baseY = 100 - progress * 100;
      
      const frontPath = generateWavePath(baseY, phaseRef.current, 0);
      const backPath = generateWavePath(baseY, -phaseRef.current * 0.8 + Math.PI, 0);

      if (frontWaveRef.current) frontWaveRef.current.setAttribute('d', frontPath);
      if (backWaveRef.current) backWaveRef.current.setAttribute('d', backPath);
    }
  }, [timeLeft, totalSeconds, isRunning, isPaused]);

  // Determine current potion color states
  const isUrgent = timeLeft <= 60 && isRunning && !isPaused;

  const gradientFront = isBreakActive
    ? 'url(#liquid-break)'
    : isUrgent
      ? 'url(#liquid-urgent)'
      : isPaused
        ? 'url(#liquid-paused)'
        : 'url(#liquid-work)';

  const gradientBack = isBreakActive
    ? 'url(#liquid-break-back)'
    : isUrgent
      ? 'url(#liquid-urgent-back)'
      : isPaused
        ? 'url(#liquid-paused-back)'
        : 'url(#liquid-work-back)';

  // Sizing styles
  const sizeClasses = {
    compact: 'w-[172px] h-[172px]',
    standard: 'w-[172px] h-[172px] min-[390px]:w-[218px] min-[390px]:h-[218px] lg:w-[288px] lg:h-[288px]',
    fullscreen: 'w-[253px] h-[253px] sm:w-[345px] sm:h-[345px] lg:w-[437px] lg:h-[437px]',
  };

  // Text overlay responsive scale
  const textStyles = isBreakActive
    ? 'text-emerald-300 font-extrabold tracking-wider drop-shadow-[0_2px_12px_rgba(16,185,129,0.5)]'
    : isUrgent
      ? 'text-red-400 font-extrabold animate-pulse pausable-anim tracking-wider drop-shadow-[0_2px_12px_rgba(239,68,68,0.6)]'
      : isPaused
        ? 'text-amber-500/80 font-bold tracking-wider drop-shadow-[0_2px_8px_rgba(245,158,11,0.2)]'
        : isRunning
          ? 'text-amber-100 font-extrabold tracking-wider drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
          : 'text-amber-200/75 font-semibold tracking-wider';

  const textSizes = size === 'fullscreen'
    ? 'text-4xl sm:text-5xl lg:text-6xl'
    : 'text-2xl min-[390px]:text-3xl lg:text-4xl';

  return (
    <div id="focus-orb-container" className={`relative select-none flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* Glow ring backdrop */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl opacity-10 transition-colors duration-1000 ${
          isBreakActive
            ? 'bg-emerald-500'
            : isUrgent
              ? 'bg-red-500 animate-pulse pausable-anim'
              : isPaused
                ? 'bg-amber-600'
                : isRunning
                  ? 'bg-amber-500'
                  : 'bg-amber-500/30'
        }`}
      />

      {/* SVG potion graphic */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Circular mask for the fluid */}
          <clipPath id="orb-clip">
            <circle cx="50" cy="50" r="45" />
          </clipPath>

          {/* Gradients */}
          {/* Work (Focus) state */}
          <linearGradient id="liquid-work" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#d97706" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="liquid-work-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#451a03" stopOpacity="0.6" />
          </linearGradient>

          {/* Urgent state */}
          <linearGradient id="liquid-urgent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#dc2626" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="liquid-urgent-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#450a0a" stopOpacity="0.7" />
          </linearGradient>

          {/* Break state */}
          <linearGradient id="liquid-break" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="liquid-break-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.6" />
          </linearGradient>

          {/* Paused state */}
          <linearGradient id="liquid-paused" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#d97706" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="liquid-paused-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#451a03" stopOpacity="0.55" />
          </linearGradient>

          {/* Glossy rim gradient */}
          <linearGradient id="glass-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="30%" stopColor="#d97706" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#140f0d" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </linearGradient>

          {/* Glass highlight gradient */}
          <linearGradient id="glass-highlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Potion background base */}
        <circle cx="50" cy="50" r="45" fill="#130d0a" stroke="none" />

        {/* Liquid paths (clipped circular) */}
        <g clipPath="url(#orb-clip)">
          {/* Back wave */}
          <path ref={backWaveRef} fill={gradientBack} />
          {/* Front wave */}
          <path ref={frontWaveRef} fill={gradientFront} />

          {/* Ambient rising bubbles inside potion */}
          <circle cx="30" cy="60" r="1.2" fill="#ffffff" opacity="0.25" className="animate-pulse pausable-anim" style={{ animationDuration: '2s' }} />
          <circle cx="72" cy="70" r="1.8" fill="#ffffff" opacity="0.15" className="animate-pulse pausable-anim" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          <circle cx="52" cy="80" r="1.5" fill="#ffffff" opacity="0.2" className="animate-pulse pausable-anim" style={{ animationDuration: '2.5s', animationDelay: '1.2s' }} />
          <circle cx="40" cy="45" r="0.8" fill="#ffffff" opacity="0.3" className="animate-pulse pausable-anim" style={{ animationDuration: '1.5s', animationDelay: '0.8s' }} />
          <circle cx="60" cy="55" r="1.0" fill="#ffffff" opacity="0.25" className="animate-pulse pausable-anim" style={{ animationDuration: '2.2s', animationDelay: '0.3s' }} />
        </g>

        {/* Rotating runic gold frame outside */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={isBreakActive ? '#10b981' : isUrgent ? '#ef4444' : '#d97706'}
          strokeWidth="1.2"
          opacity="0.45"
          strokeDasharray="4, 4"
          className={isRunning && !isPaused ? 'animate-spin pausable-anim' : ''}
          style={{ transformOrigin: 'center', animationDuration: '45s' }}
        />

        {/* Glass border and framing */}
        <circle cx="50" cy="50" r="45.2" fill="none" stroke="url(#glass-rim)" strokeWidth="1.6" />
        <circle cx="50" cy="50" r="44.2" fill="none" stroke="#000000" strokeWidth="0.8" opacity="0.5" />

        {/* Realistic curved 3D glass shine at the top */}
        <path
          d="M 15,32 A 38,38 0 0,1 85,32 A 42,42 0 0,0 15,32 Z"
          fill="url(#glass-highlight)"
          className="pointer-events-none"
        />
        
        {/* Small reflection circle at bottom right */}
        <circle cx="78" cy="78" r="3" fill="#ffffff" opacity="0.05" />
      </svg>

      {/* Floating digital timer text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-20">
        <span className={`font-mono font-black ${textSizes} ${textStyles}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
}
