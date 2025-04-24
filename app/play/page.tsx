'use client'

import { useRouter } from 'next/navigation'

export default function PlayPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white p-4">
      <h1 className="text-3xl text-center font-bold mb-4">Oyun Sayfası</h1>
      
      <div className="flex justify-center mt-8">
        <button
          onClick={() => router.push('/')}
          className="bg-slate-500 hover:bg-slate-600 px-6 py-2 rounded-xl shadow text-white"
        >
          🔙 Ana Sayfaya Dön
        </button>
      </div>
    </main>
  )
}
  