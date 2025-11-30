import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { getAllVocabularyDecks, getTotalWordCount } from '@/data'

export function ImportData() {
    const navigate = useNavigate()
    const [importing, setImporting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [done, setDone] = useState(false)

    const decks = getAllVocabularyDecks()
    const totalWords = getTotalWordCount()

    const handleImport = async () => {
        setImporting(true)
        let imported = 0

        for (const deck of decks) {
            // Create deck
            const result = await window.electronAPI.dbRun(
                'INSERT INTO decks (name, description, color, icon, word_count) VALUES (?, ?, ?, ?, ?)',
                [deck.name, `${deck.words.length} từ vựng`, deck.color, deck.icon, deck.words.length]
            )
            const deckId = result.lastId

            // Insert words
            for (const word of deck.words) {
                const wordResult = await window.electronAPI.dbRun(
                    'INSERT INTO words (deck_id, term, definition, example, phonetic) VALUES (?, ?, ?, ?, ?)',
                    [deckId, word.term, word.definition, word.example || '', word.phonetic || '']
                )
                // Create progress entry
                await window.electronAPI.dbRun(
                    'INSERT INTO progress (word_id) VALUES (?)',
                    [wordResult.lastId]
                )
                imported++
                setProgress(Math.round((imported / totalWords) * 100))
            }
        }

        setDone(true)
        setImporting(false)
    }

    if (done) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Check className="text-green-500" size={40} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Import thành công!</h1>
                <p className="text-gray-500 mb-6">{totalWords} từ vựng đã được thêm vào</p>
                <Button onClick={() => navigate('/')}>Bắt đầu học</Button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Download className="text-primary-500" size={40} />
            </div>

            <h1 className="text-2xl font-bold mb-2">Import dữ liệu từ vựng</h1>
            <p className="text-gray-500 mb-6 text-center max-w-md">
                Thêm {totalWords} từ vựng từ {decks.length} bộ từ chuyên nghiệp vào ứng dụng
            </p>

            <div className="w-full max-w-md space-y-3 mb-8">
                {decks.map((deck) => (
                    <div key={deck.name} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-2xl">{deck.icon}</span>
                        <div className="flex-1">
                            <p className="font-medium">{deck.name}</p>
                            <p className="text-sm text-gray-500">{deck.words.length} từ</p>
                        </div>
                    </div>
                ))}
            </div>

            {importing ? (
                <div className="w-full max-w-md">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Loader2 className="animate-spin text-primary-500" size={20} />
                        <span>Đang import... {progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => navigate('/')}>
                        Bỏ qua
                    </Button>
                    <Button onClick={handleImport}>
                        <Download size={18} className="mr-2" />
                        Import tất cả
                    </Button>
                </div>
            )}
        </div>
    )
}
