'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAudio } from '@/contexts/AudioContext'

// Takım bilgilerini tanımla
const TEAMS = {
  '200': { name: 'Arsenal', image: '/assets/head/200.png' },
  '201': { name: 'Aston Villa', image: '/assets/head/201.png' },
  '202': { name: 'Blackburn', image: '/assets/head/202.png' },
  '203': { name: 'Bolton', image: '/assets/head/203.png' },
  '204': { name: 'Chelsea', image: '/assets/head/204.png' },
  '205': { name: 'Everton', image: '/assets/head/205.png' },
  '206': { name: 'Fulham', image: '/assets/head/206.png' },
  '207': { name: 'Liverpool', image: '/assets/head/207.png' },
  '208': { name: 'Man City', image: '/assets/head/208.png' },
  '209': { name: 'Man Utd', image: '/assets/head/209.png' },
  '210': { name: 'Newcastle', image: '/assets/head/210.png' },
  '211': { name: 'Tottenham', image: '/assets/head/211.png' }
} as const

type TeamId = keyof typeof TEAMS

const stadiums = ['/assets/stadium/300.png', '/assets/stadium/301.png', '/assets/stadium/302.png']

export default function TwoPlayer() {
  const [selectedPlayer1, setSelectedPlayer1] = useState<TeamId>('200')
  const [selectedPlayer2, setSelectedPlayer2] = useState<TeamId>('201')
  const [selectedStadium, setSelectedStadium] = useState('/assets/stadium/300.png')
  const [gameMode, setGameMode] = useState<'golden' | 'timed' | 'first7'>('timed')
  const router = useRouter()
  const { playSfx } = useAudio()

  const handleStartGame = () => {
    const settings = {
      player1Team: selectedPlayer1,
      player2Team: selectedPlayer2,
      stadium: selectedStadium,
      gameMode
    }
    localStorage.setItem('2player-settings', JSON.stringify(settings))
    router.push('/2player-game')
  }

  const handleSelectPlayer1 = (id: TeamId) => {
    setSelectedPlayer1(id)
    playSfx('select')
  }

  const handleSelectPlayer2 = (id: TeamId) => {
    setSelectedPlayer2(id)
    playSfx('select')
  }

  const handlePrevStadium = () => {
    const currentIndex = stadiums.indexOf(selectedStadium)
    const prevIndex = (currentIndex - 1 + stadiums.length) % stadiums.length
    setSelectedStadium(stadiums[prevIndex])
    playSfx('select')
  }

  const handleNextStadium = () => {
    const currentIndex = stadiums.indexOf(selectedStadium)
    const nextIndex = (currentIndex + 1) % stadiums.length
    setSelectedStadium(stadiums[nextIndex])
    playSfx('select')
  }

  const handleSelectGameMode = (mode: 'golden' | 'timed' | 'first7') => {
    if (gameMode !== mode) {
      setGameMode(mode)
      playSfx('select')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">2 Player Game Settings</h1>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Player 1</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(TEAMS).map(([id, team]) => (
              <button
                key={id}
                onClick={() => handleSelectPlayer1(id as TeamId)}
                className={`p-1.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  selectedPlayer1 === id ? 'border-blue-500 bg-blue-500/20' : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <Image 
                  src={team.image} 
                  alt={team.name}
                  width={48}
                  height={48}
                  className="mx-auto mb-1"
                />
                <span className="text-xs">{team.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">Player 2</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(TEAMS).map(([id, team]) => (
              <button
                key={id}
                onClick={() => handleSelectPlayer2(id as TeamId)}
                className={`p-1.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                  selectedPlayer2 === id ? 'border-red-500 bg-red-500/20' : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <Image 
                  src={team.image} 
                  alt={team.name}
                  width={48}
                  height={48}
                  className="mx-auto mb-1"
                />
                <span className="text-xs">{team.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 rounded-xl p-3">
          <h3 className="text-lg font-bold mb-3 text-center">Stadium</h3>
          <div className="flex justify-center items-center gap-3">
            <button 
              onClick={handlePrevStadium}
              className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm"
            >
              ◀
            </button>
            <div className="relative w-40 h-28 bg-white/10 rounded-lg overflow-hidden">
              <Image src={selectedStadium} alt="stadium" fill className="object-center" />
            </div>
            <button 
              onClick={handleNextStadium}
              className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <h3 className="text-lg font-bold mb-3 text-center">Oyun Modu</h3>
          <div className="flex flex-col gap-1.5">
            <Option selected={gameMode === 'timed'} onClick={() => handleSelectGameMode('timed')}>
              🕒 Timed (60 seconds)
            </Option>
            <Option selected={gameMode === 'first7'} onClick={() => handleSelectGameMode('first7')}>
              ⚽ First to Seven
            </Option>
            <Option selected={gameMode === 'golden'} onClick={() => handleSelectGameMode('golden')}>
              💥 Golden Goal
            </Option>
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleStartGame}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-base font-bold transition-colors active:scale-95"
        >
          Start Game
        </button>
      </div>
    </div>
  )
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 rounded-xl font-bold transition-all text-sm ${
        selected 
          ? 'bg-yellow-400/90 text-black shadow-lg scale-105' 
          : 'bg-white/10 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
} 