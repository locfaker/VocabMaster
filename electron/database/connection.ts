// ============================================
// Database Connection Module (sql.js)
// ============================================

import { app, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { log, logError } from '../logger'

// ============================================
// Types
// ============================================

interface SqlJsDatabase {
    run: (sql: string) => void
    exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>
    export: () => Uint8Array
    getRowsModified: () => number
}

// ============================================
// State
// ============================================

let db: SqlJsDatabase | null = null
let dbPath = ''
let dbInitialized = false

// ============================================
// Public API
// ============================================

export function isDatabaseReady(): boolean {
    return dbInitialized && db !== null
}

export async function initDatabase(): Promise<void> {
    log('Initializing Database Module...')

    const userDataPath = app.getPath('userData')
    dbPath = path.join(userDataPath, 'vocabmaster.db')
    log('Database path:', dbPath)

    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
        log('Creating userData directory')
        fs.mkdirSync(userDataPath, { recursive: true })
    }

    // Load WASM
    const wasmPath = getWasmPath()
    log('Loading SQL.js with WASM binary...')
    const wasmBinary = fs.readFileSync(wasmPath)

    // Initialize sql.js
    const sqlJsModule = await import('sql.js')
    const initSqlJs = sqlJsModule.default || sqlJsModule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SQL = await initSqlJs({ wasmBinary: wasmBinary as unknown as ArrayBuffer })

    // Open or create database
    log('Opening Database connection...')
    db = fs.existsSync(dbPath)
        ? new SQL.Database(fs.readFileSync(dbPath))
        : new SQL.Database()

    runMigrations()
    save()
    dbInitialized = true
    log('Database Ready & Saved')
}

export function setupDatabaseIPC(): void {
    log('Setting up Database IPC...')

    ipcMain.handle('db:query', (_, sql: string, params: unknown[]) => {
        if (!db) {
            logError('IPC db:query called but DB not initialized')
            return []
        }

        try {
            const finalSql = params?.length ? buildSql(sql, params) : sql
            const result = db.exec(finalSql)

            if (!result.length) return []

            const { columns, values } = result[0]
            return values.map((row) => {
                const obj: Record<string, unknown> = {}
                columns.forEach((col, i) => (obj[col] = row[i]))
                return obj
            })
        } catch (e) {
            logError('query err:', e)
            return []
        }
    })

    ipcMain.handle('db:run', (_, sql: string, params: unknown[]) => {
        if (!db) {
            logError('IPC db:run called but DB not initialized')
            return { lastId: 0, changes: 0 }
        }

        try {
            const finalSql = params?.length ? buildSql(sql, params) : sql
            log('RUN SQL:', finalSql.slice(0, 60))

            db.run(finalSql)
            const changes = db.getRowsModified()

            // Get lastId immediately after run
            const res = db.exec('SELECT last_insert_rowid() as id')
            const lastId = Number(res[0]?.values[0]?.[0] || 0)

            save()
            return { lastId, changes }
        } catch (e) {
            logError('run err:', e)
            return { lastId: 0, changes: 0 }
        }
    })

    ipcMain.handle('db:get', (_, sql: string, params: unknown[]) => {
        if (!db) {
            logError('IPC db:get called but DB not initialized')
            return null
        }

        try {
            const finalSql = params?.length ? buildSql(sql, params) : sql
            const result = db.exec(finalSql)

            if (!result.length || !result[0].values.length) return null

            const { columns, values } = result[0]
            const obj: Record<string, unknown> = {}
            columns.forEach((col, i) => (obj[col] = values[0][i]))
            return obj
        } catch (e) {
            logError('get err:', e)
            return null
        }
    })
}

// ============================================
// Private Helpers
// ============================================

function getWasmPath(): string {
    let wasmPath: string

    if (app.isPackaged) {
        wasmPath = path.join(process.resourcesPath, 'sql-wasm.wasm')
        log('Running in Packaged Mode. Expected WASM path:', wasmPath)

        if (!fs.existsSync(wasmPath)) {
            const errorMsg = `CRITICAL: sql-wasm.wasm missing at ${wasmPath}`
            logError(errorMsg)
            throw new Error(errorMsg)
        }
    } else {
        wasmPath = path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
        log('Running in Dev Mode. WASM path:', wasmPath)
    }

    return wasmPath
}

function save(): void {
    if (!db) return

    try {
        fs.writeFileSync(dbPath, Buffer.from(db.export()))
    } catch (e) {
        logError('Failed to save database', e)
    }
}

function escapeValue(val: unknown): string {
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'number') return String(val)
    return "'" + String(val).replace(/'/g, "''") + "'"
}

function buildSql(sql: string, params: unknown[]): string {
    let i = 0
    return sql.replace(/\?/g, () => escapeValue(params[i++]))
}

// ============================================
// Migrations
// ============================================

function runMigrations(): void {
    if (!db) return

    log('Running Migrations...')

    try {
        // Core tables
        createCoreTables()
        addMissingColumns()
        initDefaultSettings()
        initAchievements()

        log('Migrations completed.')
    } catch (e) {
        logError('Migration failed', e)
        throw e
    }
}

function createCoreTables(): void {
    if (!db) return

    db.run(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      color TEXT,
      icon TEXT,
      word_count INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )
  `)

    db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER,
      term TEXT,
      definition TEXT,
      example TEXT,
      phonetic TEXT,
      image_url TEXT,
      synonyms TEXT,
      antonyms TEXT,
      word_family TEXT,
      created_at TEXT
    )
  `)

    db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word_id INTEGER UNIQUE,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review TEXT,
      status TEXT DEFAULT 'new',
      last_reviewed TEXT,
      leitner_box INTEGER DEFAULT 1,
      correct_streak INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      total_reviews INTEGER DEFAULT 0,
      avg_response_time INTEGER DEFAULT 0
    )
  `)

    db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      words_learned INTEGER DEFAULT 0,
      words_reviewed INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      time_spent INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      quiz_score INTEGER DEFAULT 0,
      typing_score INTEGER DEFAULT 0,
      streak_maintained INTEGER DEFAULT 0
    )
  `)

    db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)

    db.run(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      xp_reward INTEGER DEFAULT 0,
      unlocked_at TEXT,
      progress INTEGER DEFAULT 0,
      target INTEGER DEFAULT 1
    )
  `)

    db.run(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT,
      ended_at TEXT,
      mode TEXT,
      words_studied INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0
    )
  `)

    db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT,
      enabled INTEGER DEFAULT 1,
      days TEXT DEFAULT '1,2,3,4,5,6,0'
    )
  `)
}

function addMissingColumns(): void {
    if (!db) return

    // Words table columns
    const wordColumns = ['image_url', 'synonyms', 'antonyms', 'word_family']
    for (const col of wordColumns) {
        tryAddColumn('words', col, 'TEXT')
    }

    // Progress table columns
    const progressColumns = [
        { name: 'leitner_box', default: '1' },
        { name: 'correct_streak', default: '0' },
        { name: 'wrong_count', default: '0' },
        { name: 'total_reviews', default: '0' },
        { name: 'avg_response_time', default: '0' },
    ]
    for (const { name, default: def } of progressColumns) {
        tryAddColumn('progress', name, `INTEGER DEFAULT ${def}`)
    }

    // Stats table columns
    const statsColumns = ['quiz_score', 'typing_score', 'streak_maintained']
    for (const col of statsColumns) {
        tryAddColumn('stats', col, 'INTEGER DEFAULT 0')
    }
}

function tryAddColumn(table: string, column: string, type: string): void {
    if (!db) return

    try {
        db.exec(`SELECT ${column} FROM ${table} LIMIT 1`)
    } catch {
        log(`Adding missing column to ${table}: ${column}`)
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
    }
}

function initDefaultSettings(): void {
    if (!db) return

    const defaults = [
        ['theme', 'system'],
        ['daily_goal', '20'],
        ['streak', '0'],
        ['total_xp', '0'],
        ['level', '1'],
        ['reminder_enabled', 'true'],
        ['reminder_time', '09:00'],
        ['sound_enabled', 'true'],
        ['mini_mode_opacity', '0.95'],
    ]

    for (const [key, value] of defaults) {
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('${key}', '${value}')`)
    }
}

function initAchievements(): void {
    if (!db) return

    const achievements = [
        ['first_word', 'Khởi đầu', 'Học từ đầu tiên', '🌱', 10, 1],
        ['words_10', 'Người học chăm chỉ', 'Học 10 từ', '📚', 25, 10],
        ['words_50', 'Nhà ngôn ngữ', 'Học 50 từ', '🎓', 50, 50],
        ['words_100', 'Bậc thầy từ vựng', 'Học 100 từ', '👑', 100, 100],
        ['words_500', 'Huyền thoại', 'Học 500 từ', '🏆', 500, 500],
        ['streak_3', 'Kiên trì', '3 ngày streak', '🔥', 30, 3],
        ['streak_7', 'Tuần lễ vàng', '7 ngày streak', '⭐', 70, 7],
        ['streak_30', 'Tháng hoàn hảo', '30 ngày streak', '💎', 300, 30],
        ['perfect_quiz', 'Hoàn hảo', 'Quiz 100% đúng', '🎯', 50, 1],
        ['speed_demon', 'Tốc độ', 'Trả lời dưới 3 giây', '⚡', 25, 1],
        ['night_owl', 'Cú đêm', 'Học sau 22h', '🦉', 15, 1],
        ['early_bird', 'Chim sớm', 'Học trước 7h', '🐦', 15, 1],
        ['mastered_10', 'Thành thạo', 'Thuộc 10 từ', '✅', 50, 10],
        ['mastered_50', 'Chuyên gia', 'Thuộc 50 từ', '🌟', 150, 50],
    ]

    for (const [type, name, desc, icon, xp, target] of achievements) {
        db.run(`
      INSERT OR IGNORE INTO achievements (type, name, description, icon, xp_reward, target)
      VALUES ('${type}', '${name}', '${desc}', '${icon}', ${xp}, ${target})
    `)
    }
}
