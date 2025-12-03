// ============================================
// Library Page - Vocabulary Packs
// ============================================

import { useState, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { Download, Check, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useDeckStore } from '@/store/deckStore'
import { getAllVocabularyDecks, getTotalWordCount, VocabDeck } from '@/data'
import { LIBRARY_FILTERS } from '@/constants'

// ============================================
// Types
// ============================================

type FilterType = typeof LIBRARY_FILTERS[number]

// ============================================
// Main Component
// ============================================

export function Library() {
    const { createDeck, importWords, fetchDecks } = useDeckStore()
    const [importing, setImporting] = useState<string | null>(null)
    const [imported, setImported] = useState<Record<string, number>>({})
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<FilterType>('ALL')

    const decks = getAllVocabularyDecks()
    const totalWords = getTotalWordCount()

    const filteredDecks = decks.filter((d) => {
        if (filter === 'ALL') return true
        if (filter === 'TOEIC') return d.name.includes('TOEIC')
        if (filter === 'IELTS') return d.name.includes('IELTS') || d.name.includes('Academic')
        if (filter === 'OTHER') return !d.name.includes('TOEIC') && !d.name.includes('IELTS')
        return true
    })

    const handleImport = useCallback(async (deck: VocabDeck) => {
        if (importing) return
        setImporting(deck.name)
        setError('')

        try {
            const deckId = await createDeck(deck.name, deck.description, deck.color, deck.icon)
            if (!deckId || deckId <= 0) throw new Error('Failed to create deck')

            // Import in chunks
            const CHUNK_SIZE = 50
            let count = 0

            for (let i = 0; i < deck.words.length; i += CHUNK_SIZE) {
                const chunk = deck.words.slice(i, i + CHUNK_SIZE)
                const importedCount = await importWords(deckId, chunk)
                count += importedCount
                await new Promise((r) => setTimeout(r, 10))
            }

            setImported((prev) => ({ ...prev, [deck.name]: count }))
            await fetchDecks()
        } catch (e: unknown) {
            console.error('Import error:', e)
            setError(e instanceof Error ? e.message : 'Import failed')
        }

        setImporting(null)
    }, [importing, createDeck, importWords, fetchDecks])

    return (
        <div className="p-8">
            <Header totalDecks={decks.length} totalWords={totalWords} />
            <FilterTabs filter={filter} onFilterChange={setFilter} />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <DeckGrid
                decks={filteredDecks}
                importing={importing}
                imported={imported}
                onImport={handleImport}
            />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface HeaderProps {
    totalDecks: number
    totalWords: number
}

const Header = memo(function Header({ totalDecks, totalWords }: HeaderProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">📚 Kho Từ Vựng</h1>
                    <p className="text-gray-500">{totalDecks} bộ từ • {totalWords} từ vựng</p>
                </div>
                <Link to="/import">
                    <Button variant="secondary">
                        <Upload size={18} className="mr-2" />
                        Import từ file
                    </Button>
                </Link>
            </div>
        </div>
    )
})

interface FilterTabsProps {
    filter: FilterType
    onFilterChange: (filter: FilterType) => void
}

const FilterTabs = memo(function FilterTabs({ filter, onFilterChange }: FilterTabsProps) {
    const labels: Record<FilterType, string> = {
        ALL: 'Tất cả',
        TOEIC: 'TOEIC',
        IELTS: 'IELTS',
        OTHER: 'Khác',
    }

    return (
        <div className="flex gap-2 mb-6">
            {LIBRARY_FILTERS.map((f) => (
                <button
                    key={f}
                    onClick={() => onFilterChange(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-primary-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    {labels[f]}
                </button>
            ))}
        </div>
    )
})

interface DeckGridProps {
    decks: VocabDeck[]
    importing: string | null
    imported: Record<string, number>
    onImport: (deck: VocabDeck) => void
}

const DeckGrid = memo(function DeckGrid({ decks, importing, imported, onImport }: DeckGridProps) {
    return (
        <div className="grid grid-cols-2 gap-6">
            {decks.map((deck) => (
                <DeckCard
                    key={deck.name}
                    deck={deck}
                    isImporting={importing === deck.name}
                    isImported={deck.name in imported}
                    isDisabled={!!importing}
                    onImport={() => onImport(deck)}
                />
            ))}
        </div>
    )
})

interface DeckCardProps {
    deck: VocabDeck
    isImporting: boolean
    isImported: boolean
    isDisabled: boolean
    onImport: () => void
}

const DeckCard = memo(function DeckCard({
    deck,
    isImporting,
    isImported,
    isDisabled,
    onImport,
}: DeckCardProps) {
    return (
        <div className="glass rounded-2xl p-6 card-hover flex flex-col h-full relative overflow-hidden group">
            {/* Background blob */}
            <div
                className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700"
                style={{ backgroundColor: deck.color }}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:rotate-6"
                    style={{ backgroundColor: deck.color + '20' }}
                >
                    {deck.icon}
                </div>

                {isImported ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide">
                        <Check size={14} strokeWidth={3} /> Đã thêm
                    </span>
                ) : (
                    <Button
                        size="sm"
                        onClick={onImport}
                        disabled={isDisabled}
                        className={isImporting ? 'opacity-70' : 'shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40'}
                    >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        <span className="ml-2 font-semibold">{isImporting ? 'Đang tải...' : 'Tải về'}</span>
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1">
                <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white leading-tight">
                    {deck.name}
                </h3>
                <DeckTags name={deck.name} />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {deck.description}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-sm">
                <span className="font-bold" style={{ color: deck.color }}>
                    {deck.words.length} từ vựng
                </span>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"
                        />
                    ))}
                </div>
            </div>
        </div>
    )
})

interface DeckTagsProps {
    name: string
}

const DeckTags = memo(function DeckTags({ name }: DeckTagsProps) {
    const tags = []

    if (name.includes('TOEIC')) {
        tags.push({ label: 'TOEIC', color: 'blue' })
    }
    if (name.includes('IELTS')) {
        tags.push({ label: 'IELTS', color: 'red' })
    }
    if (name.includes('Advanced') || name.includes('Master') || name.includes('Hell')) {
        tags.push({ label: 'HARD', color: 'purple' })
    }

    if (tags.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(({ label, color }) => (
                <span
                    key={label}
                    className={`px-2 py-0.5 bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400 rounded-md text-xs font-bold border border-${color}-100 dark:border-${color}-800`}
                >
                    {label}
                </span>
            ))}
        </div>
    )
})
