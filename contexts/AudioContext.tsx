'use client';

import React, { createContext, useState, useContext, useRef, useEffect, ReactNode } from 'react';

interface AudioContextType {
  isMusicPlaying: boolean;
  areSfxMuted: boolean;
  toggleBackgroundMusic: () => void;
  toggleSoundEffects: () => void;
  playSfx: (sound: 'kick' | 'jump' | 'finish' | 'goal' | 'select') => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [areSfxMuted, setAreSfxMuted] = useState(true);

  // Provider her render olduğunda Sfx mute durumunu logla
  console.log(`%cAudioProvider Render: areSfxMuted = ${areSfxMuted}`, 'color: blue; font-weight: bold;');

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const kickSfxRef = useRef<HTMLAudioElement | null>(null);
  const jumpSfxRef = useRef<HTMLAudioElement | null>(null);
  const finishSfxRef = useRef<HTMLAudioElement | null>(null);
  const goalSfxRef = useRef<HTMLAudioElement | null>(null);
  const selectSfxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ses dosyalarını yalnızca client tarafında yükle
    if (typeof window !== 'undefined') {
      musicRef.current = new Audio('/assets/sound/game.mp3');
      musicRef.current.loop = true;
      kickSfxRef.current = new Audio('/assets/sound/kick.mp3');
      jumpSfxRef.current = new Audio('/assets/sound/jump.mp3');
      finishSfxRef.current = new Audio('/assets/sound/finish.mp3');
      goalSfxRef.current = new Audio('/assets/sound/goal.mp3');
      selectSfxRef.current = new Audio('/assets/sound/select.mp3');
    }

    // Cleanup: Component unmount olduğunda sesi durdur ve kaynakları serbest bırak
    return () => {
      musicRef.current?.pause();
      musicRef.current = null;
      kickSfxRef.current = null;
      jumpSfxRef.current = null;
      finishSfxRef.current = null;
      goalSfxRef.current = null;
      selectSfxRef.current = null;
    };
  }, []);

  const toggleBackgroundMusic = () => {
    if (!musicRef.current) return;
    
    const shouldPlay = !isMusicPlaying;
    if (shouldPlay) {
      // Müziği ilk kez başlat veya duraklatılmışsa devam et
      console.log("Attempting to play background music...");
      musicRef.current.play().catch(error => console.error("Error playing background music:", error));
    } else {
      // Müziği duraklat
      console.log("Pausing background music.");
      musicRef.current.pause();
    }
    setIsMusicPlaying(shouldPlay);
  };

  const toggleSoundEffects = () => {
    const newState = !areSfxMuted;
    console.log(`Toggling SFX. Current state: ${areSfxMuted}, New state: ${newState}`);
    setAreSfxMuted(newState);
  };

  const playSfx = (sound: 'kick' | 'jump' | 'finish' | 'goal' | 'select') => {
    console.log(`Attempting to play SFX: ${sound}. Muted state: ${areSfxMuted}`);
    if (areSfxMuted) {
        console.log(`SFX play blocked because areSfxMuted is true.`);
        return;
    }

    let sfxRef: React.RefObject<HTMLAudioElement | null> | null = null;
    switch (sound) {
      case 'kick':
        sfxRef = kickSfxRef;
        break;
      case 'jump':
        sfxRef = jumpSfxRef;
        break;
      case 'finish':
        sfxRef = finishSfxRef;
        break;
      case 'goal':
        sfxRef = goalSfxRef;
        break;
      case 'select':
        sfxRef = selectSfxRef;
        break;
    }

    if (sfxRef?.current) {
      console.log(`Playing SFX: ${sound}. Ref found:`, sfxRef.current);
      sfxRef.current.currentTime = 0; // Sesi başa sar
      sfxRef.current.play().catch(error => console.error(`Error playing ${sound} SFX:`, error));
    } else {
      console.warn(`SFX Ref not found for sound: ${sound}`);
    }
  };

  return (
    <AudioContext.Provider value={{ isMusicPlaying, areSfxMuted, toggleBackgroundMusic, toggleSoundEffects, playSfx }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 