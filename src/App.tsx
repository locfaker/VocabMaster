import { Routes, Route } from 'react-router-dom'
import { TitleBar } from '@/components/common/TitleBar'
import { Sidebar } from '@/components/common/Sidebar'
import { Home } from '@/pages/Home'
import { Learn } from '@/pages/Learn'
import { Decks } from '@/pages/Decks'
import { DeckDetail } from '@/pages/DeckDetail'
import { Library } from '@/pages/Library'
import { Stats } from '@/pages/Stats'
import { Settings } from '@/pages/Settings'

export default function App() {
    return (
        <div className="h-screen flex flex-col bg-primary-50 dark:bg-dark-bg relative overflow-hidden">
            {/* Ambient Background Mesh */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary-400/20 blur-[100px] animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary-400/20 blur-[100px] animate-pulse-slow pointer-events-none" />

            <TitleBar />
            <div className="flex-1 flex overflow-hidden z-10 relative">
                <Sidebar />
                <main className="flex-1 overflow-y-auto scroll-smooth">
                    <div className="min-h-full w-full">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/learn" element={<Learn />} />
                            <Route path="/decks" element={<Decks />} />
                            <Route path="/decks/:id" element={<DeckDetail />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/stats" element={<Stats />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    )
}
