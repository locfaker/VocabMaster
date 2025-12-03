// ============================================
// Import Data Page - Import from Files
// ============================================

import { useState, useRef, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useDeckStore } from '@/store/deckStore'

// ============================================
// Types
// ============================================

interface ImportWord {
    term: string
    definition: string
    example?: string
    phonetic?: string
}

interface ImportResult {
    success: boolean
    count: number
}

// ============================================
// Main Component
// ============================================

export function ImportData() {
    const { createDeck, importWords, fetchDecks } = useDeckStore()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<ImportWord[]>([])
    const [deckName, setDeckName] = useState('')
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const parseFile = useCallback(async (text: string, ext: string): Promise<ImportWord[]> => {
        let words: ImportWord[] = []

        if (ext === 'json') {
            const data = JSON.parse(text)
            if (Array.isArray(data)) {
                words = data.map((item) => ({
                    term: item.term || item.word || item.front || '',
                    definition: item.definition || item.meaning || item.back || '',
                    example: item.example || item.sentence || '',
                    phonetic: item.phonetic || item.pronunciation || '',
                }))
            }
        } else {
            const lines = text.split('\n').filter((line) => line.trim())
            words = lines.map((line) => {
                const parts = line.split(/[,\t;|]/)
                return {
                    term: parts[0]?.trim() || '',
                    definition: parts[1]?.trim() || '',
                    example: parts[2]?.trim() || '',
                    phonetic: parts[3]?.trim() || '',
                }
            })
        }

        return words.filter((w) => w.term && w.definition)
    }, [])

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setError('')
        setResult(null)

        try {
            const text = await selectedFile.text()
            const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
            const words = await parseFile(text, ext)

            setPreview(words.slice(0, 10))

            if (words.length === 0) {
                setError('Không tìm thấy từ vựng hợp lệ trong file')
            }
        } catch {
            setError('Không thể đọc file. Vui lòng kiểm tra định dạng.')
        }
    }, [parseFile])

    const handleImport = useCallback(async () => {
        if (!file || !deckName.trim() || preview.length === 0) return

        setImporting(true)
        setError('')

        try {
            const text = await file.text()
            const ext = file.name.split('.').pop()?.toLowerCase() || ''
            const words = await parseFile(text, ext)

            const deckId = await createDeck(deckName, `Imported from ${file.name}`, '#6C63FF', '📥')
            const count = await importWords(deckId, words)
            await fetchDecks()

            setResult({ success: true, count })
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Import thất bại')
        }

        setImporting(false)
    }, [file, deckName, preview.length, parseFile, createDeck, importWords, fetchDecks])

    const resetForm = useCallback(() => {
        setResult(null)
        setFile(null)
        setPreview([])
        setDeckName('')
    }, [])

    if (result) {
        return <SuccessState count={result.count} deckName={deckName} onReset={resetForm} />
    }

    return (
        <div className="p-8 max-w-2xl">
            <Header />
            <FileUploadSection
                file={file}
                fileInputRef={fileInputRef}
                onFileSelect={handleFileSelect}
            />
            {preview.length > 0 && <PreviewSection preview={preview} />}
            {preview.length > 0 && (
                <DeckNameSection value={deckName} onChange={setDeckName} />
            )}
            {error && <ErrorMessage message={error} />}
            {preview.length > 0 && (
                <ImportButton
                    onClick={handleImport}
                    disabled={!deckName.trim() || importing}
                    importing={importing}
                    wordCount={preview.length}
                />
            )}
            <FormatGuide />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

const Header = memo(function Header() {
    return (
        <div className="flex items-center gap-4 mb-8">
            <Link to="/library" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Import từ vựng</h1>
                <p className="text-gray-500">Hỗ trợ JSON, CSV, TXT</p>
            </div>
        </div>
    )
})

interface SuccessStateProps {
    count: number
    deckName: string
    onReset: () => void
}

const SuccessState = memo(function SuccessState({ count, deckName, onReset }: SuccessStateProps) {
    return (
        <div className="p-8 max-w-2xl">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="text-green-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-green-600 mb-2">Import thành công!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Đã thêm <strong>{count}</strong> từ vào bộ "{deckName}"
                </p>
                <div className="flex gap-4 justify-center">
                    <Link to="/decks">
                        <Button>Xem bộ từ</Button>
                    </Link>
                    <Button variant="secondary" onClick={onReset}>
                        Import thêm
                    </Button>
                </div>
            </div>
        </div>
    )
})

interface FileUploadSectionProps {
    file: File | null
    fileInputRef: React.RefObject<HTMLInputElement>
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const FileUploadSection = memo(function FileUploadSection({
    file,
    fileInputRef,
    onFileSelect,
}: FileUploadSectionProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold mb-4">1. Chọn file</h2>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.txt"
                onChange={onFileSelect}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 hover:border-primary-500 transition-colors"
            >
                <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                <p className="text-gray-600 dark:text-gray-400">
                    {file ? file.name : 'Nhấn để chọn file hoặc kéo thả vào đây'}
                </p>
                <p className="text-sm text-gray-400 mt-1">JSON, CSV, TXT</p>
            </button>
        </div>
    )
})

interface PreviewSectionProps {
    preview: ImportWord[]
}

const PreviewSection = memo(function PreviewSection({ preview }: PreviewSectionProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold mb-4">2. Xem trước ({preview.length} từ đầu tiên)</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {preview.map((word, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="font-medium">{word.term}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">
                            {word.definition}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
})

interface DeckNameSectionProps {
    value: string
    onChange: (value: string) => void
}

const DeckNameSection = memo(function DeckNameSection({ value, onChange }: DeckNameSectionProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold mb-4">3. Đặt tên bộ từ</h2>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="VD: IELTS Vocabulary"
                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
            />
        </div>
    )
})

interface ErrorMessageProps {
    message: string
}

const ErrorMessage = memo(function ErrorMessage({ message }: ErrorMessageProps) {
    return (
        <div className="flex items-center gap-2 text-red-500 mb-4">
            <AlertCircle size={18} />
            <span>{message}</span>
        </div>
    )
})

interface ImportButtonProps {
    onClick: () => void
    disabled: boolean
    importing: boolean
    wordCount: number
}

const ImportButton = memo(function ImportButton({
    onClick,
    disabled,
    importing,
    wordCount,
}: ImportButtonProps) {
    return (
        <Button onClick={onClick} disabled={disabled} className="w-full" size="lg">
            {importing ? (
                <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Đang import...
                </>
            ) : (
                <>
                    <FileText size={18} className="mr-2" />
                    Import {wordCount}+ từ
                </>
            )}
        </Button>
    )
})

const FormatGuide = memo(function FormatGuide() {
    return (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h3 className="font-semibold mb-2">Định dạng file hỗ trợ:</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>
                    <strong>JSON:</strong> {`[{"term": "hello", "definition": "xin chào"}]`}
                </p>
                <p>
                    <strong>CSV/TXT:</strong> hello,xin chào,Hello world!,/həˈloʊ/
                </p>
                <p className="text-xs text-gray-400">
                    Các cột: từ, nghĩa, ví dụ (tùy chọn), phiên âm (tùy chọn)
                </p>
            </div>
        </div>
    )
})
