# 📚 TÀI LIỆU PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
# ỨNG DỤNG HỌC TỪ VỰNG TIẾNG ANH - VOCABMASTER (Windows Desktop)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Giới thiệu
**Tên ứng dụng**: VocabMaster  
**Nền tảng**: Windows Desktop (.exe)  
**Công nghệ**: Electron + React + TypeScript  
**Mục tiêu**: Xây dựng ứng dụng học từ vựng tiếng Anh hiệu quả với phương pháp Spaced Repetition System (SRS)

### 1.2 Tại sao chọn Electron?
| Ưu điểm | Mô tả |
|---------|-------|
| File .exe | Build trực tiếp ra file .exe, nhấn đúp là chạy |
| Dùng React | Tận dụng kiến thức React có sẵn |
| Cross-platform | Có thể build thêm cho macOS, Linux nếu cần |
| Native APIs | Truy cập file system, notifications, tray icon |
| Auto-update | Hỗ trợ tự động cập nhật app |

### 1.3 Đối tượng người dùng
- Học sinh, sinh viên
- Người đi làm muốn cải thiện tiếng Anh
- Người chuẩn bị thi IELTS, TOEIC, TOEFL

---

## 2. YÊU CẦU CHỨC NĂNG (Functional Requirements)

### 2.1 Quản lý từ vựng (Vocabulary Management)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-01 | Thêm từ mới | Nhập từ, nghĩa, ví dụ, phát âm | Cao |
| FR-02 | Import từ vựng | Import từ file CSV/Excel/JSON | Cao |
| FR-03 | Export từ vựng | Xuất ra file để backup | Trung bình |
| FR-04 | Tạo bộ từ (Deck) | Nhóm từ theo chủ đề | Cao |
| FR-05 | Tìm kiếm từ | Search trong library | Cao |
| FR-06 | Gắn tag | Phân loại từ vựng | Thấp |

### 2.2 Học tập (Learning)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-07 | Flashcard | Lật thẻ học từ | Cao |
| FR-08 | Spaced Repetition | Thuật toán SM-2 | Cao |
| FR-09 | Quiz trắc nghiệm | 4 đáp án, chọn đúng | Cao |
| FR-10 | Điền từ | Fill in the blank | Trung bình |
| FR-11 | Phát âm | Text-to-Speech (Windows API) | Cao |
| FR-12 | Keyboard shortcuts | Phím tắt để học nhanh | Trung bình |

### 2.3 Gamification & Thống kê
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-13 | Daily Streak | Đếm ngày học liên tục | Cao |
| FR-14 | XP & Level | Điểm kinh nghiệm | Trung bình |
| FR-15 | Thống kê học tập | Biểu đồ tiến độ | Cao |
| FR-16 | Desktop Notification | Nhắc nhở học tập | Cao |
| FR-17 | System Tray | Chạy nền, quick access | Trung bình |

### 2.4 Tính năng Desktop đặc biệt
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-18 | Mini Mode | Cửa sổ nhỏ floating khi làm việc | Cao |
| FR-19 | Global Hotkey | Phím tắt mở app từ bất kỳ đâu | Trung bình |
| FR-20 | Auto-start | Khởi động cùng Windows | Thấp |
| FR-21 | Dark/Light Mode | Chế độ tối/sáng | Trung bình |

---

## 3. YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements)

| ID | Yêu cầu | Mô tả |
|----|---------|-------|
| NFR-01 | Performance | App khởi động < 3s |
| NFR-02 | Offline | 100% hoạt động offline |
| NFR-03 | Storage | Dữ liệu lưu local (SQLite) |
| NFR-04 | Size | File cài đặt < 100MB |
| NFR-05 | Compatibility | Windows 10/11 |
| NFR-06 | Memory | RAM usage < 200MB |

---

## 4. KIẾN TRÚC HỆ THỐNG (System Architecture)

### 4.1 Kiến trúc Electron
```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MAIN PROCESS (Node.js)                  │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │    │
│  │  │ Window  │  │  IPC    │  │   Native APIs       │  │    │
│  │  │ Manager │  │ Handler │  │ (File, TTS, Tray)   │  │    │
│  │  └─────────┘  └─────────┘  └─────────────────────┘  │    │
│  │                     │                                │    │
│  │              ┌──────┴──────┐                         │    │
│  │              │   SQLite    │                         │    │
│  │              │  Database   │                         │    │
│  │              └─────────────┘                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │ IPC                               │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            RENDERER PROCESS (React)                  │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │    │
│  │  │  React  │  │ Zustand │  │   UI Components     │  │    │
│  │  │  Router │  │  Store  │  │   (Tailwind CSS)    │  │    │
│  │  └─────────┘  └─────────┘  └─────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack
```
ELECTRON APP:
├── Electron 28+
├── React 18
├── TypeScript 5
├── Vite (bundler)
├── Tailwind CSS
├── Zustand (state management)
├── React Router 6
├── SQLite (better-sqlite3)
├── electron-builder (packaging)
└── electron-updater (auto-update)

LIBRARIES:
├── framer-motion (animations)
├── recharts (charts/statistics)
├── lucide-react (icons)
├── date-fns (date utilities)
└── zod (validation)
```

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU (SQLite)

### 5.1 Entity Relationship Diagram
```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   SETTINGS   │       │    DECK      │       │    WORD      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ key (PK)     │       │ id (PK)      │──┐    │ id (PK)      │
│ value        │       │ name         │  │    │ deck_id (FK) │
└──────────────┘       │ description  │  └───>│ term         │
                       │ color        │       │ definition   │
┌──────────────┐       │ icon         │       │ example      │
│    STATS     │       │ word_count   │       │ phonetic     │
├──────────────┤       │ created_at   │       │ image_path   │
│ id (PK)      │       │ updated_at   │       │ created_at   │
│ date         │       └──────────────┘       └──────────────┘
│ words_learned│                                     │
│ words_reviewed                                     ▼
│ time_spent   │                              ┌──────────────┐
│ xp_earned    │                              │  PROGRESS    │
└──────────────┘                              ├──────────────┤
                                              │ id (PK)      │
┌──────────────┐                              │ word_id (FK) │
│ ACHIEVEMENT  │                              │ ease_factor  │
├──────────────┤                              │ interval     │
│ id (PK)      │                              │ repetitions  │
│ type         │                              │ next_review  │
│ unlocked_at  │                              │ status       │
└──────────────┘                              │ last_reviewed│
                                              └──────────────┘
```

### 5.2 SQL Schema
```sql
-- Decks table
CREATE TABLE decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6C63FF',
    icon TEXT DEFAULT '📚',
    word_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Words table
CREATE TABLE words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    phonetic TEXT,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Learning progress (SM-2 algorithm)
CREATE TABLE progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER UNIQUE NOT NULL,
    ease_factor REAL DEFAULT 2.5,
    interval INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    next_review DATE,
    status TEXT DEFAULT 'new', -- new, learning, review, mastered
    last_reviewed DATETIME,
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

-- Daily statistics
CREATE TABLE stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    words_learned INTEGER DEFAULT 0,
    words_reviewed INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- seconds
    xp_earned INTEGER DEFAULT 0
);

-- User settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Achievements
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT UNIQUE NOT NULL,
    unlocked_at DATETIME
);

-- Indexes for performance
CREATE INDEX idx_words_deck ON words(deck_id);
CREATE INDEX idx_progress_next_review ON progress(next_review);
CREATE INDEX idx_progress_status ON progress(status);
CREATE INDEX idx_stats_date ON stats(date);
```

---

## 6. THIẾT KẾ GIAO DIỆN (UI/UX Design)

### 6.1 Layout chính
```
┌─────────────────────────────────────────────────────────────┐
│  ─ □ ✕  VocabMaster                                         │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────────────────────────────────────┐ │
│ │          │ │                                            │ │
│ │  🏠 Home │ │                                            │ │
│ │          │ │                                            │ │
│ │  📚 Learn│ │              MAIN CONTENT                  │ │
│ │          │ │                                            │ │
│ │  📁 Decks│ │                                            │ │
│ │          │ │                                            │ │
│ │  📊 Stats│ │                                            │ │
│ │          │ │                                            │ │
│ │  ⚙️ Settings                                            │ │
│ │          │ │                                            │ │
│ └──────────┘ └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Home Screen
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   Good morning! 👋                     🔥 Streak: 15 days  │
│                                                            │
│   ┌────────────────────────────────────────────────────┐   │
│   │  TODAY'S PROGRESS                                  │   │
│   │  ████████████░░░░░░░░  16/20 words                 │   │
│   │                                                    │   │
│   │  [  🎯 Continue Learning  ]                        │   │
│   └────────────────────────────────────────────────────┘   │
│                                                            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│   │  📝 New      │  │  🔄 Review   │  │  ✅ Mastered │    │
│   │     45       │  │     23       │  │     120      │    │
│   └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                            │
│   RECENT DECKS                                             │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│   │ 📕 IELTS   │ │ 📗 TOEIC   │ │ 📘 Daily   │            │
│   │ 120 words  │ │ 85 words   │ │ 50 words   │            │
│   └────────────┘ └────────────┘ └────────────┘            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 6.3 Flashcard Screen
```
┌────────────────────────────────────────────────────────────┐
│   ← Back                    IELTS Vocabulary         3/20  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│         ┌────────────────────────────────────────┐         │
│         │                                        │         │
│         │                                        │         │
│         │            ABUNDANT                    │         │
│         │           /əˈbʌndənt/                  │         │
│         │              🔊                        │         │
│         │                                        │         │
│         │         [ Click to flip ]              │         │
│         │                                        │         │
│         │                                        │         │
│         └────────────────────────────────────────┘         │
│                                                            │
│                                                            │
│      ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│      │   😟    │    │   🤔    │    │   😊    │            │
│      │  Again  │    │  Good   │    │  Easy   │            │
│      │   [1]   │    │   [2]   │    │   [3]   │            │
│      └─────────┘    └─────────┘    └─────────┘            │
│                                                            │
│   Keyboard: [Space] Flip  [1] Again  [2] Good  [3] Easy   │
└────────────────────────────────────────────────────────────┘
```

### 6.4 Mini Mode (Floating Window)
```
┌──────────────────────────┐
│  VocabMaster    ─ □ ✕   │
├──────────────────────────┤
│                          │
│      ABUNDANT            │
│     /əˈbʌndənt/ 🔊       │
│                          │
│  ───────────────────     │
│                          │
│   dồi dào, phong phú     │
│                          │
├──────────────────────────┤
│  [Again] [Good] [Easy]   │
└──────────────────────────┘
```

### 6.5 Design System

#### Color Palette
```css
/* Light Mode */
--primary: #6C63FF;
--secondary: #FF6B6B;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--background: #F8FAFC;
--surface: #FFFFFF;
--text: #1E293B;
--text-secondary: #64748B;

/* Dark Mode */
--background-dark: #0F172A;
--surface-dark: #1E293B;
--text-dark: #F1F5F9;
```

#### Typography
```css
--font-family: 'Inter', 'Segoe UI', sans-serif;
--heading-1: 32px / 700;
--heading-2: 24px / 600;
--heading-3: 20px / 600;
--body: 16px / 400;
--caption: 14px / 400;
```

---

## 7. THUẬT TOÁN SPACED REPETITION (SM-2)

### 7.1 Implementation
```typescript
interface Progress {
  easeFactor: number;  // >= 1.3
  interval: number;    // days
  repetitions: number;
  nextReview: Date;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

type Quality = 1 | 2 | 3; // Again, Good, Easy

function calculateNextReview(progress: Progress, quality: Quality): Progress {
  let { easeFactor, interval, repetitions } = progress;
  
  // Map quality: 1=Again(0), 2=Good(3), 3=Easy(5)
  const q = quality === 1 ? 0 : quality === 2 ? 3 : 5;

  if (q < 3) {
    // Wrong answer - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Correct answer
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  // Update status
  let status: Progress['status'];
  if (repetitions === 0) status = 'learning';
  else if (interval >= 21) status = 'mastered';
  else status = 'review';

  return { easeFactor, interval, repetitions, nextReview, status };
}
```

---

## 8. CẤU TRÚC THƯ MỤC DỰ ÁN

```
VocabMaster/
├── electron/                    # Electron main process
│   ├── main.ts                  # Main entry point
│   ├── preload.ts               # Preload script
│   ├── ipc/                     # IPC handlers
│   │   ├── database.ts
│   │   ├── tts.ts
│   │   └── window.ts
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrations.ts
│   │   └── queries/
│   │       ├── decks.ts
│   │       ├── words.ts
│   │       └── progress.ts
│   └── utils/
│       └── paths.ts
│
├── src/                         # React renderer process
│   ├── main.tsx                 # React entry
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── flashcard/
│   │   │   ├── FlashCard.tsx
│   │   │   └── FlipCard.tsx
│   │   ├── deck/
│   │   │   ├── DeckCard.tsx
│   │   │   └── DeckForm.tsx
│   │   └── stats/
│   │       ├── ProgressChart.tsx
│   │       └── StreakCalendar.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Learn.tsx
│   │   ├── Decks.tsx
│   │   ├── DeckDetail.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   │
│   ├── store/
│   │   ├── index.ts
│   │   ├── deckStore.ts
│   │   ├── learningStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── useFlashcard.ts
│   │   └── useTTS.ts
│   │
│   ├── utils/
│   │   ├── sm2.ts
│   │   └── date.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── styles/
│       └── globals.css
│
├── resources/                   # App resources
│   └── icon.ico
│
├── package.json
├── electron-builder.json        # Build config
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 9. BUILD & DISTRIBUTION

### 9.1 electron-builder.json
```json
{
  "appId": "com.vocabmaster.app",
  "productName": "VocabMaster",
  "directories": {
    "output": "dist-electron"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "resources/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },
  "portable": {
    "artifactName": "VocabMaster-Portable.exe"
  }
}
```

### 9.2 Output Files
```
dist-electron/
├── VocabMaster Setup 1.0.0.exe    # Installer
└── VocabMaster-Portable.exe        # Portable (không cần cài)
```

---

## 10. KẾ HOẠCH TRIỂN KHAI

### Phase 1: Setup (Ngày 1-2)
- [ ] Khởi tạo project Electron + React + Vite
- [ ] Cấu hình TypeScript, Tailwind CSS
- [ ] Setup SQLite database
- [ ] Tạo cấu trúc thư mục

### Phase 2: Core UI (Ngày 3-5)
- [ ] Sidebar navigation
- [ ] Home dashboard
- [ ] Deck list & detail screens
- [ ] Add/Edit word forms

### Phase 3: Learning Features (Ngày 6-8)
- [ ] Flashcard component với flip animation
- [ ] SM-2 algorithm implementation
- [ ] Text-to-Speech integration
- [ ] Keyboard shortcuts

### Phase 4: Statistics & Gamification (Ngày 9-10)
- [ ] Daily streak tracking
- [ ] Progress charts
- [ ] XP system
- [ ] Desktop notifications

### Phase 5: Polish & Build (Ngày 11-12)
- [ ] Dark/Light mode
- [ ] Mini mode window
- [ ] System tray
- [ ] Build .exe installer

---

## 11. KEYBOARD SHORTCUTS

| Phím | Chức năng |
|------|-----------|
| `Space` | Lật thẻ flashcard |
| `1` | Đánh giá: Again |
| `2` | Đánh giá: Good |
| `3` | Đánh giá: Easy |
| `Ctrl+N` | Thêm từ mới |
| `Ctrl+F` | Tìm kiếm |
| `Ctrl+M` | Toggle Mini Mode |
| `Ctrl+,` | Mở Settings |
| `Esc` | Đóng modal/quay lại |

---

## 12. TÍNH NĂNG NÂNG CAO (Future)

- [ ] Cloud sync (Google Drive/Dropbox)
- [ ] Import từ Anki/Quizlet
- [ ] OCR - Chụp ảnh để thêm từ
- [ ] AI-generated examples
- [ ] Multiplayer quiz mode
- [ ] Browser extension để save từ

---

**Document Version**: 1.0  
**Platform**: Windows Desktop (.exe)  
**Technology**: Electron + React + TypeScript  
**Last Updated**: November 2024
