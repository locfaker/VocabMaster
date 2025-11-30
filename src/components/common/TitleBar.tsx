import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
    return (
        <div className="titlebar-drag h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">VocabMaster</span>
            </div>

            <div className="titlebar-no-drag flex">
                <button
                    onClick={() => window.electronAPI.minimize()}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={() => window.electronAPI.maximize()}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <Square size={14} />
                </button>
                <button
                    onClick={() => window.electronAPI.close()}
                    className="w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
