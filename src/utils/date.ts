// ============================================
// Date Utilities
// ============================================

import { format, subDays } from 'date-fns'

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday(): string {
    return format(new Date(), 'yyyy-MM-dd')
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterday(): string {
    return format(subDays(new Date(), 1), 'yyyy-MM-dd')
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr = 'yyyy-MM-dd'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, formatStr)
}

/**
 * Get dates for last N days
 */
export function getLastNDays(n: number): string[] {
    return Array.from({ length: n }, (_, i) =>
        format(subDays(new Date(), n - 1 - i), 'yyyy-MM-dd')
    )
}

/**
 * Check if date is today
 */
export function isToday(date: string): boolean {
    return date === getToday()
}

/**
 * Check if date is in the past
 */
export function isPast(date: string): boolean {
    return date < getToday()
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng!'
    if (hour < 18) return 'Chào buổi chiều!'
    return 'Chào buổi tối!'
}

/**
 * Get current hour
 */
export function getCurrentHour(): number {
    return new Date().getHours()
}
