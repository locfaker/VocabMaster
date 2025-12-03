// ============================================
// Logger Module for Electron Main Process
// ============================================

import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// Log file path
const LOG_PATH = path.join(app.getPath('userData'), 'app.log')

// Initialize log file
function initLogFile(): void {
    try {
        fs.writeFileSync(LOG_PATH, `--- Application Started at ${new Date().toISOString()} ---\n`)
    } catch (e) {
        console.error('Failed to init log file', e)
    }
}

// Initialize on module load
initLogFile()

/**
 * Log info message
 */
export function log(message: string, ...args: unknown[]): void {
    const formattedArgs = args.map((a) => JSON.stringify(a)).join(' ')
    const msg = `[INFO] ${message} ${formattedArgs}\n`

    console.log(message, ...args)

    try {
        fs.appendFileSync(LOG_PATH, msg)
    } catch {
        // Ignore write errors
    }
}

/**
 * Log error message
 */
export function logError(message: string, error?: unknown): void {
    const errStr = error instanceof Error ? error.stack : JSON.stringify(error)
    const msg = `[ERROR] ${message} ${errStr}\n`

    console.error(message, error)

    try {
        fs.appendFileSync(LOG_PATH, msg)
    } catch {
        // Ignore write errors
    }
}

/**
 * Get log file path
 */
export function getLogPath(): string {
    return LOG_PATH
}
