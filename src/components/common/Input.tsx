// ============================================
// Input Component
// ============================================

import { InputHTMLAttributes, forwardRef, memo } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

const BASE_STYLES = 'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

export const Input = memo(forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`${BASE_STYLES} ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
))

Input.displayName = 'Input'
