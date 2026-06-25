import { useState } from 'react'
import { DailyScreen } from './components/DailyScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { ProductsScreen } from './components/ProductsScreen'
import { todayIsoDate } from './lib/dates'

type Screen = 'daily' | 'history' | 'products'

const tabs: Array<{ id: Screen; label: string }> = [
  { id: 'daily', label: 'Diario' },
  { id: 'history', label: 'Historial' },
  { id: 'products', label: 'Productos' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('daily')
  const [selectedDate, setSelectedDate] = useState(todayIsoDate())
  const [editingFromHistory, setEditingFromHistory] = useState(false)

  function openScreen(nextScreen: Screen) {
    setEditingFromHistory(false)
    setScreen(nextScreen)
  }

  function editHistoryDay(date: string) {
    setSelectedDate(date)
    setEditingFromHistory(true)
    setScreen('daily')
  }

  return (
    <div className="min-h-screen bg-[#f8f1e7] text-stone-950">
      <header className="sticky top-0 z-10 border-b border-amber-950/10 bg-[#f8f1e7]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">Bar desayuno</p>
            <h1 className="text-xl font-black tracking-tight">Pan del dia</h1>
          </div>
          <div className="rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-50">MVP</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4">
        {screen === 'daily' && (
          <DailyScreen
            selectedDate={selectedDate}
            editingFromHistory={editingFromHistory}
            onDateChange={(date) => {
              setSelectedDate(date)
              setEditingFromHistory(false)
            }}
            onBack={() => {
              setEditingFromHistory(false)
              setScreen('history')
            }}
            onFinished={() => {
              setEditingFromHistory(false)
              setScreen('history')
            }}
          />
        )}
        {screen === 'history' && <HistoryScreen onEditDay={editHistoryDay} />}
        {screen === 'products' && <ProductsScreen />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-950/10 bg-[#fffaf2] px-3 pb-3 pt-2 shadow-[0_-12px_30px_rgba(60,35,10,0.08)]">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => openScreen(tab.id)}
              className={`rounded-2xl px-3 py-3 text-sm font-bold transition ${
                screen === tab.id ? 'bg-amber-950 text-amber-50' : 'bg-amber-100 text-amber-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
