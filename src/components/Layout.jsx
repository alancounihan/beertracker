import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-950 max-w-[430px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍺</span>
          <span className="text-amber-400 font-bold text-lg tracking-tight">BeerTracker</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}
