import { test, expect } from '@playwright/test'

test('Android Offline Fallback renders SE video correctly', async ({ page }) => {
  // Chặn internet để giả lập offline 100%
  await page.route('**/*', (route) => {
    const url = route.request().url()
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      route.continue()
    } else {
      route.abort()
    }
  })

  await page.addInitScript(() => {
    window.electronAPI = undefined // Mock Android mode
  })

  // Vào thẳng Video System Design Rate Limiting bằng route chuẩn
  await page.goto('http://localhost:4173/#/video-learning?v=YXkOdWBwqaA', {
    waitUntil: 'networkidle',
  })

  // Chờ transcript load offline
  await page.waitForSelector('.border.transition-all', { timeout: 15000 })
  await page.waitForTimeout(1000)

  await page.screenshot({ path: 'offline-se-video-evidence.png' })
  console.log('Screenshot saved!')
})
