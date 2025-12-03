// ============================================
// Learn Page - Flashcard Study Mode
// ============================================

import { useEffect, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Volume2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useLearningStore } from '@/store/learningStore'
import { speakWord } from '@/utils/quiz'
import type { Quality } from '@/types'

// ============================================
// Main Component
// ============================================

export function Learn() {
    const {
        todayWords,
        currentIndex,
        isFlipped,
        sessionComplete,
        currentDeckId,
        fetchTodayWords,
        flipCard,
        answerCard,
        resetSession,
    } = useLearningStore()

    const currentWord = todayWords[currentIndex]

    // Fetch words on mount if empty
    useEffect(() => {
        if (todayWords.length === 0) {
            fetchTodayWords()
        }
    }, [todayWords.length, fetchTodayWords])

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!currentWord || sessionComplete) return

        if (e.code === 'Space' && !isFlipped) {
            e.preventDefault()
            flipCard()
        } else if (isFlipped) {
            const keyMap: Record<string, Quality> = { '1': 1, '2': 2, '3': 3 }
            const quality = keyMap[e.key]
            if (quality) answerCard(quality)
        }
    }, [currentWord, isFlipped, sessionComplete, flipCard, answerCard])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Handle restart
    const handleRestart = useCallback(() => {
        resetSession()
        fetchTodayWords(currentDeckId ?? undefined)
    }, [resetSession, fetchTodayWords, currentDeckId])

    // Empty or complete state
    if (sessionComplete || todayWords.length === 0) {
        return (
            <EmptyState
                isEmpty={todayWords.length === 0}
                onRestart={handleRestart}
            />
        )
    }

    const progress = ((currentIndex + 1) / todayWords.length) * 100

    return (
        <div className="h-full flex flex-col p-8">
            {/* Header */}
            <Header currentIndex={currentIndex} total={todayWords.length} />

            {/* Progress bar */}
            <ProgressBar progress={progress} />

            {/* Card */}
            <div className="flex-1 flex items-center justify-center">
                <FlashCard
                    word={currentWord}
                    isFlipped={isFlipped}
                    onFlip={flipCard}
                />
            </div>

            {/* Answer buttons */}
            {isFlipped && <AnswerButtons onAnswer={answerCard} />}

            {/* Keyboard hints */}
            <KeyboardHints isFlipped={isFlipped} />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface EmptyStateProps {
    isEmpty: boolean
    onRestart: () => void
}

const EmptyState = memo(function EmptyState({ isEmpty, onRestart }: EmptyStateProps) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-6xl mb-4">{isEmpty ? '📚' : '🎉'}</div>
            <h1 className="text-2xl font-bold mb-2">
                {isEmpty ? 'Chưa có từ để học' : 'Hoàn thành!'}
            </h1>
            <p className="text-gray-500 mb-6 text-center">
                {isEmpty
                    ? 'Hãy thêm từ vựng từ Kho Từ Vựng hoặc tạo bộ từ mới'
                    : 'Bạn đã hoàn thành phiên học hôm nay!'}
            </p>
            <div className="flex gap-4">
                <Link to="/">
                    <Button variant="secondary">
                        <ArrowLeft size={18} className="mr-2" /> Về trang chủ
                    </Button>
                </Link>
                {isEmpty ? (
                    <Link to="/library">
                        <Button>📚 Kho Từ Vựng</Button>
                    </Link>
                ) : (
                    <Button onClick={onRestart}>
                        <RotateCcw size={18} className="mr-2" /> Học lại
                    </Button>
                )}
            </div>
        </div>
    )
})

interface HeaderProps {
    currentIndex: number
    total: number
}

const Header = memo(function Header({ currentIndex, total }: HeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                <ArrowLeft size={20} /> Quay lại
            </Link>
            <div className="text-gray-500 font-medium">
                {currentIndex + 1} / {total}
            </div>
        </div>
    )
})

interface ProgressBarProps {
    progress: number
}

const ProgressBar = memo(function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-8">
            <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
})

interface FlashCardProps {
    word: {
        term: string
        phonetic: string | null
        definition: string
        example: string | null
    }
    isFlipped: boolean
    onFlip: () => void
}

const FlashCard = memo(function FlashCard({ word, isFlipped, onFlip }: FlashCardProps) {
    const handleSpeak = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        speakWord(word.term)
    }, [word.term])

    return (
        <div className="w-full max-w-lg">
            <div
                onClick={() => !isFlipped && onFlip()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
            >
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                    {word.term}
                </h2>
                {word.phonetic && (
                    <p className="text-gray-500 text-lg mb-4">{word.phonetic}</p>
                )}
                <button
                    onClick={handleSpeak}
                    className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full hover:bg-primary-200 transition-colors mb-4"
                    aria-label="Speak word"
                >
                    <Volume2 className="text-primary-500" size={24} />
                </button>

                {isFlipped ? (
                    <div className="text-center mt-4 border-t pt-4 w-full">
                        <p className="text-xl text-gray-700 dark:text-gray-200 mb-2">
                            {word.definition}
                        </p>
                        {word.example && (
                            <p className="text-gray-500 italic">"{word.example}"</p>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm mt-4">Nhấn để xem nghĩa</p>
                )}
            </div>
        </div>
    )
})

interface AnswerButtonsProps {
    onAnswer: (quality: Quality) => void
}

const AnswerButtons = memo(function AnswerButtons({ onAnswer }: AnswerButtonsProps) {
    const buttons = [
        { quality: 1 as Quality, emoji: '😟', label: 'Chưa nhớ', color: 'red' },
        { quality: 2 as Quality, emoji: '🤔', label: 'Tạm nhớ', color: 'yellow' },
        { quality: 3 as Quality, emoji: '😊', label: 'Đã thuộc', color: 'green' },
    ]

    return (
        <div className="flex justify-center gap-4 mt-8">
            {buttons.map(({ quality, emoji, label, color }) => (
                <button
                    key={quality}
                    onClick={() => onAnswer(quality)}
                    className={`flex flex-col items-center gap-1 px-8 py-4 bg-${color}-100 dark:bg-${color}-900/30 rounded-xl hover:bg-${color}-200 transition-colors`}
                >
                    <span className="text-2xl">{emoji}</span>
                    <span className={`font-medium text-${color}-600`}>{label}</span>
                    <span className="text-xs text-gray-500">[{quality}]</span>
                </button>
            ))}
        </div>
    )
})

interface KeyboardHintsProps {
    isFlipped: boolean
}

const KeyboardHints = memo(function KeyboardHints({ isFlipped }: KeyboardHintsProps) {
    return (
        <div className="text-center text-sm text-gray-400 mt-4">
            {isFlipped ? '[1] Chưa nhớ • [2] Tạm nhớ • [3] Đã thuộc' : '[Space] Lật thẻ'}
        </div>
    )
})
