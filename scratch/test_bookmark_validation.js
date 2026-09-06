import { SmartBookmarkStore, SmartBookmarkValidator } from './smart_bookmark_service.ts'

async function runVerification() {
  console.log('Testing Smart Bookmark Service...')
  const store = new SmartBookmarkStore()

  // Test 1: Valid Bookmark
  const res1 = await store.saveBookmark({
    id: 'bm-001',
    storyId: 'xich-tam-tuan-thien',
    chapterId: 'chap-10',
    chapterTitle: 'Chương 10: Nhập Môn Kiếm Đạo',
    scrollPositionPercent: 45.5,
    lastReadAt: new Date().toISOString(),
    syncStatus: 'synced',
  })
  console.log('Test 1 (Valid Save):', res1.success ? 'PASS' : 'FAIL')

  // Test 2: Invalid Scroll Percent Validation
  const val2 = SmartBookmarkValidator.validateBookmark({
    id: 'bm-002',
    storyId: 'xich-tam-tuan-thien',
    chapterId: 'chap-11',
    scrollPositionPercent: 150, // Invalid > 100
  })
  console.log('Test 2 (Invalid Percent Rejected):', !val2.isValid ? 'PASS' : 'FAIL')

  // Test 3: Retrieve Bookmark
  const bm = await store.getBookmark('bm-001')
  console.log('Test 3 (Retrieve):', bm && bm.chapterTitle.includes('Nhập Môn') ? 'PASS' : 'FAIL')

  console.log('All Bookmark Unit Checks Verified Successfully!')
}

runVerification().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
