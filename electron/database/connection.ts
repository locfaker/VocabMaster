import { app, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

let db: any = null
let dbPath: string = ''

export async function initDatabase(): Promise<void> {
    const userDataPath = app.getPath('userData')
    dbPath = path.join(userDataPath, 'vocabmaster.db')

    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
    }

    const initSqlJs = (await import('sql.js')).default
    let wasmPath = app.isPackaged
        ? path.join(process.resourcesPath, 'sql-wasm.wasm')
        : path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

    console.log('Initializing DB with wasm path:', wasmPath)

    if (!app.isPackaged && !fs.existsSync(wasmPath)) {
        console.warn('Wasm file not found at calculated path, trying fallback...')
        const fallbackPath = path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm')
        if (fs.existsSync(fallbackPath)) {
            console.log('Found wasm at fallback path:', fallbackPath)
            wasmPath = fallbackPath
        }
    }

    const SQL = await initSqlJs({ locateFile: () => wasmPath })
    db = fs.existsSync(dbPath) ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database()

    runMigrations()
    save()
    console.log('DB ready:', dbPath)
}

function save() {
    fs.writeFileSync(dbPath, Buffer.from(db.export()))
}

function runMigrations() {
    // Core tables
    db.run(`CREATE TABLE IF NOT EXISTS decks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, color TEXT, icon TEXT, word_count INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT)`)
    db.run(`CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY AUTOINCREMENT, deck_id INTEGER, term TEXT, definition TEXT, example TEXT, phonetic TEXT, image_url TEXT, synonyms TEXT, antonyms TEXT, word_family TEXT, created_at TEXT)`)

    // Enhanced progress tracking with Leitner box support
    db.run(`CREATE TABLE IF NOT EXISTS progress (
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
    )`)

    // Enhanced daily stats
    db.run(`CREATE TABLE IF NOT EXISTS stats (
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
    )`)

    // Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`)

    // Achievements table
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        xp_reward INTEGER DEFAULT 0,
        unlocked_at TEXT,
        progress INTEGER DEFAULT 0,
        target INTEGER DEFAULT 1
    )`)

    // Study sessions for detailed tracking
    db.run(`CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT,
        ended_at TEXT,
        mode TEXT,
        words_studied INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0
    )`)

    // Reminder settings
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT,
        enabled INTEGER DEFAULT 1,
        days TEXT DEFAULT '1,2,3,4,5,6,0'
    )`)

    // Initialize default settings
    initDefaultSettings()

    // Initialize achievements
    initAchievements()
}

function initDefaultSettings() {
    const defaults = [
        ['theme', 'system'],
        ['daily_goal', '20'],
        ['streak', '0'],
        ['total_xp', '0'],
        ['level', '1'],
        ['reminder_enabled', 'true'],
        ['reminder_time', '09:00'],
        ['sound_enabled', 'true'],
        ['mini_mode_opacity', '0.95']
    ]
    defaults.forEach(([key, value]) => {
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('${key}', '${value}')`)
    })
}

function initAchievements() {
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
        ['mastered_50', 'Chuyên gia', 'Thuộc 50 từ', '🌟', 150, 50]
    ]
    achievements.forEach(([type, name, desc, icon, xp, target]) => {
        db.run(`INSERT OR IGNORE INTO achievements (type, name, description, icon, xp_reward, target) VALUES ('${type}', '${name}', '${desc}', '${icon}', ${xp}, ${target})`)
    })
}

function esc(val: any): string {
    if (val === null || val === undefined) return 'NULL'
    if (typeof val === 'number') return String(val)
    return "'" + String(val).replace(/'/g, "''") + "'"
}

function buildSql(sql: string, params: any[]): string {
    let i = 0
    return sql.replace(/\?/g, () => esc(params[i++]))
}

export function setupDatabaseIPC() {
    ipcMain.handle('db:query', (_, sql: string, params: any[]) => {
        if (!db) {
            console.error('DB not initialized')
            return []
        }
        try {
            const finalSql = params?.length ? buildSql(sql, params) : sql
            const result = db.exec(finalSql)
            if (!result.length) return []
            const { columns, values } = result[0]
            return values.map((row: any[]) => {
                const obj: any = {}
                columns.forEach((col: string, i: number) => obj[col] = row[i])
                return obj
            })
        } catch (e) {
            console.error('query err:', e)
            return []
        }
    })

    ipcMain.handle('db:run', (_, sql: string, params: any[]) => {
        if (!db) {
            console.error('DB not initialized')
            return { lastId: 0, changes: 0 }
        }
        try {
            const finalSql = params?.length ? buildSql(sql, params) : sql
            console.log('RUN:', finalSql.slice(0, 60))

            db.run(finalSql)
            const changes = db.getRowsModified()

            // Get lastId IMMEDIATELY after run, before anything else
            const res = db.exec('SELECT last_insert_rowid() as id')
            const lastId = Number(res[0]?.values[0]?.[0] || 0)

            save()
            console.log('=> id:', lastId, 'changes:', changes)
            return { lastId, changes }
        } catch (e) {
            console.error('run err:', e)
            return { lastId: 0, changes: 0 }
        }
    })

    ipcMain.handle('db:get', (_, sql: string, params: any[]) => {
        if (!db) {
            console.error('DB not initialized')
            return null
        }
        try {
            const finalSql = params?.length ? buildSql(sql, params) : sql
            const result = db.exec(finalSql)
            if (!result.length || !result[0].values.length) return null
            const { columns, values } = result[0]
            const obj: any = {}
            columns.forEach((col: string, i: number) => obj[col] = values[0][i])
            return obj
        } catch (e) {
            console.error('get err:', e)
            return null
        }
    })
}
