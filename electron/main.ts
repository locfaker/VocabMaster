// ============================================
// Electron Main Process
// ============================================

import {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    nativeTheme,
    dialog,
    Notification,
} from 'electron'
import path from 'path'
import { initDatabase, setupDatabaseIPC } from './database/connection'
import { log, logError } from './logger'

// ============================================
// Global State
// ============================================

let mainWindow: BrowserWindow | null = null
let miniWindow: BrowserWindow | null = null
let tray: Tray | null = null
let reminderInterval: NodeJS.Timeout | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

log('Main Process Starting...')

// ============================================
// Icon Helper
// ============================================

function getIconPath(): string | undefined {
    try {
        if (app.isPackaged) {
            const possiblePaths = [
                path.join(process.resourcesPath, 'icon.ico'),
                path.join(process.resourcesPath, 'app.ico'),
                path.join(__dirname, '../resources/icon.ico'),
            ]

            for (const p of possiblePaths) {
                try {
                    require('fs').accessSync(p)
                    return p
                } catch {
                    // Continue to next path
                }
            }
        } else {
            return path.join(__dirname, '../resources/icon.ico')
        }
    } catch (e) {
        logError('Icon path error', e)
    }
    return undefined
}

// ============================================
// Window Creation
// ============================================

function createWindow(): void {
    log('Creating Window...')
    const iconPath = getIconPath()

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        frame: false,
        titleBarStyle: 'hidden',
        icon: iconPath,
    })

    if (VITE_DEV_SERVER_URL) {
        log('Loading Dev URL:', VITE_DEV_SERVER_URL)
        mainWindow.loadURL(VITE_DEV_SERVER_URL)
    } else {
        const indexHtml = path.join(__dirname, '../dist/index.html')
        log('Loading File:', indexHtml)
        mainWindow.loadFile(indexHtml)
    }

    mainWindow.on('closed', () => {
        log('Window Closed')
        mainWindow = null
    })
}

function createMiniWindow(): void {
    if (miniWindow) {
        miniWindow.focus()
        return
    }

    miniWindow = new BrowserWindow({
        width: 350,
        height: 450,
        minWidth: 300,
        minHeight: 400,
        maxWidth: 500,
        maxHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        frame: false,
        alwaysOnTop: true,
        resizable: true,
        skipTaskbar: false,
        transparent: false,
        icon: getIconPath(),
    })

    if (VITE_DEV_SERVER_URL) {
        miniWindow.loadURL(`${VITE_DEV_SERVER_URL}#/mini`)
    } else {
        miniWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/mini' })
    }

    miniWindow.on('closed', () => {
        miniWindow = null
    })
}

// ============================================
// System Tray
// ============================================

function createTray(): void {
    try {
        const iconPath = getIconPath()
        if (!iconPath) {
            log('No icon available for tray')
            return
        }

        tray = new Tray(iconPath)

        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open VocabMaster', click: () => mainWindow?.show() },
            { label: 'Mini Mode', click: () => createMiniWindow() },
            { type: 'separator' },
            { label: 'Quit', click: () => app.quit() },
        ])

        tray.setToolTip('VocabMaster')
        tray.setContextMenu(contextMenu)
        tray.on('click', () => mainWindow?.show())
    } catch (e) {
        logError('Tray not available', e)
    }
}

// ============================================
// IPC Handlers
// ============================================

function setupIPC(): void {
    // Window controls
    ipcMain.handle('window:minimize', () => mainWindow?.minimize())
    ipcMain.handle('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow?.maximize()
        }
    })
    ipcMain.handle('window:close', () => mainWindow?.hide())

    // Theme
    ipcMain.handle('theme:get', () =>
        nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    )
    ipcMain.handle('theme:set', (_, theme: 'dark' | 'light' | 'system') => {
        nativeTheme.themeSource = theme
    })

    // Mini mode
    ipcMain.handle('mini:open', () => createMiniWindow())
    ipcMain.handle('mini:close', () => {
        miniWindow?.close()
        miniWindow = null
    })

    // Notifications
    ipcMain.handle('notification:show', (_, title: string, body: string) => {
        if (Notification.isSupported()) {
            new Notification({ title, body, icon: getIconPath() }).show()
        }
    })

    // Reminder scheduling
    ipcMain.handle('reminder:set', (_, time: string, enabled: boolean) => {
        if (reminderInterval) {
            clearInterval(reminderInterval)
            reminderInterval = null
        }

        if (!enabled) return

        // Check every minute
        reminderInterval = setInterval(() => {
            const now = new Date()
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

            if (currentTime === time && Notification.isSupported()) {
                new Notification({
                    title: '📚 Đến giờ học từ vựng!',
                    body: 'Hãy dành vài phút để ôn tập từ vựng nhé!',
                    icon: getIconPath(),
                }).show()
            }
        }, 60000)
    })
}

// ============================================
// App Lifecycle
// ============================================

app.whenReady().then(async () => {
    log('App Ready')

    try {
        log('Initializing Database...')
        await initDatabase()
        log('Database Initialized Successfully')

        setupDatabaseIPC()
        setupIPC()
        createWindow()
        createTray()
    } catch (e) {
        logError('Critical: Database init failed', e)
        dialog.showErrorBox(
            'Database Initialization Error',
            `Failed to initialize database:\n${e}`
        )
    }
})

process.on('uncaughtException', (error) => {
    logError('Uncaught Exception', error)
    dialog.showErrorBox(
        'Uncaught Exception',
        `An unexpected error occurred:\n${error.message}\n\n${error.stack}`
    )
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})
