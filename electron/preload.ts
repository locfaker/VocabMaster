import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    getTheme: () => ipcRenderer.invoke('theme:get'),
    setTheme: (theme: string) => ipcRenderer.invoke('theme:set', theme),

    // Database - pass params directly, not wrapped in object
    dbQuery: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params || []),
    dbRun: (sql: string, params?: any[]) => ipcRenderer.invoke('db:run', sql, params || []),
    dbGet: (sql: string, params?: any[]) => ipcRenderer.invoke('db:get', sql, params || []),
})
