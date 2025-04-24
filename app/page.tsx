'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAudio } from '@/contexts/AudioContext'

export default function HomePage() {
  const router = useRouter()
  const { isMusicPlaying, areSfxMuted, toggleBackgroundMusic, toggleSoundEffects } = useAudio()

  return (
    <main className="min-h-screen relative flex flex-col text-white overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background/bgnoot.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />
      </div>

      {/* Boş alan */}
      <div className="flex-1" />

      {/* Buttons */}
      <div className="relative z-10 p-8 space-y-4 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-20">
        <div className="max-w-xs mx-auto space-y-4">
          <div className="relative text-center">
            <button 
              disabled
              className="w-full bg-yellow-500/90 py-4 rounded-xl text-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">👕</span>
              Customize Character
            </button>
            <span className="absolute bottom-1 right-1 text-xs text-red-500 bg-black/50 px-1.5 py-0.5 rounded font-semibold">BETA</span>
          </div>

          <div className="relative text-center">
            <button 
              disabled
              className="w-full bg-green-500/90 py-4 rounded-xl text-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">⚽</span>
              Play Now
            </button>
            <span className="absolute bottom-1 right-1 text-xs text-red-500 bg-black/50 px-1.5 py-0.5 rounded font-semibold">BETA</span>
          </div>

          <button
            onClick={() => router.push('/2player')}
            className="w-full bg-purple-500/90 hover:bg-purple-600 py-4 rounded-xl text-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <span className="text-2xl">👥</span>
            2 Player
          </button>

          <div className="relative text-center">
            <button 
              disabled
              className="w-full bg-blue-400/90 py-4 rounded-xl text-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm opacity-50 cursor-not-allowed"
            >
              <span className="text-2xl">📘</span>
              How to Play?
            </button>
            <span className="absolute bottom-1 right-1 text-xs text-red-500 bg-black/50 px-1.5 py-0.5 rounded font-semibold">BETA</span>
          </div>

          <div className="text-center text-sm text-white/90 pt-4">
            <p>Versiyon 1.0.0</p>
            <p className="mt-1">Made with ❤️ by Noot Team</p>
          </div>
        </div>
      </div>

      {/* Ses Kontrol Butonları (Sağ Üst Köşe) */} 
      <div className="absolute top-4 right-4 flex gap-3 z-20">
        <button onClick={toggleBackgroundMusic} className="w-10 h-10 bg-black/50 rounded-full p-1 hover:bg-black/70 transition-colors">
          <Image 
            src={isMusicPlaying ? '/assets/tool/son.svg' : '/assets/tool/soff.svg'}
            alt="Toggle Music"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </button>
        <button onClick={toggleSoundEffects} className="w-10 h-10 bg-black/50 rounded-full p-1 hover:bg-black/70 transition-colors">
          <Image 
            src={areSfxMuted ? '/assets/tool/moff.svg' : '/assets/tool/mon.svg'}
            alt="Toggle SFX"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </button>
      </div>
    </main>
  )
}
