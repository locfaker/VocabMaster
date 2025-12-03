// ============================================
// Typing Page - Spelling Practice Mode
// ============================================

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Volume2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useLearningStore } from '@/store/learningStore'
import { generateTypingChallenges, checkTypingAnswer, speakWord } from '@/utils/quiz'
import { getToday } from '@/utils/date'
import type { TypingChallenge } from '@/types'
import type { TypingResult, QuizScore } from '@/types/learning'

// ============================================
// Main Component
// ============================================

export function Typing() {
    const { todayWords, fetchTodayWords } = useLearningStore()
    const [challenges, setChallenges] = useState<TypingChallenge[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [showResult, setShowResult] = useState(false)
    const [result, setResult] = useState<TypingResult | null>(null)
    const [score, setScore] = useState<QuizScore>({ correct: 0, total: 0 })
    const [sessionComplete, setSessionComplete] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load challenges
    useEffect(() => {
        fetchTodayWords()
    }, [fetchTodayWords])

    useEffect(() => {
        if (todayWords.length > 0) {
            setChallenges(generateTypingChallenges(todayWords, 10))
        }
    }, [todayWords])

    // Focus input
    useEffect(() => {
        inputRef.current?.focus()
    }, [currentIndex, showResult])

    const currentChallenge = challenges[currentIndex]

    // Handle form submit
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        if (!userInput.trim() || showResult || !currentChallenge) return

        const checkResult = checkTypingAnswer(userInput, currentChallenge.word.term)
        setResult(checkResult)
        setShowResult(true)

        setScore((prev) => ({
            correct: prev.correct + (checkResult.isCorrect ? 1 : 0),
            total: prev.total + 1,
        }))
    }, [userInput, showResult, currentChallenge])

    // Move to next challenge
    const nextChallenge = useCallback(async () => {
        if (currentIndex < challenges.length - 1) {
            setCurrentIndex((prev) => prev + 1)
            setUserInput('')
            setShowResult(false)
            setResult(null)
        } else {
            setSessionComplete(true)
            await window.electronAPI.dbRun(
                'UPDATE stats SET typing_score = typing_score + ? WHERE date = ?',
                [score.correct, getToday()]
            )
        }
    }, [currentIndex, challenges.length, score.correct])

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (showResult && (e.code === 'Enter' || e.code === 'Space')) {
            e.preventDefault()
            nextChallenge()
        }
    }, [showResult, nextChallenge])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Restart session
    const restartSession = useCallback(() => {
        setSessionComplete(false)
        setCurrentIndex(0)
        setScore({ correct: 0, total: 0 })
        setUserInput('')
        setShowResult(false)
        setResult(null)
        setChallenges(generateTypingChallenges(todayWords, 10))
    }, [todayWords])

    // No challenges
    if (challenges.length === 0) {
        return <EmptyState />
    }

    // Session complete
    if (sessionComplete) {
        return <CompleteState score={score} onRestart={restartSession} />
    }

    const progress = ((currentIndex + 1) / challenges.length) * 100

    return (
        <div className="h-full flex flex-col p-8">
            <Header score={score} currentIndex={currentIndex} total={challenges.length} />
            <ProgressBar progress={progress} />

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl">
                    <ChallengeCard challenge={currentChallenge} />

                    <TypingInput
                        ref={inputRef}
                        value={userInput}
                        onChange={setUserInput}
                        onSubmit={handleSubmit}
                        disabled={showResult}
                        result={result}
                    />

                    {showResult && result && (
                        <ResultFeedback
                            result={result}
                            correctAnswer={currentChallenge.word.term}
                        />
                    )}

                    <ActionButton
                        showResult={showResult}
                        hasInput={!!userInput.trim()}
                        isLast={currentIndex >= challenges.length - 1}
                        onSubmit={handleSubmit}
                        onNext={nextChallenge}
                    />
                </div>
            </div>

            <KeyboardHints showResult={showResult} />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

const EmptyState = memo(function EmptyState() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-6xl mb-4">⌨️</div>
            <h1 className="text-2xl font-bold mb-2">Chưa có từ để luyện</h1>
            <p className="text-gray-500 mb-6">Hãy thêm từ vựng để bắt đầu luyện gõ</p>
            <Link to="/library">
                <Button>📚 Thêm từ vựng</Button>
            </Link>
        </div>
    )
})

interface CompleteStateProps {
    score: QuizScore
    onRestart: () => void
}

const CompleteState = memo(function CompleteState({ score, onRestart }: CompleteStateProps) {
    const percentage = Math.round((score.correct / score.total) * 100)
    const emoji = percentage >= 80 ? '🎯' : percentage >= 50 ? '👍' : '💪'
    const colorClass = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-primary-500' : 'bg-yellow-500'

    return (
        <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-6xl mb-4">{emoji}</div>
            <h1 className="text-3xl font-bold mb-2">Hoàn thành!</h1>
            <p className="text-xl text-gray-600 mb-6">
                Bạn gõ đúng <span className="font-bold text-primary-500">{score.correct}/{score.total}</span> từ ({percentage}%)
            </p>
            <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
                <div
                    className={`h-full rounded-full transition-all ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="flex gap-4">
                <Link to="/">
                    <Button variant="secondary">
                        <ArrowLeft size={18} className="mr-2" /> Về trang chủ
                    </Button>
                </Link>
                <Button onClick={onRestart}>
                    <RotateCcw size={18} className="mr-2" /> Luyện lại
                </Button>
            </div>
        </div>
    )
})

interface HeaderProps {
    score: QuizScore
    currentIndex: number
    total: number
}

const Header = memo(function Header({ score, currentIndex, total }: HeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                <ArrowLeft size={20} /> Quay lại
            </Link>
            <div className="flex items-center gap-4">
                <span className="text-green-500 font-medium">✓ {score.correct}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{currentIndex + 1}/{total}</span>
            </div>
        </div>
    )
})

interface ProgressBarProps {
    progress: number
}

const ProgressBar = memo(function ProgressBar({ progress }: ProgressBarProps) {
    return (
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8">
            <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
})

interface ChallengeCardProps {
    challenge: TypingChallenge
}

const ChallengeCard = memo(function ChallengeCard({ challenge }: ChallengeCardProps) {
    const handleSpeak = useCallback(() => {
        speakWord(challenge.word.term)
    }, [challenge.word.term])

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-6 text-center">
            <p className="text-sm text-gray-500 mb-4">Gõ từ tiếng Anh có nghĩa:</p>
            <p className="text-2xl font-medium text-gray-800 dark:text-white mb-4">
                {challenge.hint}
            </p>
            <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-mono tracking-widest text-primary-500">
                    {challenge.maskedWord}
                </span>
                <button
                    onClick={handleSpeak}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                    <Volume2 size={20} className="text-gray-400" />
                </button>
            </div>
        </div>
    )
})

interface TypingInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: (e: React.FormEvent) => void
    disabled: boolean
    result: TypingResult | null
}

const TypingInput = memo(
    // eslint-disable-next-line react/display-name
    React.forwardRef<HTMLInputElement, TypingInputProps>(
        ({ value, onChange, onSubmit, disabled, result }, ref) => {
            let borderClass = 'border-gray-200 dark:border-gray-700 focus:border-primary-500'
            if (result) {
                borderClass = result.isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }

            return (
                <form onSubmit={onSubmit}>
                    <div className="relative">
                        <input
                            ref={ref}
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={disabled}
                            placeholder="Gõ từ vựng..."
                            className={`w-full px-6 py-4 text-xl text-center rounded-xl border-2 outline-none transition-all dark:bg-gray-800 ${borderClass}`}
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                        />
                        {result && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {result.isCorrect ? (
                                    <CheckCircle className="text-green-500" size={24} />
                                ) : (
                                    <XCircle className="text-red-500" size={24} />
                                )}
                            </div>
                        )}
                    </div>
                </form>
            )
        }
    )
)

import React from 'react'

interface ResultFeedbackProps {
    result: TypingResult
    correctAnswer: string
}

const ResultFeedback = memo(function ResultFeedback({ result, correctAnswer }: ResultFeedbackProps) {
    const bgClass = result.isCorrect
        ? 'bg-green-100 dark:bg-green-900/30'
        : 'bg-red-100 dark:bg-red-900/30'
    const textClass = result.isCorrect ? 'text-green-600' : 'text-red-600'

    return (
        <div className={`mt-4 p-4 rounded-xl text-center ${bgClass}`}>
            <p className={`font-medium ${textClass}`}>{result.feedback}</p>
            {!result.isCorrect && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Đáp án đúng: <span className="font-bold">{correctAnswer}</span>
                </p>
            )}
            {result.similarity > 0 && result.similarity < 100 && (
                <p className="text-sm text-gray-500 mt-1">
                    Độ chính xác: {result.similarity}%
                </p>
            )}
        </div>
    )
})

interface ActionButtonProps {
    showResult: boolean
    hasInput: boolean
    isLast: boolean
    onSubmit: (e: React.FormEvent) => void
    onNext: () => void
}

const ActionButton = memo(function ActionButton({
    showResult,
    hasInput,
    isLast,
    onSubmit,
    onNext,
}: ActionButtonProps) {
    return (
        <div className="mt-6 text-center">
            {showResult ? (
                <Button onClick={onNext} size="lg">
                    {isLast ? 'Xem kết quả' : 'Từ tiếp theo'} →
                </Button>
            ) : (
                <Button type="submit" onClick={onSubmit} size="lg" disabled={!hasInput}>
                    Kiểm tra
                </Button>
            )}
        </div>
    )
})

interface KeyboardHintsProps {
    showResult: boolean
}

const KeyboardHints = memo(function KeyboardHints({ showResult }: KeyboardHintsProps) {
    return (
        <div className="text-center text-sm text-gray-400">
            {showResult ? '[Enter/Space] Tiếp tục' : '[Enter] Kiểm tra'}
        </div>
    )
})
