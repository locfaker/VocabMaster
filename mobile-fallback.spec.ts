import { test, expect, devices } from '@playwright/test'

test.use({
  ...devices['Pixel 5'], // Mô phỏng Android
})

test('Android Fallback Test for Curated Video', async ({ page }) => {
  // Add script to ensure electronAPI is undefined, mimicking Capacitor webview
  await page.addInitScript(() => {
    Object.defineProperty(window, 'electronAPI', { value: undefined })
  })

  console.log('Navigating to app...')
  await page.goto('http://localhost:4173/')

  // Wait for React to mount and the video player to appear
  console.log('Waiting for video to load...')
  await page.waitForSelector('text=Steve Jobs', { timeout: 10000 })

  // Look for the cue loaded from the fallback sampleCues
  console.log('Checking fallback subtitle cues...')
  // sampleCues cho steve jobs có chữ "connecting the dots" hoặc "truth"
  await page.waitForSelector('.transcript-cue, .cue-list', { timeout: 15000 })

  console.log('Taking evidence screenshot...')
  await page.screenshot({ path: 'android_fallback_evidence.png' })

  // Validate that cues actually rendered
  const cuesCount = await page.locator('.flex.gap-3.p-2').count()
  console.log(`Found ${cuesCount} cues rendered from fallback!`)
  expect(cuesCount).toBeGreaterThan(0)
})
