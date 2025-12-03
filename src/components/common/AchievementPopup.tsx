// ============================================
// Achievement Popup Component
// ============================================

import { useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAchievementStore } from '@/store/achievementStore'
import { TIME } from '@/constants'

const POPUP_VARIANTS = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
}

export const AchievementPopup = memo(function AchievementPopup() {
    const { unlockedRecently, clearRecentUnlock } = useAchievementStore()

    useEffect(() => {
        if (unlockedRecently) {
            const timer = setTimeout(clearRecentUnlock, TIME.ACHIEVEMENT_POPUP_DURATION)
            return () => clearTimeout(timer)
        }
    }, [unlockedRecently, clearRecentUnlock])

    return (
        <AnimatePresence>
            {unlockedRecently && (
                <motion.div
                    variants={POPUP_VARIANTS}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed bottom-6 right-6 z-50"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 flex items-center gap-4 border border-primary-200 dark:border-primary-800">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center text-3xl">
                            {unlockedRecently.icon}
                        </div>

                        {/* Content */}
                        <div>
                            <p className="text-xs text-primary-500 font-medium mb-1">
                                🎉 Thành tích mới!
                            </p>
                            <h3 className="font-bold text-lg">{unlockedRecently.name}</h3>
                            <p className="text-sm text-gray-500">{unlockedRecently.description}</p>
                            <p className="text-xs text-green-500 font-medium mt-1">
                                +{unlockedRecently.xp_reward} XP
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={clearRecentUnlock}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            aria-label="Dismiss"
                        >
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
})
