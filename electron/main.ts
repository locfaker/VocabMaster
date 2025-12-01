import { app, BrowserWindow, ipcMain, Tray, Menu, nativeTheme } from 'electron'
import path from 'path'
import { initDatabase, setupDatabaseIPC } from './database/connection'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        frame: false,
        titleBarStyle: 'hidden',
        icon: path.join(__dirname, '../resources/icon.ico')
    })

    if (VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL)
        // Không mở DevTools
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

function createTray() {
    try {
        const iconPath = path.join(__dirname, '../resources/icon.ico')
        tray = new Tray(iconPath)
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open VocabMaster', click: () => mainWindow?.show() },
            { type: 'separator' },
            { label: 'Quit', click: () => app.quit() }
        ])
        tray.setToolTip('VocabMaster')
        tray.setContextMenu(contextMenu)
        tray.on('click', () => mainWindow?.show())
    } catch (e) {
        console.log('Tray not available')
    }
}

ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
})
ipcMain.handle('window:close', () => mainWindow?.hide())

ipcMain.handle('theme:get', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
ipcMain.handle('theme:set', (_, theme: 'dark' | 'light' | 'system') => {
    nativeTheme.themeSource = theme
})

app.whenReady().then(async () => {
    try {
        await initDatabase()
    } catch (e) {
        console.error('Database init failed:', e)
    }
    setupDatabaseIPC()
    createWindow()
    createTray()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (mainWindow === null) createWindow()
})
