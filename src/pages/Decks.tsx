import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Play } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { useDeckStore } from '@/store/deckStore'
import { useLearningStore } from '@/store/learningStore'

const COLORS = ['#6C63FF', '#FF6B6B', '#4CAF50', '#FF9800', '#2196F3', '#9C27B0']
const ICONS = ['📚', '📕', '📗', '📘', '📙', '🎯', '💼', '🌍', '🔬', '💻']

export function Decks() {
    const { decks, loading, fetchDecks, createDeck } = useDeckStore()
    const { startSession } = useLearningStore()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newDeck, setNewDeck] = useState({ name: '', description: '', color: COLORS[0], icon: ICONS[0] })

    useEffect(() => {
        fetchDecks()
    }, [])

    const filteredDecks = decks.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

    const handleCreate = async () => {
        if (!newDeck.name.trim()) return
        await createDeck(newDeck.name, newDeck.description, newDeck.color, newDeck.icon)
        setNewDeck({ name: '', description: '', color: COLORS[0], icon: ICONS[0] })
        setIsModalOpen(false)
    }

    const handleStudy = async (e: React.MouseEvent, deckId: number) => {
        e.preventDefault() // Prevent Link navigation
        e.stopPropagation()
        await startSession(deckId)
        navigate('/learn')
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Bộ từ của tôi</h1>
                <Button onClick={() => setIsModalOpen(true)}><Plus size={18} className="mr-2" />Tạo mới</Button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-12">Đang tải...</div>
            ) : filteredDecks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">{search ? 'Không tìm thấy' : 'Chưa có bộ từ nào'}</p>
                    {!search && (
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => setIsModalOpen(true)}><Plus size={18} className="mr-2" />Tạo mới</Button>
                            <Link to="/library"><Button variant="secondary">📚 Kho Từ Vựng</Button></Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filteredDecks.map((deck) => (
                        <Link key={deck.id} to={`/decks/${deck.id}`}
                            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: deck.color + '20' }}>{deck.icon}</div>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.color }} />
                            </div>
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary-500 transition-colors">{deck.name}</h3>
                            {deck.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{deck.description}</p>}
                            
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-gray-400">{deck.word_count} từ</p>
                                <button 
                                    onClick={(e) => handleStudy(e, deck.id)}
                                    className="p-2 rounded-full bg-primary-50 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-100"
                                    title="Học ngay"
                                >
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tạo bộ từ mới">
                <div className="space-y-4">
                    <Input label="Tên bộ từ" placeholder="VD: IELTS Vocabulary" value={newDeck.name}
                        onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })} />
                    <Input label="Mô tả (tùy chọn)" placeholder="Mô tả ngắn về bộ từ" value={newDeck.description}
                        onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Màu sắc</label>
                        <div className="flex gap-2">
                            {COLORS.map((color) => (
                                <button key={color} onClick={() => setNewDeck({ ...newDeck, color })}
                                    className={`w-8 h-8 rounded-full transition-transform ${newDeck.color === color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                                    style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {ICONS.map((icon) => (
                                <button key={icon} onClick={() => setNewDeck({ ...newDeck, icon })}
                                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${newDeck.icon === icon ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                                        }`}>{icon}</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button className="flex-1" onClick={handleCreate} disabled={!newDeck.name.trim()}>Tạo</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
