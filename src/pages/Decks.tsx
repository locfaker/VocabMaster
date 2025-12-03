// ============================================
// Decks Page - Deck Management
// ============================================

import { useEffect, useState, memo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { useDeckStore } from '@/store/deckStore'
import { useLearningStore } from '@/store/learningStore'
import { DECK_COLORS, DECK_ICONS } from '@/constants'
import type { Deck } from '@/types'

// ============================================
// Types
// ============================================

interface NewDeckForm {
    name: string
    description: string
    color: string
    icon: string
}

const INITIAL_FORM: NewDeckForm = {
    name: '',
    description: '',
    color: DECK_COLORS[0],
    icon: DECK_ICONS[0],
}

// ============================================
// Main Component
// ============================================

export function Decks() {
    const { decks, loading, fetchDecks, createDeck, deleteDeck } = useDeckStore()
    const { fetchTodayWords } = useLearningStore()
    const navigate = useNavigate()

    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newDeck, setNewDeck] = useState<NewDeckForm>(INITIAL_FORM)

    useEffect(() => {
        fetchDecks()
    }, [fetchDecks])

    const filteredDecks = decks.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleCreate = useCallback(async () => {
        if (!newDeck.name.trim()) return
        await createDeck(newDeck.name, newDeck.description, newDeck.color, newDeck.icon)
        setNewDeck(INITIAL_FORM)
        setIsModalOpen(false)
    }, [newDeck, createDeck])

    const handleStudy = useCallback(
        async (e: React.MouseEvent, deckId: number) => {
            e.preventDefault()
            e.stopPropagation()
            await fetchTodayWords(deckId)
            navigate('/learn')
        },
        [fetchTodayWords, navigate]
    )

    const handleDelete = useCallback(
        async (e: React.MouseEvent, deckId: number, deckName: string) => {
            e.preventDefault()
            e.stopPropagation()
            if (confirm(`Xóa bộ từ "${deckName}"? Tất cả từ vựng trong bộ này sẽ bị mất.`)) {
                await deleteDeck(deckId)
            }
        },
        [deleteDeck]
    )

    const updateForm = useCallback((updates: Partial<NewDeckForm>) => {
        setNewDeck((prev) => ({ ...prev, ...updates }))
    }, [])

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Bộ từ của tôi</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} className="mr-2" />
                    Tạo mới
                </Button>
            </div>

            {/* Search */}
            <SearchBar value={search} onChange={setSearch} />

            {/* Content */}
            {loading ? (
                <LoadingState />
            ) : filteredDecks.length === 0 ? (
                <EmptyState hasSearch={!!search} onCreateClick={() => setIsModalOpen(true)} />
            ) : (
                <DeckGrid
                    decks={filteredDecks}
                    onStudy={handleStudy}
                    onDelete={handleDelete}
                />
            )}

            {/* Create Modal */}
            <CreateDeckModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                form={newDeck}
                onUpdate={updateForm}
                onCreate={handleCreate}
            />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
}

const SearchBar = memo(function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="Tìm kiếm..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
        </div>
    )
})

const LoadingState = memo(function LoadingState() {
    return <div className="text-center text-gray-500 py-12">Đang tải...</div>
})

interface EmptyStateProps {
    hasSearch: boolean
    onCreateClick: () => void
}

const EmptyState = memo(function EmptyState({ hasSearch, onCreateClick }: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
                {hasSearch ? 'Không tìm thấy' : 'Chưa có bộ từ nào'}
            </p>
            {!hasSearch && (
                <div className="flex gap-4 justify-center">
                    <Button onClick={onCreateClick}>
                        <Plus size={18} className="mr-2" />
                        Tạo mới
                    </Button>
                    <Link to="/library">
                        <Button variant="secondary">📚 Kho Từ Vựng</Button>
                    </Link>
                </div>
            )}
        </div>
    )
})

interface DeckGridProps {
    decks: Deck[]
    onStudy: (e: React.MouseEvent, id: number) => void
    onDelete: (e: React.MouseEvent, id: number, name: string) => void
}

const DeckGrid = memo(function DeckGrid({ decks, onStudy, onDelete }: DeckGridProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {decks.map((deck) => (
                <DeckCard
                    key={deck.id}
                    deck={deck}
                    onStudy={onStudy}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
})

interface DeckCardProps {
    deck: Deck
    onStudy: (e: React.MouseEvent, id: number) => void
    onDelete: (e: React.MouseEvent, id: number, name: string) => void
}

const DeckCard = memo(function DeckCard({ deck, onStudy, onDelete }: DeckCardProps) {
    return (
        <Link
            to={`/decks/${deck.id}`}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative"
        >
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: deck.color + '20' }}
                >
                    {deck.icon}
                </div>
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: deck.color }}
                />
            </div>
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary-500 transition-colors">
                {deck.name}
            </h3>
            {deck.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{deck.description}</p>
            )}
            <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-400">{deck.word_count} từ</p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => onStudy(e, deck.id)}
                        className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100"
                        title="Học ngay"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                    <button
                        onClick={(e) => onDelete(e, deck.id, deck.name)}
                        className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        title="Xóa bộ từ"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </Link>
    )
})

interface CreateDeckModalProps {
    isOpen: boolean
    onClose: () => void
    form: NewDeckForm
    onUpdate: (updates: Partial<NewDeckForm>) => void
    onCreate: () => void
}

const CreateDeckModal = memo(function CreateDeckModal({
    isOpen,
    onClose,
    form,
    onUpdate,
    onCreate,
}: CreateDeckModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tạo bộ từ mới">
            <div className="space-y-4">
                <Input
                    label="Tên bộ từ"
                    placeholder="VD: IELTS Vocabulary"
                    value={form.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                />
                <Input
                    label="Mô tả (tùy chọn)"
                    placeholder="Mô tả ngắn về bộ từ"
                    value={form.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                />

                {/* Color picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Màu sắc
                    </label>
                    <div className="flex gap-2">
                        {DECK_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => onUpdate({ color })}
                                className={`w-8 h-8 rounded-full transition-transform ${form.color === color
                                        ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                                        : ''
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Icon picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Icon
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {DECK_ICONS.map((icon) => (
                            <button
                                key={icon}
                                onClick={() => onUpdate({ icon })}
                                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${form.icon === icon
                                        ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onCreate}
                        disabled={!form.name.trim()}
                    >
                        Tạo
                    </Button>
                </div>
            </div>
        </Modal>
    )
})
