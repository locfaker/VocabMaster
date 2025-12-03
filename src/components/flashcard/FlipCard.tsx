// ============================================
// Flip Card Component
// ============================================

import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'
import type { WordWithProgress } from '@/types'
import { speakWord } from '@/utils/quiz'

interface FlipCardProps {
    word: WordWithProgress
    isFlipped: boolean
    onFlip: () => void
}

export const FlipCard = memo(function FlipCard({ word, isFlipped, onFlip }: FlipCardProps) {
    const handleSpeak = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        speakWord(word.term)
    }, [word.term])

    return (
        <div className="perspective-1000 w-full max-w-lg mx-auto">
            <motion.div
                className="relative w-full h-80 cursor-pointer"
                onClick={onFlip}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <CardFace>
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                        {word.term}
                    </h2>
                    {word.phonetic && (
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                            {word.phonetic}
                        </p>
                    )}
                    <button
                        onClick={handleSpeak}
                        className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                        aria-label="Speak word"
                    >
                        <Volume2 className="text-primary-500" size={24} />
                    </button>
                    <p className="mt-6 text-gray-400 text-sm">Click to flip</p>
                </CardFace>

                {/* Back */}
                <CardFace isBack>
                    <p className="text-2xl text-gray-800 dark:text-white text-center mb-4">
                        {word.definition}
                    </p>
                    {word.example && (
                        <p className="text-gray-500 dark:text-gray-400 text-center italic">
                            "{word.example}"
                        </p>
                    )}
                </CardFace>
            </motion.div>
        </div>
    )
})

// Card face component
interface CardFaceProps {
    children: React.ReactNode
    isBack?: boolean
}

const CardFace = memo(function CardFace({ children, isBack }: CardFaceProps) {
    return (
        <div
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center"
            style={{
                backfaceVisibility: 'hidden',
                transform: isBack ? 'rotateY(180deg)' : undefined,
            }}
        >
            {children}
        </div>
    )
})
