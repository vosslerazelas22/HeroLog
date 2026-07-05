import { useState, useEffect, useRef } from 'react';
import { AMBIENT_SOUNDS, AmbientTrack } from './ambientSounds.constants';

export interface UseAmbientSoundParams {
  isWorkSessionActive: boolean;
}

export function useAmbientSound(params: UseAmbientSoundParams) {
  const { isWorkSessionActive } = params;

  const [selectedTrack, setSelectedTrack] = useState<string | null>(() => {
    return localStorage.getItem('herolog:ambientSound:track');
  });

  const [volume, setVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('herolog:ambientSound:volume');
    return saved !== null ? Number(saved) : 50;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronized refs to avoid stale closures
  const isWorkSessionActiveRef = useRef(isWorkSessionActive);
  useEffect(() => {
    isWorkSessionActiveRef.current = isWorkSessionActive;
  }, [isWorkSessionActive]);

  const selectedTrackRef = useRef(selectedTrack);
  useEffect(() => {
    selectedTrackRef.current = selectedTrack;
  }, [selectedTrack]);

  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Handle setting volume
  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolumeState(clamped);
    localStorage.setItem('herolog:ambientSound:volume', String(clamped));
    if (audioRef.current) {
      audioRef.current.volume = clamped / 100;
    }
  };

  // Handle selecting a track
  const selectTrack = (id: string | null) => {
    const nextTrack = selectedTrack === id ? null : id;
    setSelectedTrack(nextTrack);
    if (nextTrack) {
      localStorage.setItem('herolog:ambientSound:track', nextTrack);
    } else {
      localStorage.removeItem('herolog:ambientSound:track');
    }
  };

  // Effect to manage HTMLAudioElement lifecycle & source switches
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    audio.volume = volume / 100;

    if (selectedTrack) {
      const trackObj = AMBIENT_SOUNDS.find((t) => t.id === selectedTrack);
      if (trackObj) {
        const base = import.meta.env.BASE_URL || '/';
        const cleanBase = base.endsWith('/') ? base : base + '/';
        const srcPath = `${cleanBase}${trackObj.arquivo}`;

        const currentSrc = audio.src ? new URL(audio.src, window.location.origin).pathname : '';
        const targetSrc = new URL(srcPath, window.location.origin).pathname;

        if (currentSrc !== targetSrc) {
          audio.src = srcPath;
          audio.load();
        }

        if (isWorkSessionActive) {
          audio.play().catch((err) => {
            console.warn('Ambient sound playback blocked by browser autocomplete/interaction rules:', err);
          });
        } else {
          audio.pause();
        }
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [selectedTrack]);

  // Effect to handle changes to the focus session state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedTrack) return;

    if (isWorkSessionActive) {
      audio.play().catch((err) => {
        console.warn('Ambient sound playback blocked or interrupted:', err);
      });
    } else {
      audio.pause();
    }
  }, [isWorkSessionActive, selectedTrack]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    selectedTrack,
    volume,
    selectTrack,
    setVolume,
    tracks: AMBIENT_SOUNDS,
  };
}
