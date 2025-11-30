import { useEffect, useCallback, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Volume2, Keyboard, Flame } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useLearningStore } from '@/store/learningStore'
import type { Quality } from '@/types'

const HELL_MODE_TIME = 10 // 10 seconds per card

export function Learn() {
    const {
        todayWords, currentIndex, isFlipped, sessionComplete, isHellMode,
        fetchTodayWords, flipCard, answerCard, resetSession, setHellMode
    } = useLearningStore()

    const [isTypingMode, setIsTypingMode] = useState(false)
    const [userAnswer, setUserAnswer] = useState('')
    const [checkResult, setCheckResult] = useState<'correct' | 'incorrect' | null>(null)
    const [timeLeft, setTimeLeft] = useState(HELL_MODE_TIME)
    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        fetchTodayWords()
        // Reset Hell Mode when entering/leaving
        return () => setHellMode(false)
    }, [])

    // Timer logic for Hell Mode
    useEffect(() => {
        if (isHellMode && !isFlipped && !sessionComplete && todayWords.length > 0) {
            setTimeLeft(HELL_MODE_TIME)
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Timeout! Auto fail
                        clearInterval(timerRef.current!)
                        handleTimeout()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [currentIndex, isHellMode, isFlipped, sessionComplete, todayWords.length])

    // Reset input when moving to next card
    useEffect(() => {
        setUserAnswer('')
        setCheckResult(null)
        // Focus input if in typing mode and new card (not flipped)
        if (isTypingMode && !isFlipped) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [currentIndex, isTypingMode, isFlipped])

    const currentWord = todayWords[currentIndex]

    const handleTimeout = () => {
        setCheckResult('incorrect')
        flipCard()
        // Optionally auto-advance or force user to acknowledge failure
    }

    const handleAnswer = async (quality: Quality) => {
        await answerCard(quality)
    }

    const checkAnswer = () => {
        if (!currentWord) return
        const correct = currentWord.term.trim().toLowerCase() === userAnswer.trim().toLowerCase()
        setCheckResult(correct ? 'correct' : 'incorrect')
        
        // Stop timer if correct/incorrect
        if (timerRef.current) clearInterval(timerRef.current)
        
        flipCard()
    }

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        speechSynthesis.speak(utterance)
    }

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!currentWord || sessionComplete) return

        // If typing mode is active and card is NOT flipped (inputting)
        if (isTypingMode && !isFlipped) {
            if (e.key === 'Enter') {
                e.preventDefault()
                checkAnswer()
            }
            return // Don't handle other shortcuts in input mode
        }

        if (e.code === 'Space' && !isFlipped) {
            e.preventDefault()
            flipCard()
        } else if (isFlipped) {
            if (e.key === '1') handleAnswer(1)
            else if (e.key === '2') handleAnswer(2)
            else if (e.key === '3') handleAnswer(3)
        }
    }, [currentWord, isFlipped, sessionComplete, isTypingMode, userAnswer])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Session complete or no words
    if (sessionComplete || todayWords.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-6xl mb-4">{todayWords.length === 0 ? '📚' : '🎉'}</div>
                <h1 className="text-2xl font-bold mb-2">
                    {todayWords.length === 0 ? 'Chưa có từ để học' : 'Hoàn thành!'}
                </h1>
                <p className="text-gray-500 mb-6 text-center">
                    {todayWords.length === 0
                        ? 'Hãy thêm từ vựng từ Kho Từ Vựng hoặc tạo bộ từ mới'
                        : 'Bạn đã hoàn thành phiên học hôm nay!'}
                </p>
                <div className="flex gap-4">
                    <Link to="/">
                        <Button variant="secondary">
                            <ArrowLeft size={18} className="mr-2" /> Về trang chủ
                        </Button>
                    </Link>
                    {todayWords.length === 0 ? (
                        <Link to="/library">
                            <Button>📚 Kho Từ Vựng</Button>
                        </Link>
                    ) : (
                        <Button onClick={() => { resetSession(); fetchTodayWords(); }}>
                            <RotateCcw size={18} className="mr-2" /> Học lại
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className={`h-full flex flex-col p-8 transition-colors duration-500 ${isHellMode ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
            {/* Hell Mode Timer Bar */}
            {isHellMode && !isFlipped && (
                <div className="fixed top-0 left-0 w-full h-2 bg-gray-200">
                    <div 
                        className="h-full bg-red-600 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / HELL_MODE_TIME) * 100}%` }}
                    />
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
                    <ArrowLeft size={20} /> Quay lại
                </Link>
                <div className="flex items-center gap-4">
                    {/* Hell Mode Toggle */}
                    <button
                        onClick={() => {
                            setHellMode(!isHellMode)
                            if (!isHellMode) setIsTypingMode(true) // Auto-enable typing for Hell Mode
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                            isHellMode
                                ? 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title="Chế độ ĐỊA NGỤC: Áp lực thời gian, Phạt nặng!"
                    >
                        <Flame size={18} className={isHellMode ? 'fill-white' : ''} />
                        {isHellMode ? 'HELL MODE ON' : 'Hell Mode'}
                    </button>

                    <button
                        onClick={() => {
                            setIsTypingMode(!isTypingMode)
                            setUserAnswer('')
                            setCheckResult(null)
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isTypingMode
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        title="Chế độ gõ để trả lời (Luyện viết)"
                    >
                        <Keyboard size={18} />
                        {isTypingMode ? 'Chế độ Gõ' : 'Chế độ Thẻ'}
                    </button>
                    <div className="text-gray-500 font-medium">{currentIndex + 1} / {todayWords.length}</div>
                </div>
            </div>

            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-8">
                <div className={`h-full rounded-full transition-all ${isHellMode ? 'bg-red-600' : 'bg-primary-500'}`}
                    style={{ width: `${((currentIndex + 1) / todayWords.length) * 100}%` }} />
            </div>

            <div className="flex-1 flex items-center justify-center relative">
                {isHellMode && !isFlipped && (
                    <div className="absolute -top-12 text-4xl font-bold text-red-600 animate-bounce">
                        {timeLeft}s
                    </div>
                )}

                <div className="w-full max-w-lg">
                    <div
                        onClick={() => {
                            if (!isTypingMode && !isFlipped) flipCard()
                        }}
                        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 min-h-[300px] flex flex-col items-center justify-center transition-shadow ${!isTypingMode && !isFlipped ? 'cursor-pointer hover:shadow-xl' : ''
                            } ${isHellMode ? 'border-2 border-red-500 shadow-red-200 dark:shadow-red-900/20' : ''}`}
                    >
                        {/* Content based on Mode and Flip State */}
                        {!isFlipped ? (
                            // FRONT SIDE
                            isTypingMode ? (
                                <div className="w-full flex flex-col items-center">
                                    <h3 className="text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider text-sm">Định nghĩa</h3>
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
                                        {currentWord.definition}
                                    </h2>
                                    <div className="w-full max-w-xs space-y-4">
                                        <Input
                                            ref={inputRef}
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            placeholder={isHellMode ? "Gõ NHANH lên!" : "Nhập từ tiếng Anh..."}
                                            className={`text-center text-lg ${isHellMode ? 'border-red-300 focus:ring-red-500' : ''}`}
                                            autoComplete="off"
                                        />
                                        <Button onClick={checkAnswer} className={`w-full ${isHellMode ? 'bg-red-600 hover:bg-red-700' : ''}`}>
                                            Kiểm tra
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Normal Mode Front
                                <>
                                    <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                                        {currentWord.term}
                                    </h2>
                                    {currentWord.phonetic && (
                                        <p className="text-gray-500 text-lg mb-4">{currentWord.phonetic}</p>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); speak(currentWord.term); }}
                                        className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full hover:bg-primary-200 transition-colors mb-4"
                                    >
                                        <Volume2 className="text-primary-500" size={24} />
                                    </button>
                                    <p className="text-gray-400 text-sm mt-4">Nhấn để xem nghĩa</p>
                                </>
                            )
                        ) : (
                            // BACK SIDE
                            <div className="w-full flex flex-col items-center">
                                {(isTypingMode || timeLeft === 0) && checkResult && (
                                    <div className={`mb-6 flex flex-col items-center ${checkResult === 'correct' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        <span className="text-4xl mb-2">
                                            {checkResult === 'correct' ? '🎉' : '❌'}
                                        </span>
                                        <span className="font-bold text-lg">
                                            {checkResult === 'correct' ? 'Chính xác!' : (timeLeft === 0 ? 'Hết giờ!' : 'Sai rồi!')}
                                        </span>
                                        {checkResult === 'incorrect' && (
                                            <div className="flex flex-col items-center mt-2 text-gray-500 dark:text-gray-400">
                                                {timeLeft > 0 && <p className="text-sm">Bạn đã gõ: <span className="line-through font-medium text-red-400">{userAnswer}</span></p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                                    {currentWord.term}
                                </h2>
                                {currentWord.phonetic && (
                                    <p className="text-gray-500 text-lg mb-4">{currentWord.phonetic}</p>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); speak(currentWord.term); }}
                                    className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full hover:bg-primary-200 transition-colors mb-4"
                                >
                                    <Volume2 className="text-primary-500" size={24} />
                                </button>

                                <div className="text-center mt-4 border-t pt-4 w-full">
                                    <p className="text-xl text-gray-700 dark:text-gray-200 mb-2">{currentWord.definition}</p>
                                    {currentWord.example && (
                                        <p className="text-gray-500 italic">"{currentWord.example}"</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFlipped && (
                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={() => handleAnswer(1)}
                        className="flex flex-col items-center gap-1 px-8 py-4 bg-red-100 dark:bg-red-900/30 rounded-xl hover:bg-red-200 transition-colors">
                        <span className="text-2xl">😟</span>
                        <span className="font-medium text-red-600">Chưa nhớ</span>
                        <span className="text-xs text-gray-500">[1]</span>
                    </button>
                    {!isHellMode && (
                        <button onClick={() => handleAnswer(2)}
                            className="flex flex-col items-center gap-1 px-8 py-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl hover:bg-yellow-200 transition-colors">
                            <span className="text-2xl">🤔</span>
                            <span className="font-medium text-yellow-600">Tạm nhớ</span>
                            <span className="text-xs text-gray-500">[2]</span>
                        </button>
                    )}
                    <button onClick={() => handleAnswer(3)}
                        className="flex flex-col items-center gap-1 px-8 py-4 bg-green-100 dark:bg-green-900/30 rounded-xl hover:bg-green-200 transition-colors">
                        <span className="text-2xl">😊</span>
                        <span className="font-medium text-green-600">Đã thuộc</span>
                        <span className="text-xs text-gray-500">[3]</span>
                    </button>
                </div>
            )}

            <div className="text-center text-sm text-gray-400 mt-4">
                {isFlipped
                    ? (isHellMode ? '[1] Reset (Phạt) • [3] Đã thuộc' : '[1] Chưa nhớ • [2] Tạm nhớ • [3] Đã thuộc')
                    : isTypingMode
                        ? '[Enter] Kiểm tra'
                        : '[Space] Lật thẻ'}
            </div>
        </div>
    )
}
