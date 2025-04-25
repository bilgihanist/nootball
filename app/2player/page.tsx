'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAudio } from '@/contexts/AudioContext'
import { useAccount, useWriteContract } from 'wagmi'
import { parseUnits } from 'viem'
import TokenTransfer from '../components/TokenTransfer'

// Takım bilgilerini tanımla
const TEAMS = {
  '200': { name: 'Arsenal', image: '/assets/head/200.png', price: 0 },
  '201': { name: 'Aston Villa', image: '/assets/head/201.png', price: 0 },
  '202': { name: 'Blackburn', image: '/assets/head/202.png', price: 0 },
  '203': { name: 'Bolton', image: '/assets/head/203.png', price: 0 },
  '204': { name: 'Chelsea', image: '/assets/head/204.png', price: 0 },
  '205': { name: 'Everton', image: '/assets/head/205.png', price: 0 },
  '206': { name: 'Fulham', image: '/assets/head/206.png', price: 10 },
  '207': { name: 'Liverpool', image: '/assets/head/207.png', price: 10 },
  '208': { name: 'Man City', image: '/assets/head/208.png', price: 10 },
  '209': { name: 'Man Utd', image: '/assets/head/209.png', price: 10 },
  '210': { name: 'Newcastle', image: '/assets/head/210.png', price: 10 },
  '211': { name: 'Tottenham', image: '/assets/head/211.png', price: 10 }
} as const

type TeamId = keyof typeof TEAMS

const stadiums = ['/assets/stadium/300.png', '/assets/stadium/301.png', '/assets/stadium/302.png']

const NOOT_TOKEN_ADDRESS = '0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56';
const RECIPIENT_ADDRESS = '0xA586110A5ae427a39C0f35C6d28375c15efC33C4';

export default function TwoPlayer() {
  const [selectedPlayer1, setSelectedPlayer1] = useState<TeamId>('200')
  const [selectedPlayer2, setSelectedPlayer2] = useState<TeamId>('201')
  const [selectedStadium, setSelectedStadium] = useState('/assets/stadium/300.png')
  const [gameMode, setGameMode] = useState<'golden' | 'timed' | 'first7'>('timed')
  const [unlockedTeams, setUnlockedTeams] = useState<TeamId[]>(['200', '201', '202', '203', '204', '205']) // İlk 6 karakter varsayılan olarak açık
  const router = useRouter()
  const { playSfx, isMusicPlaying, areSfxMuted, toggleBackgroundMusic, toggleSoundEffects } = useAudio()
  const { address, isConnected } = useAccount()
  const { writeContract, isPending } = useWriteContract()

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

  const handleSelectPlayer1 = async (id: TeamId) => {
    if (!isConnected) {
      alert('Lütfen önce cüzdanınızı bağlayın!')
      return
    }

    if (unlockedTeams.includes(id)) {
      setSelectedPlayer1(id)
      playSfx('select')
    } else {
      try {
        await writeContract({
          address: NOOT_TOKEN_ADDRESS,
          abi: [
            {
              "constant": false,
              "inputs": [
                {
                  "name": "_to",
                  "type": "address"
                },
                {
                  "name": "_value",
                  "type": "uint256"
                }
              ],
              "name": "transfer",
              "outputs": [
                {
                  "name": "",
                  "type": "bool"
                }
              ],
              "payable": false,
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'transfer',
          args: [RECIPIENT_ADDRESS, parseUnits("10", 18)],
        })
        setUnlockedTeams([...unlockedTeams, id])
        setSelectedPlayer1(id)
        playSfx('select')
      } catch (err) {
        console.error('Transfer error:', err)
        alert('Ödeme sırasında bir hata oluştu!')
      }
    }
  }

  const handleSelectPlayer2 = async (id: TeamId) => {
    if (!isConnected) {
      alert('Lütfen önce cüzdanınızı bağlayın!')
      return
    }

    if (unlockedTeams.includes(id)) {
      setSelectedPlayer2(id)
      playSfx('select')
    } else {
      try {
        await writeContract({
          address: NOOT_TOKEN_ADDRESS,
          abi: [
            {
              "constant": false,
              "inputs": [
                {
                  "name": "_to",
                  "type": "address"
                },
                {
                  "name": "_value",
                  "type": "uint256"
                }
              ],
              "name": "transfer",
              "outputs": [
                {
                  "name": "",
                  "type": "bool"
                }
              ],
              "payable": false,
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'transfer',
          args: [RECIPIENT_ADDRESS, parseUnits("10", 18)],
        })
        setUnlockedTeams([...unlockedTeams, id])
        setSelectedPlayer2(id)
        playSfx('select')
      } catch (err) {
        console.error('Transfer error:', err)
        alert('Ödeme sırasında bir hata oluştu!')
      }
    }
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
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 max-w-5xl mx-auto relative">
      <header className="w-full py-4 mb-6">
        <div className="flex justify-end">
          <TokenTransfer />
        </div>
      </header>

      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">2 Player Game Settings</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold">Player 1</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(TEAMS).map(([id, team]) => (
              <button
                key={id}
                onClick={() => handleSelectPlayer1(id as TeamId)}
                disabled={isPending}
                className={`p-1 sm:p-1.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative ${
                  selectedPlayer1 === id ? 'border-blue-500 bg-blue-500/20' : 
                  unlockedTeams.includes(id as TeamId) ? 'border-gray-700 hover:border-gray-500' : 
                  'border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <Image 
                  src={team.image} 
                  alt={team.name}
                  width={40}
                  height={40}
                  className="mx-auto mb-1"
                />
                <span className="text-[10px] sm:text-xs">{team.name}</span>
                {!unlockedTeams.includes(id as TeamId) && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs text-yellow-500 font-semibold">
                    {team.price} NOOT
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold">Player 2</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(TEAMS).map(([id, team]) => (
              <button
                key={id}
                onClick={() => handleSelectPlayer2(id as TeamId)}
                disabled={isPending}
                className={`p-1 sm:p-1.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative ${
                  selectedPlayer2 === id ? 'border-red-500 bg-red-500/20' : 
                  unlockedTeams.includes(id as TeamId) ? 'border-gray-700 hover:border-gray-500' : 
                  'border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <Image 
                  src={team.image} 
                  alt={team.name}
                  width={40}
                  height={40}
                  className="mx-auto mb-1"
                />
                <span className="text-[10px] sm:text-xs">{team.name}</span>
                {!unlockedTeams.includes(id as TeamId) && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs text-yellow-500 font-semibold">
                    {team.price} NOOT
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <div className="bg-white/5 rounded-xl p-3">
          <h3 className="text-base sm:text-lg font-bold mb-3 text-center">Stadium</h3>
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            <button 
              onClick={handlePrevStadium}
              className="bg-white/10 hover:bg-white/20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm"
            >
              ◀
            </button>
            <div className="relative w-32 h-24 sm:w-40 sm:h-28 bg-white/10 rounded-lg overflow-hidden">
              <Image src={selectedStadium} alt="stadium" fill className="object-center" />
            </div>
            <button 
              onClick={handleNextStadium}
              className="bg-white/10 hover:bg-white/20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <h3 className="text-base sm:text-lg font-bold mb-3 text-center">Oyun Modu</h3>
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
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm sm:text-base font-bold transition-colors active:scale-95"
        >
          Start Game
        </button>
      </div>

      {/* Ses Kontrol Butonları (Sağ Alt Köşe) */}
      <div className="absolute bottom-4 right-4 flex gap-3 z-20">
        <button onClick={toggleBackgroundMusic} className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full p-1 hover:bg-black/70 transition-colors">
          <Image 
            src={isMusicPlaying ? '/assets/tool/son.svg' : '/assets/tool/soff.svg'}
            alt="Toggle Music"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </button>
        <button onClick={toggleSoundEffects} className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full p-1 hover:bg-black/70 transition-colors">
          <Image 
            src={areSfxMuted ? '/assets/tool/moff.svg' : '/assets/tool/mon.svg'}
            alt="Toggle SFX"
            width={32}
            height={32}
            className="w-full h-full object-contain"
          />
        </button>
      </div>
    </div>
  )
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm ${
        selected 
          ? 'bg-yellow-400/90 text-black shadow-lg scale-105' 
          : 'bg-white/10 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
} 