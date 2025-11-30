import { useState } from 'react'
import { Download, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useDeckStore } from '@/store/deckStore'
import { getAllVocabularyDecks, getTotalWordCount, VocabDeck } from '@/data'

export function Library() {
    const { createDeck, importWords, fetchDecks } = useDeckStore()
    const [importing, setImporting] = useState<string | null>(null)
    const [imported, setImported] = useState<Record<string, number>>({})
    const [error, setError] = useState('')

    // Filter Logic
    const [filter, setFilter] = useState('ALL')
    
    // Merge Standard Decks with Extra Packs
    const decks = getAllVocabularyDecks()
    const totalWords = getTotalWordCount()

    const filteredDecks = decks.filter(d => {
        if (filter === 'ALL') return true
        if (filter === 'TOEIC') return d.name.includes('TOEIC')
        if (filter === 'IELTS') return d.name.includes('IELTS') || d.name.includes('Academic')
        if (filter === 'OTHER') return !d.name.includes('TOEIC') && !d.name.includes('IELTS')
        return true
    })

    const handleImport = async (deck: VocabDeck) => {
        if (importing) return
        setImporting(deck.name)
        setError('')

        try {
            // Create deck
            const deckId = await createDeck(deck.name, deck.description, deck.color, deck.icon)
            
            if (!deckId || deckId <= 0) {
                throw new Error('Failed to create deck')
            }

            // Import words in chunks to prevent UI freezing
            const CHUNK_SIZE = 50
            let count = 0
            const words = deck.words

            for (let i = 0; i < words.length; i += CHUNK_SIZE) {
                const chunk = words.slice(i, i + CHUNK_SIZE)
                const importedCount = await importWords(deckId, chunk)
                count += importedCount
                // Small delay to let UI breathe
                await new Promise(r => setTimeout(r, 10))
            }
            
            setImported(prev => ({ ...prev, [deck.name]: count }))
            await fetchDecks()
        } catch (e: any) {
            console.error('Import error:', e)
            setError(e.message || 'Import failed')
        }

        setImporting(null)
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">📚 Kho Từ Vựng</h1>
                <p className="text-gray-500 mb-4">{decks.length} bộ từ • {totalWords} từ vựng</p>
                
                <div className="flex gap-2">
                    {['ALL', 'TOEIC', 'IELTS', 'OTHER'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === t 
                                ? 'bg-primary-500 text-white' 
                                : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t === 'ALL' ? 'Tất cả' : t}
                        </button>
                    ))}
                </div>

                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {filteredDecks.map((deck) => {
                    const count = imported[deck.name]
                    const isImporting = importing === deck.name
                    const isDone = count !== undefined

                    return (
                        <div key={deck.name} className="glass rounded-2xl p-6 card-hover flex flex-col h-full relative overflow-hidden group">
                            {/* Decorative background blob */}
                            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700"
                                style={{ backgroundColor: deck.color }} />

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:rotate-6"
                                    style={{ backgroundColor: deck.color + '20' }}>
                                    {deck.icon}
                                </div>

                                {isDone ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide">
                                        <Check size={14} strokeWidth={3} /> Đã thêm
                                    </span>
                                ) : (
                                    <Button size="sm" onClick={() => handleImport(deck)} disabled={!!importing} 
                                        className={isImporting ? "opacity-70" : "shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"}>
                                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        <span className="ml-2 font-semibold">{isImporting ? 'Đang tải...' : 'Tải về'}</span>
                                    </Button>
                                )}
                            </div>

                            <div className="relative z-10 flex-1">
                                <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white leading-tight">{deck.name}</h3>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {deck.name.includes('TOEIC') && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-md text-xs font-bold border border-blue-100 dark:border-blue-800">TOEIC</span>}
                                    {deck.name.includes('IELTS') && <span className="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-md text-xs font-bold border border-red-100 dark:border-red-800">IELTS</span>}
                                    {(deck.name.includes('Advanced') || deck.name.includes('Master') || deck.name.includes('Hell')) && 
                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-md text-xs font-bold border border-purple-100 dark:border-purple-800">HARD</span>
                                    }
                                </div>

                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">{deck.description}</p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-sm">
                                <span className="font-bold" style={{ color: deck.color }}>{deck.words.length} từ vựng</span>
                                <div className="flex -space-x-2">
                                    {/* Mock avatars or visual cue */}
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
