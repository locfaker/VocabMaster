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
  session,
} from 'electron'
import path from 'path'
import fs from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import { execFile } from 'child_process'
import { initDatabase, setupDatabaseIPC } from './database/connection'
import { log, logError, initLogger } from './logger'

// ============================================
// Global State
// ============================================

let mainWindow: BrowserWindow | null = null
let miniWindow: BrowserWindow | null = null
let tray: Tray | null = null
let reminderInterval: NodeJS.Timeout | null = null
let localServerPort: number | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

log('Main Process Starting...')

// ============================================
// Internal Local HTTP Server (Fixes YouTube file:// restrictions)
// ============================================

function startLocalServer(): Promise<number> {
  if (localServerPort) return Promise.resolve(localServerPort)

  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, '../dist')
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.wasm': 'application/wasm',
      '.woff2': 'font/woff2',
    }

    const server = http.createServer((req, res) => {
      let reqPath = req.url?.split('?')[0] || '/'
      if (reqPath === '/' || !reqPath.includes('.')) {
        reqPath = '/index.html'
      }

      const filePath = path.join(distPath, reqPath)
      const ext = path.extname(filePath).toLowerCase()
      const contentType = mimeTypes[ext] || 'application/octet-stream'

      fs.readFile(filePath, (err, content) => {
        if (err) {
          // SPA fallback to index.html
          fs.readFile(path.join(distPath, 'index.html'), (e, htmlContent) => {
            if (e) {
              res.writeHead(500)
              res.end('Error loading index.html')
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
              res.end(htmlContent)
            }
          })
        } else {
          res.writeHead(200, { 'Content-Type': contentType })
          res.end(content)
        }
      })
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      localServerPort = address.port
      log(`Internal HTTP server running on http://127.0.0.1:${localServerPort}`)
      resolve(localServerPort)
    })

    server.on('error', (err) => {
      logError('Local server error', err)
      reject(err)
    })
  })
}

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
          fs.accessSync(p)
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

async function createWindow(): Promise<void> {
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
      webviewTag: true,
      webSecurity: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    icon: iconPath,
  })

  if (VITE_DEV_SERVER_URL) {
    log('Loading Dev URL:', VITE_DEV_SERVER_URL)
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    const port = await startLocalServer()
    const localUrl = `http://127.0.0.1:${port}`
    log('Loading Local URL:', localUrl)
    mainWindow.loadURL(localUrl)
  }

  mainWindow.on('closed', () => {
    log('Window Closed')
    mainWindow = null
  })
}

async function createMiniWindow(): Promise<void> {
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
    const port = await startLocalServer()
    miniWindow.loadURL(`http://127.0.0.1:${port}/#/mini`)
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

    tray.setToolTip('VocabMaster - Master English Vocabulary')
    tray.setContextMenu(contextMenu)

    tray.on('double-click', () => {
      mainWindow?.show()
    })
  } catch (e) {
    logError('Tray creation error', e)
  }
}

// ============================================
// IPC Handlers
// ============================================

function setupIPC(): void {
  // Dynamic YouTube Transcript Extractor
  ipcMain.handle('fetch-youtube-transcript', async (_event, videoId: string) => {
    return new Promise((resolve) => {
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'fetch_transcript.py')
        : path.join(__dirname, '../electron/fetch_transcript.py')

      const pythonBin = process.platform === 'win32' ? 'python' : 'python3'

      execFile(
        pythonBin,
        [scriptPath, videoId],
        { maxBuffer: 20 * 1024 * 1024, timeout: 25000 },
        (error, stdout) => {
          if (error) {
            logError('fetch-youtube-transcript error: ' + error.message)
            resolve([])
            return
          }
          try {
            const parsed = JSON.parse(stdout.trim())
            resolve(parsed)
          } catch (e) {
            logError('Failed to parse transcript json: ' + String(e))
            resolve([])
          }
        },
      )
    })
  })

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
  ipcMain.handle('theme:get', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'))
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

const CHROME_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
app.userAgentFallback = CHROME_USER_AGENT

app.whenReady().then(async () => {
  log('App Ready')

  try {
    session.defaultSession.setUserAgent(CHROME_USER_AGENT)

    // Remove frame blocking headers from YouTube
    session.defaultSession.webRequest.onHeadersReceived(
      { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
      (details, callback) => {
        const responseHeaders = { ...details.responseHeaders }
        delete responseHeaders['x-frame-options']
        delete responseHeaders['X-Frame-Options']
        delete responseHeaders['content-security-policy']
        delete responseHeaders['Content-Security-Policy']
        callback({ cancel: false, responseHeaders })
      },
    )

    // Block display-capture and remote desktop portal dialogs on Linux Wayland/GNOME
    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
      if (permission === 'display-capture' || permission === 'media' || permission === 'screen') {
        return false
      }
      return true
    })

    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'display-capture' || permission === 'media' || permission === 'screen') {
        callback(false)
        return
      }
      callback(true)
    })

    if (typeof (session.defaultSession as any).setDisplayMediaRequestHandler === 'function') {
      ;(session.defaultSession as any).setDisplayMediaRequestHandler(
        (_request: any, callback: any) => {
          callback({ video: null, audio: null })
        },
      )
    }

    log('Initializing Logger...')
    initLogger()
    log('Logger Initialized')

    log('Initializing Database...')
    await initDatabase()
    log('Database Initialized Successfully')

    setupDatabaseIPC()
    setupIPC()
    await createWindow()
    createTray()
  } catch (e) {
    logError('Critical: Database init failed', e)
    dialog.showErrorBox('Database Initialization Error', `Failed to initialize database:\n${e}`)
  }
})

process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error)
  dialog.showErrorBox(
    'Uncaught Exception',
    `An unexpected error occurred:\n${error.message}\n\n${error.stack}`,
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
