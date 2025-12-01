import { useEffect, useCallback, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Volume2, Keyboard, Flame, Lightbulb } from 'lucide-react'
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
    const [promptLevel, setPromptLevel] = useState(0) // 0: Silent, 1: Semantic, 2: Sensory
    const inputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const promptTimerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        fetchTodayWords()
        // Reset Hell Mode when entering/leaving
        return () => setHellMode(false)
    }, [])

    // Main Timer logic (Hell Mode & Prompt System)
    useEffect(() => {
        // Clear existing timers
        if (timerRef.current) clearInterval(timerRef.current)
        if (promptTimerRef.current) clearTimeout(promptTimerRef.current)

        if (!isFlipped && !sessionComplete && todayWords.length > 0) {
            // 1. Hell Mode Countdown
            if (isHellMode) {
                setTimeLeft(HELL_MODE_TIME)
                timerRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current!)
                            handleTimeout()
                            return 0
                        }
                        return prev - 1
                    })
                }, 1000)
            }

            // 2. Recall Prompt System (Auto-trigger)
            // 0-7s: Silent (Effortful Recall)
            // 7s: Semantic Prompt
            // 12s: Sensory Prompt
            setPromptLevel(0)
            
            // Set timeout for Level 1 (Semantic)
            promptTimerRef.current = setTimeout(() => {
                setPromptLevel(1)
                // Set timeout for Level 2 (Sensory)
                promptTimerRef.current = setTimeout(() => {
                    setPromptLevel(2)
                }, 5000) // +5s after Level 1 (Total 12s)
            }, 7000) // 7s initial silence
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (promptTimerRef.current) clearTimeout(promptTimerRef.current)
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
        // Hell Mode: Auto fail after timeout
        if (isHellMode) {
            setTimeout(() => handleAnswer(1), 3000)
        }
    }

    const handleAnswer = async (quality: Quality) => {
        await answerCard(quality)
    }

    const checkAnswer = () => {
        if (!currentWord) return
        const correct = currentWord.term.trim().toLowerCase() === userAnswer.trim().toLowerCase()
        setCheckResult(correct ? 'correct' : 'incorrect')
        
        // Stop timers
        if (timerRef.current) clearInterval(timerRef.current)
        if (promptTimerRef.current) clearTimeout(promptTimerRef.current)
        
        flipCard()

        // Hell Mode: Auto advance based on result
        if (isHellMode) {
            if (correct) {
                setTimeout(() => handleAnswer(3), 1500) // Correct = Easy (3)
            } else {
                setTimeout(() => handleAnswer(1), 3500) // Incorrect = Again (1) - give time to review
            }
        }
    }

    // --- NEW PROMPT CONTENT GENERATOR ---
    const getPromptContent = () => {
        if (!currentWord || promptLevel === 0) return null

        // Use simple placeholder with text to guarantee loading speed and reliability
        const term = currentWord.term || 'Word'
        // Dynamic color based on term length to make it look less static
        const colors = ['1e40af', '3730a3', '4c1d95', '5b21b6', 'be123c', 'b91c1c', 'c2410c', 'b45309', '047857', '0f766e']
        const color = colors[term.length % colors.length]
        const imageUrl = currentWord.image_url || `https://placehold.co/400x300/${color}/ffffff?text=${encodeURIComponent(term.substring(0, 1).toUpperCase() + "...")}`

        // LEVEL 1: SEMANTIC PROMPT (Meaning/Context Question)
        if (promptLevel === 1) {
            const question = currentWord.antonyms 
                ? `Có phải trái nghĩa với "${currentWord.antonyms.split(',')[0]}"?`
                : currentWord.synonyms
                    ? `Có liên quan đến "${currentWord.synonyms.split(',')[0]}" không?`
                    : `Hãy nghĩ về: ${currentWord.definition.slice(0, 20)}...`

            return (
                <div className="animate-slide-up absolute bottom-24 w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border-l-4 border-blue-500">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full animate-pulse">
                            <Lightbulb className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase">Gợi ý tư duy</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-lg italic">
                                "{question}"
                            </p>
                        </div>
                    </div>
                </div>
            )
        }

        // LEVEL 2: SENSORY PROMPT (Image + Sound)
        if (promptLevel === 2) {
            return (
                <div className="animate-scale-in absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-20">
                    {/* Background Image Placeholder (Blurry) */}
                    <img 
                        src={imageUrl} 
                        alt="Hint" 
                        className="w-full h-full object-cover filter blur-sm scale-110 transition-all duration-1000"
                    />
                    
                    {/* Sound Hint Overlay */}
                    <div className="absolute bottom-24 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
                        <span className="font-mono text-2xl font-bold mr-2">/{currentWord.phonetic?.split(' ')[0] || '...'}.../</span>
                        <span className="text-sm font-medium opacity-80">Nghe quen không?</span>
                    </div>
                </div>
            )
        }

        return null
    }

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        speechSynthesis.speak(utterance)
    }

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!currentWord || sessionComplete) return

        // Hint shortcut (4) - Removed for now as Prompt system is automatic
        // if (e.key === '4' && !isFlipped) {
        //     e.preventDefault()
        //     // showNextHint()
        //     return
        // }

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
    }, [currentWord, isFlipped, sessionComplete, isTypingMode, userAnswer, promptLevel])

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
                                    
                                    {/* Recall Prompts Overlay */}
                                    {getPromptContent()}

                                    <div className="w-full max-w-xs space-y-4 mt-6">
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
                                    
                                    {/* Recall Prompts Overlay */}
                                    {getPromptContent()}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); speak(currentWord.term); }}
                                        className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full hover:bg-primary-200 transition-colors mb-4 mt-4"
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
                                                {userAnswer && <p className="text-sm">Bạn đã gõ: <span className="line-through font-medium text-red-400">{userAnswer}</span></p>}
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
                    {!isHellMode ? (
                        <>
                            <button onClick={() => handleAnswer(1)}
                                className="flex flex-col items-center gap-1 px-8 py-4 bg-red-100 dark:bg-red-900/30 rounded-xl hover:bg-red-200 transition-colors">
                                <span className="text-2xl">😟</span>
                                <span className="font-medium text-red-600">Chưa nhớ</span>
                                <span className="text-xs text-gray-500">[1]</span>
                            </button>
                            <button onClick={() => handleAnswer(2)}
                                className="flex flex-col items-center gap-1 px-8 py-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl hover:bg-yellow-200 transition-colors">
                                <span className="text-2xl">🤔</span>
                                <span className="font-medium text-yellow-600">Tạm nhớ</span>
                                <span className="text-xs text-gray-500">[2]</span>
                            </button>
                            <button onClick={() => handleAnswer(3)}
                                className="flex flex-col items-center gap-1 px-8 py-4 bg-green-100 dark:bg-green-900/30 rounded-xl hover:bg-green-200 transition-colors">
                                <span className="text-2xl">😊</span>
                                <span className="font-medium text-green-600">Đã thuộc</span>
                                <span className="text-xs text-gray-500">[3]</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 text-lg font-bold animate-pulse">
                            {checkResult === 'correct' ? (
                                <span className="text-green-600">✨ Tuyệt vời! Đang chuyển tiếp...</span>
                            ) : (
                                <span className="text-red-600">💀 Sai rồi! Nhận hình phạt...</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="text-center text-sm text-gray-400 mt-4">
                {isFlipped
                    ? (isHellMode ? '[1] Reset (Phạt) • [3] Đã thuộc' : '[1] Chưa nhớ • [2] Tạm nhớ • [3] Đã thuộc')
                    : (
                        <div className="flex gap-4 justify-center">
                             {isTypingMode ? <span>[Enter] Kiểm tra</span> : <span>[Space] Lật thẻ</span>}
                        </div>
                    )
                }
            </div>
        </div>
    )
}
