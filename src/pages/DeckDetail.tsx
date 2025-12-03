// ============================================
// Deck Detail Page
// ============================================

import { useEffect, useState, useCallback, memo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Volume2, Play } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { useDeckStore } from '@/store/deckStore'
import { useLearningStore } from '@/store/learningStore'
import { speakWord } from '@/utils/quiz'
import { WORD_STATUS } from '@/constants'
import type { WordWithProgress, Deck } from '@/types'

// ============================================
// Types
// ============================================

interface NewWordForm {
    term: string
    definition: string
    example: string
    phonetic: string
}

const INITIAL_FORM: NewWordForm = {
    term: '',
    definition: '',
    example: '',
    phonetic: '',
}

// ============================================
// Main Component
// ============================================

export function DeckDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { currentDeck, words, fetchDeck, fetchWords, createWord, deleteWord, deleteDeck } = useDeckStore()
    const { fetchTodayWords } = useLearningStore()

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newWord, setNewWord] = useState<NewWordForm>(INITIAL_FORM)

    useEffect(() => {
        if (id) {
            const deckId = parseInt(id)
            fetchDeck(deckId)
            fetchWords(deckId)
        }
    }, [id, fetchDeck, fetchWords])

    const handleStudy = useCallback(async () => {
        if (!id) return
        await fetchTodayWords(parseInt(id))
        navigate('/learn')
    }, [id, fetchTodayWords, navigate])

    const handleAddWord = useCallback(async () => {
        if (!newWord.term.trim() || !newWord.definition.trim() || !id) return
        await createWord({
            deck_id: parseInt(id),
            term: newWord.term,
            definition: newWord.definition,
            example: newWord.example || undefined,
            phonetic: newWord.phonetic || undefined,
        })
        setNewWord(INITIAL_FORM)
        setIsAddModalOpen(false)
    }, [newWord, id, createWord])

    const handleDeleteDeck = useCallback(async () => {
        if (!id) return
        if (confirm('Xóa bộ từ này? Tất cả từ vựng sẽ bị mất.')) {
            await deleteDeck(parseInt(id))
            navigate('/decks')
        }
    }, [id, deleteDeck, navigate])

    const handleDeleteWord = useCallback(async (wordId: number) => {
        if (!id) return
        if (confirm('Xóa từ này?')) {
            await deleteWord(wordId, parseInt(id))
        }
    }, [id, deleteWord])

    const updateForm = useCallback((updates: Partial<NewWordForm>) => {
        setNewWord((prev) => ({ ...prev, ...updates }))
    }, [])

    if (!currentDeck) {
        return <div className="p-8 text-center text-gray-500">Đang tải...</div>
    }

    const counts = getWordCounts(words)

    return (
        <div className="p-8">
            <DeckHeader
                deck={currentDeck}
                onStudy={handleStudy}
                onDelete={handleDeleteDeck}
            />
            <StatsCards counts={counts} totalWords={words.length} />
            <WordsList
                words={words}
                onAddClick={() => setIsAddModalOpen(true)}
                onDeleteWord={handleDeleteWord}
            />
            <AddWordModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                form={newWord}
                onUpdate={updateForm}
                onAdd={handleAddWord}
            />
        </div>
    )
}

// ============================================
// Helper Functions
// ============================================

function getWordCounts(words: WordWithProgress[]) {
    return {
        new: words.filter((w) => !w.status || w.status === WORD_STATUS.NEW).length,
        learning: words.filter((w) => w.status === WORD_STATUS.LEARNING || w.status === WORD_STATUS.REVIEW).length,
        mastered: words.filter((w) => w.status === WORD_STATUS.MASTERED).length,
    }
}

// ============================================
// Sub-components
// ============================================

interface DeckHeaderProps {
    deck: Deck
    onStudy: () => void
    onDelete: () => void
}

const DeckHeader = memo(function DeckHeader({ deck, onStudy, onDelete }: DeckHeaderProps) {
    return (
        <div className="flex items-center gap-4 mb-6">
            <Link to="/decks" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft size={20} />
            </Link>
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: deck.color + '20' }}
            >
                {deck.icon}
            </div>
            <div className="flex-1">
                <h1 className="text-2xl font-bold">{deck.name}</h1>
                {deck.description && <p className="text-gray-500">{deck.description}</p>}
            </div>
            <Button onClick={onStudy}>
                <Play size={18} className="mr-2" />
                Học ngay
            </Button>
            <Button variant="danger" onClick={onDelete}>
                <Trash2 size={18} />
            </Button>
        </div>
    )
})

interface StatsCardsProps {
    counts: { new: number; learning: number; mastered: number }
    totalWords: number
}

const StatsCards = memo(function StatsCards({ counts, totalWords }: StatsCardsProps) {
    const stats = [
        { value: totalWords, label: 'Tổng', color: 'gray' },
        { value: counts.new, label: 'Mới', color: 'blue' },
        { value: counts.learning, label: 'Đang học', color: 'yellow' },
        { value: counts.mastered, label: 'Thuộc', color: 'green' },
    ]

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(({ value, label, color }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${color !== 'gray' ? `text-${color}-500` : ''}`}>
                        {value}
                    </p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            ))}
        </div>
    )
})

interface WordsListProps {
    words: WordWithProgress[]
    onAddClick: () => void
    onDeleteWord: (id: number) => void
}

const WordsList = memo(function WordsList({ words, onAddClick, onDeleteWord }: WordsListProps) {
    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Danh sách từ ({words.length})</h2>
                <Button onClick={onAddClick}>
                    <Plus size={18} className="mr-2" />
                    Thêm từ
                </Button>
            </div>

            {words.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-500 mb-4">Chưa có từ nào</p>
                    <Button onClick={onAddClick}>
                        <Plus size={18} className="mr-2" />
                        Thêm từ đầu tiên
                    </Button>
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {words.map((word) => (
                        <WordItem key={word.id} word={word} onDelete={onDeleteWord} />
                    ))}
                </div>
            )}
        </>
    )
})

interface WordItemProps {
    word: WordWithProgress
    onDelete: (id: number) => void
}

const WordItem = memo(function WordItem({ word, onDelete }: WordItemProps) {
    const handleSpeak = useCallback(() => speakWord(word.term), [word.term])

    const statusConfig = {
        mastered: { bg: 'bg-green-100', text: 'text-green-600', label: 'Thuộc' },
        learning: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Đang học' },
        review: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Đang học' },
        new: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Mới' },
    }

    const status = (word.status as keyof typeof statusConfig) || 'new'
    const config = statusConfig[status]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-4 group">
            <button
                onClick={handleSpeak}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
                <Volume2 size={18} className="text-gray-400" />
            </button>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{word.term}</span>
                    {word.phonetic && <span className="text-sm text-gray-400">{word.phonetic}</span>}
                </div>
                <p className="text-gray-500 truncate">{word.definition}</p>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </div>
            <button
                onClick={() => onDelete(word.id)}
                className="p-2 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Trash2 size={18} className="text-red-500" />
            </button>
        </div>
    )
})

interface AddWordModalProps {
    isOpen: boolean
    onClose: () => void
    form: NewWordForm
    onUpdate: (updates: Partial<NewWordForm>) => void
    onAdd: () => void
}

const AddWordModal = memo(function AddWordModal({
    isOpen,
    onClose,
    form,
    onUpdate,
    onAdd,
}: AddWordModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm từ mới">
            <div className="space-y-4">
                <Input
                    label="Từ vựng"
                    placeholder="VD: abandon"
                    value={form.term}
                    onChange={(e) => onUpdate({ term: e.target.value })}
                />
                <Input
                    label="Nghĩa"
                    placeholder="VD: từ bỏ, bỏ rơi"
                    value={form.definition}
                    onChange={(e) => onUpdate({ definition: e.target.value })}
                />
                <Input
                    label="Ví dụ (tùy chọn)"
                    placeholder="VD: They abandoned the project."
                    value={form.example}
                    onChange={(e) => onUpdate({ example: e.target.value })}
                />
                <Input
                    label="Phiên âm (tùy chọn)"
                    placeholder="VD: /əˈbændən/"
                    value={form.phonetic}
                    onChange={(e) => onUpdate({ phonetic: e.target.value })}
                />
                <div className="flex gap-3 pt-4">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={onAdd}
                        disabled={!form.term.trim() || !form.definition.trim()}
                    >
                        Thêm
                    </Button>
                </div>
            </div>
        </Modal>
    )
})
