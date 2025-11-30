# 📚 TÀI LIỆU PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
# ỨNG DỤNG HỌC TỪ VỰNG TIẾNG ANH - VOCABMASTER

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Giới thiệu
**Tên ứng dụng**: VocabMaster  
**Nền tảng**: React Native (iOS & Android)  
**Mục tiêu**: Xây dựng ứng dụng học từ vựng tiếng Anh hiệu quả với phương pháp Spaced Repetition System (SRS)

### 1.2 Phạm vi dự án
- Ứng dụng mobile cross-platform
- Hỗ trợ offline-first
- Đồng bộ dữ liệu cloud (optional)
- Gamification để tăng engagement

### 1.3 Đối tượng người dùng
- Học sinh, sinh viên
- Người đi làm muốn cải thiện tiếng Anh
- Người chuẩn bị thi IELTS, TOEIC, TOEFL

---

## 2. YÊU CẦU CHỨC NĂNG (Functional Requirements)

### 2.1 Quản lý người dùng (User Management)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-01 | Đăng ký | Email/Google/Apple Sign-in | Cao |
| FR-02 | Đăng nhập | Authentication với JWT | Cao |
| FR-03 | Quên mật khẩu | Reset password qua email | Trung bình |
| FR-04 | Cập nhật profile | Avatar, tên, mục tiêu học | Thấp |

### 2.2 Quản lý từ vựng (Vocabulary Management)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-05 | Thêm từ mới | Nhập từ, nghĩa, ví dụ, phát âm | Cao |
| FR-06 | Import từ vựng | Import từ file CSV/Excel | Trung bình |
| FR-07 | Tạo bộ từ (Deck) | Nhóm từ theo chủ đề | Cao |
| FR-08 | Tìm kiếm từ | Search trong library | Cao |
| FR-09 | Gắn tag | Phân loại từ vựng | Thấp |

### 2.3 Học tập (Learning)
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-10 | Flashcard | Lật thẻ học từ | Cao |
| FR-11 | Spaced Repetition | Thuật toán SM-2 | Cao |
| FR-12 | Quiz trắc nghiệm | 4 đáp án, chọn đúng | Cao |
| FR-13 | Điền từ | Fill in the blank | Trung bình |
| FR-14 | Nghe - Chọn từ | Listening exercise | Trung bình |
| FR-15 | Phát âm | Text-to-Speech | Cao |

### 2.4 Gamification & Thống kê
| ID | Chức năng | Mô tả | Độ ưu tiên |
|----|-----------|-------|------------|
| FR-16 | Daily Streak | Đếm ngày học liên tục | Cao |
| FR-17 | XP & Level | Điểm kinh nghiệm | Trung bình |
| FR-18 | Achievement | Huy hiệu thành tích | Thấp |
| FR-19 | Thống kê học tập | Biểu đồ tiến độ | Cao |
| FR-20 | Reminder | Push notification nhắc học | Cao |

---

## 3. YÊU CẦU PHI CHỨC NĂNG (Non-Functional Requirements)

| ID | Yêu cầu | Mô tả |
|----|---------|-------|
| NFR-01 | Performance | App load < 3s, response < 500ms |
| NFR-02 | Offline Support | Hoạt động không cần internet |
| NFR-03 | Security | Mã hóa dữ liệu nhạy cảm |
| NFR-04 | Scalability | Hỗ trợ 100k+ users |
| NFR-05 | Accessibility | Hỗ trợ VoiceOver/TalkBack |
| NFR-06 | Localization | Đa ngôn ngữ (VI, EN) |

---

## 4. KIẾN TRÚC HỆ THỐNG (System Architecture)

### 4.1 Kiến trúc tổng quan
```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React Native)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │   UI    │  │ State   │  │ Local   │  │   Services      │ │
│  │ Layer   │  │ Mgmt    │  │ Storage │  │   (API/TTS)     │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Optional)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │   API   │  │  Auth   │  │  Sync   │  │   Push          │ │
│  │ Gateway │  │ Service │  │ Service │  │   Notification  │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│         PostgreSQL / Firebase Firestore                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack
```
FRONTEND:
├── React Native 0.73+
├── TypeScript
├── State Management: Zustand / Redux Toolkit
├── Navigation: React Navigation 6
├── Local DB: WatermelonDB / SQLite
├── UI Library: React Native Paper / NativeBase
├── Animation: React Native Reanimated
└── Audio: expo-av / react-native-tts

BACKEND (Optional):
├── Node.js + Express / NestJS
├── Database: PostgreSQL + Prisma
├── Auth: Firebase Auth / Supabase
├── Storage: AWS S3 / Cloudinary
└── Push: Firebase Cloud Messaging
```

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU (Database Design)

### 5.1 Entity Relationship Diagram (ERD)
```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    USER      │       │    DECK      │       │    WORD      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ email        │  │    │ user_id (FK) │  │    │ deck_id (FK) │
│ password     │  └───>│ name         │  └───>│ term         │
│ display_name │       │ description  │       │ definition   │
│ avatar_url   │       │ is_public    │       │ example      │
│ created_at   │       │ created_at   │       │ phonetic     │
│ streak_count │       │ word_count   │       │ audio_url    │
│ total_xp     │       └──────────────┘       │ image_url    │
│ level        │                              │ created_at   │
└──────────────┘                              └──────────────┘
                                                     │
                                                     ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  LEARNING    │       │   REVIEW     │       │    TAG       │
│  PROGRESS    │       │   LOG        │       ├──────────────┤
├──────────────┤       ├──────────────┤       │ id (PK)      │
│ id (PK)      │       │ id (PK)      │       │ name         │
│ user_id (FK) │       │ progress_id  │       │ color        │
│ word_id (FK) │       │ quality      │       └──────────────┘
│ ease_factor  │       │ reviewed_at  │
│ interval     │       └──────────────┘
│ repetitions  │
│ next_review  │
│ status       │
└──────────────┘
```

### 5.2 Chi tiết bảng dữ liệu

#### Users Table
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    display_name    VARCHAR(100),
    avatar_url      TEXT,
    streak_count    INTEGER DEFAULT 0,
    total_xp        INTEGER DEFAULT 0,
    level           INTEGER DEFAULT 1,
    daily_goal      INTEGER DEFAULT 20,
    reminder_time   TIME,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Words Table
```sql
CREATE TABLE words (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id         UUID REFERENCES decks(id) ON DELETE CASCADE,
    term            VARCHAR(255) NOT NULL,
    definition      TEXT NOT NULL,
    example         TEXT,
    phonetic        VARCHAR(100),
    audio_url       TEXT,
    image_url       TEXT,
    part_of_speech  VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Learning Progress Table (SM-2 Algorithm)
```sql
CREATE TABLE learning_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    word_id         UUID REFERENCES words(id) ON DELETE CASCADE,
    ease_factor     DECIMAL(3,2) DEFAULT 2.50,
    interval        INTEGER DEFAULT 0,
    repetitions     INTEGER DEFAULT 0,
    next_review     DATE,
    status          VARCHAR(20) DEFAULT 'new',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, word_id)
);
```

---

## 6. THIẾT KẾ API (API Design)

### 6.1 RESTful API Endpoints

#### Authentication
```
POST   /api/v1/auth/register        - Đăng ký tài khoản
POST   /api/v1/auth/login           - Đăng nhập
POST   /api/v1/auth/logout          - Đăng xuất
POST   /api/v1/auth/refresh-token   - Làm mới token
POST   /api/v1/auth/forgot-password - Quên mật khẩu
```

#### Users
```
GET    /api/v1/users/me             - Lấy thông tin user
PUT    /api/v1/users/me             - Cập nhật profile
GET    /api/v1/users/me/stats       - Thống kê học tập
GET    /api/v1/users/me/achievements - Danh sách thành tích
```

#### Decks
```
GET    /api/v1/decks                - Danh sách deck
POST   /api/v1/decks                - Tạo deck mới
GET    /api/v1/decks/:id            - Chi tiết deck
PUT    /api/v1/decks/:id            - Cập nhật deck
DELETE /api/v1/decks/:id            - Xóa deck
GET    /api/v1/decks/public         - Deck công khai
```

#### Words
```
GET    /api/v1/decks/:deckId/words  - Danh sách từ trong deck
POST   /api/v1/decks/:deckId/words  - Thêm từ mới
PUT    /api/v1/words/:id            - Cập nhật từ
DELETE /api/v1/words/:id            - Xóa từ
POST   /api/v1/words/import         - Import từ file
```

#### Learning
```
GET    /api/v1/learn/today          - Từ cần học hôm nay
POST   /api/v1/learn/review         - Ghi nhận kết quả review
GET    /api/v1/learn/progress       - Tiến độ học tập
```

### 6.2 API Response Format
```json
{
    "success": true,
    "data": { },
    "message": "Success",
    "meta": {
        "page": 1,
        "limit": 20,
        "total": 100
    }
}
```

---

## 7. THIẾT KẾ GIAO DIỆN (UI/UX Design)

### 7.1 Wireframe - Luồng màn hình chính
```
┌─────────────────────────────────────────────────────────────┐
│                      APP NAVIGATION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│   │ Splash  │───>│ Onboard │───>│  Auth   │───>│  Main   │  │
│   │ Screen  │    │ Screen  │    │ Screen  │    │  Tab    │  │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│                                                      │       │
│                    ┌─────────────────────────────────┘       │
│                    ▼                                         │
│   ┌────────────────────────────────────────────────────┐    │
│   │                  BOTTOM TAB NAV                     │    │
│   ├──────────┬──────────┬──────────┬──────────────────┤    │
│   │   Home   │  Learn   │  Decks   │     Profile      │    │
│   │    🏠    │    📚    │    📁    │        👤        │    │
│   └──────────┴──────────┴──────────┴──────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Chi tiết màn hình

#### Home Screen
```
┌─────────────────────────────┐
│  Good morning, Minh! 👋     │
│  🔥 Streak: 15 days         │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   TODAY'S GOAL        │  │
│  │   ████████░░  16/20   │  │
│  │   words reviewed      │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  📊 Weekly Progress         │
│  ┌───────────────────────┐  │
│  │ M  T  W  T  F  S  S   │  │
│  │ █  █  █  █  ░  ░  ░   │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  [  🎯 Start Learning  ]    │
├─────────────────────────────┤
│  Recent Decks               │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │IELTS│ │TOEIC│ │Daily│   │
│  │ 120 │ │ 85  │ │ 50  │   │
│  └─────┘ └─────┘ └─────┘   │
└─────────────────────────────┘
```

#### Flashcard Screen
```
┌─────────────────────────────┐
│  ←  IELTS Vocabulary   3/20 │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │                       │  │
│  │     ABUNDANT          │  │
│  │     /əˈbʌndənt/       │  │
│  │        🔊             │  │
│  │                       │  │
│  │   [ Tap to flip ]     │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 😟  │ │ 🤔  │ │ 😊  │   │
│  │Hard │ │Good │ │Easy │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
└─────────────────────────────┘
```

### 7.3 Design System

#### Color Palette
```
Primary:     #6C63FF (Purple)
Secondary:   #FF6B6B (Coral)
Success:     #4CAF50 (Green)
Warning:     #FFC107 (Amber)
Error:       #F44336 (Red)
Background:  #F5F5F5 (Light Gray)
Surface:     #FFFFFF (White)
Text:        #212121 (Dark Gray)
```

#### Typography
```
Font Family: Inter / SF Pro Display
Heading 1:   32px, Bold
Heading 2:   24px, SemiBold
Body:        16px, Regular
Caption:     14px, Regular
```

---

## 8. THUẬT TOÁN SPACED REPETITION (SM-2)

### 8.1 Mô tả thuật toán
```typescript
interface ReviewResult {
  quality: 0 | 1 | 2 | 3 | 4 | 5; // 0-5 scale
}

interface LearningProgress {
  easeFactor: number;    // >= 1.3
  interval: number;      // days
  repetitions: number;
  nextReview: Date;
}

function calculateNextReview(
  progress: LearningProgress,
  quality: number
): LearningProgress {
  let { easeFactor, interval, repetitions } = progress;

  if (quality < 3) {
    // Incorrect - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Correct
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
}
```

### 8.2 Quality Rating
```
0 - Complete blackout
1 - Incorrect, but remembered upon seeing answer
2 - Incorrect, but answer seemed easy to recall
3 - Correct with serious difficulty
4 - Correct with some hesitation
5 - Perfect response
```

---

## 9. CẤU TRÚC THƯ MỤC DỰ ÁN

```
VocabMaster/
├── src/
│   ├── app/                    # App entry point
│   │   ├── App.tsx
│   │   └── navigation/
│   │       ├── RootNavigator.tsx
│   │       ├── AuthNavigator.tsx
│   │       └── MainTabNavigator.tsx
│   │
│   ├── components/             # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   ├── flashcard/
│   │   │   ├── FlashCard.tsx
│   │   │   └── FlipCard.tsx
│   │   └── stats/
│   │       ├── ProgressBar.tsx
│   │       └── StreakCounter.tsx
│   │
│   ├── screens/                # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── learn/
│   │   │   ├── LearnScreen.tsx
│   │   │   ├── FlashcardScreen.tsx
│   │   │   └── QuizScreen.tsx
│   │   ├── deck/
│   │   │   ├── DeckListScreen.tsx
│   │   │   ├── DeckDetailScreen.tsx
│   │   │   └── AddWordScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   │
│   ├── store/                  # State management
│   │   ├── index.ts
│   │   ├── authStore.ts
│   │   ├── deckStore.ts
│   │   ├── learningStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── services/               # API & external services
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── authApi.ts
│   │   │   ├── deckApi.ts
│   │   │   └── wordApi.ts
│   │   ├── database/
│   │   │   ├── schema.ts
│   │   │   └── migrations.ts
│   │   └── tts/
│   │       └── textToSpeech.ts
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useFlashcard.ts
│   │   └── useSpacedRepetition.ts
│   │
│   ├── utils/                  # Utility functions
│   │   ├── sm2Algorithm.ts
│   │   ├── dateUtils.ts
│   │   └── validators.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── deck.ts
│   │   └── word.ts
│   │
│   ├── constants/              # App constants
│   │   ├── colors.ts
│   │   ├── fonts.ts
│   │   └── config.ts
│   │
│   └── assets/                 # Static assets
│       ├── images/
│       ├── icons/
│       └── sounds/
│
├── __tests__/                  # Test files
├── android/                    # Android native code
├── ios/                        # iOS native code
├── .env.example
├── app.json
├── babel.config.js
├── metro.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 10. KẾ HOẠCH TRIỂN KHAI (Implementation Plan)

### Phase 1: Foundation (Tuần 1-2)
- [ ] Setup project với React Native CLI/Expo
- [ ] Cấu hình TypeScript, ESLint, Prettier
- [ ] Setup navigation structure
- [ ] Implement design system (colors, typography, components)
- [ ] Setup local database (WatermelonDB/SQLite)

### Phase 2: Core Features (Tuần 3-4)
- [ ] Authentication screens (Login, Register)
- [ ] Home screen với dashboard
- [ ] Deck management (CRUD)
- [ ] Word management (CRUD)
- [ ] Basic flashcard functionality

### Phase 3: Learning System (Tuần 5-6)
- [ ] Implement SM-2 algorithm
- [ ] Flashcard review flow
- [ ] Quiz mode
- [ ] Text-to-Speech integration
- [ ] Progress tracking

### Phase 4: Gamification (Tuần 7)
- [ ] Streak system
- [ ] XP & Level system
- [ ] Achievements
- [ ] Daily goals & reminders

### Phase 5: Polish & Launch (Tuần 8)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] App Store / Play Store submission

---

## 11. TESTING STRATEGY

### 11.1 Unit Tests
```typescript
// Example: SM-2 Algorithm Test
describe('SM2 Algorithm', () => {
  it('should reset interval when quality < 3', () => {
    const result = calculateNextReview(
      { easeFactor: 2.5, interval: 10, repetitions: 3 },
      2
    );
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('should increase interval on correct answer', () => {
    const result = calculateNextReview(
      { easeFactor: 2.5, interval: 6, repetitions: 2 },
      4
    );
    expect(result.interval).toBe(15);
  });
});
```

### 11.2 Integration Tests
- API integration tests
- Database operations
- Navigation flows

### 11.3 E2E Tests (Detox)
- User registration flow
- Learning session flow
- Deck creation flow

---

## 12. SECURITY CONSIDERATIONS

| Aspect | Implementation |
|--------|----------------|
| Authentication | JWT với refresh token rotation |
| Password | Bcrypt hashing (cost factor 12) |
| Data in Transit | HTTPS/TLS 1.3 |
| Data at Rest | SQLCipher cho local DB |
| API Security | Rate limiting, input validation |
| Sensitive Data | Secure storage (Keychain/Keystore) |

---

## 13. PERFORMANCE OPTIMIZATION

- **Lazy Loading**: Load screens on demand
- **Image Optimization**: Cached images, proper sizing
- **List Virtualization**: FlatList với windowSize optimization
- **Memoization**: React.memo, useMemo, useCallback
- **Database Indexing**: Index trên frequently queried columns
- **Bundle Size**: Code splitting, tree shaking

---

## 14. MONITORING & ANALYTICS

| Tool | Purpose |
|------|---------|
| Firebase Analytics | User behavior tracking |
| Crashlytics | Crash reporting |
| Sentry | Error monitoring |
| Performance Monitoring | App performance metrics |

---

## 15. PHỤ LỤC

### 15.1 Glossary
- **SRS**: Spaced Repetition System
- **SM-2**: SuperMemo 2 Algorithm
- **Deck**: Bộ thẻ từ vựng
- **Ease Factor**: Hệ số dễ nhớ của từ
- **Interval**: Khoảng cách giữa các lần ôn tập

### 15.2 References
- [SM-2 Algorithm](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [React Native Documentation](https://reactnative.dev/)
- [WatermelonDB](https://nozbe.github.io/WatermelonDB/)

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Author**: Software Engineer
