// ============================================
// Preload Script - Electron Context Bridge
// ============================================

import { contextBridge, ipcRenderer } from 'electron'

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),

    // Theme
    getTheme: () => ipcRenderer.invoke('theme:get'),
    setTheme: (theme: string) => ipcRenderer.invoke('theme:set', theme),

    // Database operations
    dbQuery: <T = unknown>(sql: string, params?: unknown[]) =>
        ipcRenderer.invoke('db:query', sql, params ?? []) as Promise<T[]>,
    dbRun: (sql: string, params?: unknown[]) =>
        ipcRenderer.invoke('db:run', sql, params ?? []) as Promise<{ lastId: number; changes: number }>,
    dbGet: <T = unknown>(sql: string, params?: unknown[]) =>
        ipcRenderer.invoke('db:get', sql, params ?? []) as Promise<T | null>,

    // Mini mode
    openMiniMode: () => ipcRenderer.invoke('mini:open'),
    closeMiniMode: () => ipcRenderer.invoke('mini:close'),

    // Notifications
    showNotification: (title: string, body: string) =>
        ipcRenderer.invoke('notification:show', title, body),

    // Reminder
    setReminder: (time: string, enabled: boolean) =>
        ipcRenderer.invoke('reminder:set', time, enabled),
})
