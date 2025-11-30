import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Volume2, Play } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { useDeckStore } from '@/store/deckStore'
import { useLearningStore } from '@/store/learningStore'

export function DeckDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { currentDeck, words, fetchDeck, fetchWords, createWord, deleteWord, deleteDeck } = useDeckStore()
    const { startSession } = useLearningStore()

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newWord, setNewWord] = useState({ term: '', definition: '', example: '', phonetic: '' })

    useEffect(() => {
        if (id) {
            const deckId = parseInt(id)
            fetchDeck(deckId)
            fetchWords(deckId)
        }
    }, [id])

    const handleStudy = async () => {
        if (!id) return
        await startSession(parseInt(id))
        navigate('/learn')
    }

    const handleAddWord = async () => {
        if (!newWord.term.trim() || !newWord.definition.trim() || !id) return
        await createWord({
            deck_id: parseInt(id),
            term: newWord.term,
            definition: newWord.definition,
            example: newWord.example || undefined,
            phonetic: newWord.phonetic || undefined
        })
        setNewWord({ term: '', definition: '', example: '', phonetic: '' })
        setIsAddModalOpen(false)
    }

    const handleDeleteDeck = async () => {
        if (!id) return
        if (confirm('Xóa bộ từ này? Tất cả từ vựng sẽ bị mất.')) {
            await deleteDeck(parseInt(id))
            navigate('/decks')
        }
    }

    const handleDeleteWord = async (wordId: number) => {
        if (!id) return
        if (confirm('Xóa từ này?')) {
            await deleteWord(wordId, parseInt(id))
        }
    }

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        speechSynthesis.speak(utterance)
    }

    if (!currentDeck) {
        return <div className="p-8 text-center text-gray-500">Đang tải...</div>
    }

    const newCount = words.filter(w => !w.status || w.status === 'new').length
    const learningCount = words.filter(w => w.status === 'learning' || w.status === 'review').length
    const masteredCount = words.filter(w => w.status === 'mastered').length

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/decks" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <ArrowLeft size={20} />
                </Link>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: currentDeck.color + '20' }}>{currentDeck.icon}</div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{currentDeck.name}</h1>
                    {currentDeck.description && <p className="text-gray-500">{currentDeck.description}</p>}
                </div>
                <Button onClick={handleStudy}><Play size={18} className="mr-2" />Học ngay</Button>
                <Button variant="danger" onClick={handleDeleteDeck}><Trash2 size={18} /></Button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold">{words.length}</p>
                    <p className="text-sm text-gray-500">Tổng</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">{newCount}</p>
                    <p className="text-sm text-gray-500">Mới</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{learningCount}</p>
                    <p className="text-sm text-gray-500">Đang học</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-500">{masteredCount}</p>
                    <p className="text-sm text-gray-500">Thuộc</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Danh sách từ ({words.length})</h2>
                <Button onClick={() => setIsAddModalOpen(true)}><Plus size={18} className="mr-2" />Thêm từ</Button>
            </div>

            {words.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-500 mb-4">Chưa có từ nào</p>
                    <Button onClick={() => setIsAddModalOpen(true)}><Plus size={18} className="mr-2" />Thêm từ đầu tiên</Button>
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {words.map((word) => (
                        <div key={word.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-4 group">
                            <button onClick={() => speak(word.term)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <Volume2 size={18} className="text-gray-400" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{word.term}</span>
                                    {word.phonetic && <span className="text-sm text-gray-400">{word.phonetic}</span>}
                                </div>
                                <p className="text-gray-500 truncate">{word.definition}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${word.status === 'mastered' ? 'bg-green-100 text-green-600' :
                                    word.status === 'learning' || word.status === 'review' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {word.status === 'mastered' ? 'Thuộc' : word.status === 'learning' || word.status === 'review' ? 'Đang học' : 'Mới'}
                            </div>
                            <button onClick={() => handleDeleteWord(word.id)}
                                className="p-2 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} className="text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm từ mới">
                <div className="space-y-4">
                    <Input label="Từ vựng" placeholder="VD: abandon" value={newWord.term}
                        onChange={(e) => setNewWord({ ...newWord, term: e.target.value })} />
                    <Input label="Nghĩa" placeholder="VD: từ bỏ, bỏ rơi" value={newWord.definition}
                        onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })} />
                    <Input label="Ví dụ (tùy chọn)" placeholder="VD: They abandoned the project." value={newWord.example}
                        onChange={(e) => setNewWord({ ...newWord, example: e.target.value })} />
                    <Input label="Phiên âm (tùy chọn)" placeholder="VD: /əˈbændən/" value={newWord.phonetic}
                        onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })} />
                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
                        <Button className="flex-1" onClick={handleAddWord} disabled={!newWord.term.trim() || !newWord.definition.trim()}>Thêm</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
