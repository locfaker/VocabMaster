# HỒ SƠ DỰ ÁN
# ỨNG DỤNG HỌC TỪ VỰNG TIẾNG ANH - VOCABMASTER

---

## THÔNG TIN CHUNG

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên dự án** | VocabMaster - English Vocabulary Learning App |
| **Vai trò** | Backend Developer |
| **Thời gian** | 11/02/2024 - 20/09/2025 |
| **Nền tảng** | Windows Desktop Application (.exe) |
| **Công nghệ** | Electron, TypeScript, React, SQLite |

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
VocabMaster là ứng dụng desktop giúp người Việt học từ vựng tiếng Anh hiệu quả thông qua phương pháp Spaced Repetition System (SRS) kết hợp Leitner Box System. Ứng dụng hỗ trợ nhiều chế độ học tập đa dạng và hệ thống gamification để tăng động lực học.

### 1.2 Đối tượng người dùng
- Học sinh, sinh viên
- Người đi làm muốn cải thiện tiếng Anh
- Người chuẩn bị thi IELTS, TOEIC, TOEFL

### 1.3 Mục tiêu
- Xây dựng ứng dụng học từ vựng offline-first
- Tối ưu hóa việc ghi nhớ từ vựng bằng thuật toán khoa học
- Tạo trải nghiệm học tập thú vị với gamification

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Electron 29+ |
| **Frontend** | React 18, TypeScript 5 |
| **State Management** | Zustand |
| **Database** | SQLite (sql.js) |
| **UI/Styling** | Tailwind CSS, Framer Motion |
| **Build Tool** | Vite, electron-builder |
| **Audio** | Web Speech API (Text-to-Speech) |

### 2.2 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │              MAIN PROCESS (Node.js)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Window    │  │     IPC     │  │   SQLite    │  │    │
│  │  │   Manager   │  │   Handler   │  │  Database   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │ IPC                               │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            RENDERER PROCESS (React)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │    React    │  │   Zustand   │  │     UI      │  │    │
│  │  │   Router    │  │    Store    │  │ Components  │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CHỨC NĂNG ĐÃ PHÁT TRIỂN

### 3.1 Quản lý từ vựng
- ✅ Tạo, sửa, xóa bộ từ (Deck)
- ✅ Thêm từ vựng với nghĩa, ví dụ, phiên âm
- ✅ Import từ vựng từ kho có sẵn
- ✅ Tìm kiếm từ vựng

### 3.2 Chế độ học tập
- ✅ **Flashcard Mode**: Lật thẻ học từ truyền thống
- ✅ **Quiz Mode**: Trắc nghiệm 4 đáp án
- ✅ **Typing Mode**: Gõ từ kiểm tra spelling
- ✅ **Mini Mode**: Cửa sổ floating nhỏ gọn

### 3.3 Thuật toán học tập
- ✅ **SM-2 Algorithm**: Spaced Repetition chuẩn SuperMemo
- ✅ **Leitner Box System**: Hệ thống 5 hộp học tập
- ✅ **Smart Review**: Ưu tiên từ khó, hay quên
- ✅ **Adaptive Interval**: Điều chỉnh khoảng cách ôn tập theo hiệu suất

### 3.4 Gamification
- ✅ **XP & Level System**: 10 cấp độ từ Beginner đến Legend
- ✅ **Daily Streak**: Đếm ngày học liên tục
- ✅ **Achievement System**: 14 huy hiệu thành tích
- ✅ **Progress Tracking**: Thống kê chi tiết

### 3.5 Tính năng khác
- ✅ Text-to-Speech phát âm từ vựng
- ✅ Dark/Light Mode
- ✅ Daily Reminder notification
- ✅ Export/Import dữ liệu
- ✅ Keyboard shortcuts

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU

### 4.1 Sơ đồ ERD

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    DECKS     │       │    WORDS     │       │   PROGRESS   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ name         │  │    │ deck_id (FK) │  │    │ word_id (FK) │
│ description  │  └───>│ term         │  └───>│ ease_factor  │
│ color        │       │ definition   │       │ interval     │
│ icon         │       │ example      │       │ repetitions  │
│ word_count   │       │ phonetic     │       │ leitner_box  │
│ created_at   │       │ created_at   │       │ status       │
└──────────────┘       └──────────────┘       │ next_review  │
                                              └──────────────┘

┌──────────────┐       ┌──────────────┐
│    STATS     │       │ ACHIEVEMENTS │
├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │
│ date         │       │ type         │
│ words_reviewed       │ name         │
│ correct_count│       │ xp_reward    │
│ xp_earned    │       │ unlocked_at  │
│ quiz_score   │       │ progress     │
│ typing_score │       │ target       │
└──────────────┘       └──────────────┘
```

### 4.2 Các bảng chính

| Bảng | Mô tả | Số cột |
|------|-------|--------|
| decks | Bộ từ vựng | 8 |
| words | Từ vựng | 10 |
| progress | Tiến độ học (SM-2) | 12 |
| stats | Thống kê hàng ngày | 10 |
| achievements | Huy hiệu thành tích | 8 |
| settings | Cài đặt người dùng | 2 |

---

## 5. THUẬT TOÁN HỌC TẬP

### 5.1 SM-2 Algorithm (Spaced Repetition)

```typescript
function calculateNextReview(progress, quality) {
    // quality: 1=Again, 2=Good, 3=Easy
    
    if (quality < 2) {
        // Sai - reset về đầu
        interval = 1
        repetitions = 0
    } else {
        // Đúng - tăng interval
        if (repetitions === 1) interval = 1
        else if (repetitions === 2) interval = 6
        else interval = interval * easeFactor
    }
    
    // Cập nhật ease factor
    easeFactor = max(1.3, easeFactor + 0.1 - (5-q) * 0.08)
    
    return { interval, easeFactor, nextReview }
}
```

### 5.2 Leitner Box System

| Box | Interval | Mô tả |
|-----|----------|-------|
| Box 1 | 1 ngày | Từ mới/sai |
| Box 2 | 2 ngày | Nhớ 1 lần |
| Box 3 | 4 ngày | Nhớ 2 lần |
| Box 4 | 7 ngày | Nhớ 3 lần |
| Box 5 | 14 ngày | Đã thuộc |

---

## 6. KẾT QUẢ ĐẠT ĐƯỢC

### 6.1 Sản phẩm
- ✅ Ứng dụng Windows hoàn chỉnh (.exe)
- ✅ Portable version (không cần cài đặt)
- ✅ Kích thước file < 100MB
- ✅ Hoạt động 100% offline

### 6.2 Hiệu năng
- Khởi động app: < 3 giây
- Response time: < 100ms
- RAM usage: < 200MB
- Database queries: < 50ms

### 6.3 Tính năng nổi bật
- 3 chế độ học tập (Flashcard, Quiz, Typing)
- Thuật toán SM-2 + Leitner tối ưu ghi nhớ
- 14 achievements với XP rewards
- Mini Mode học mọi lúc mọi nơi
- Daily reminder notification

---

## 7. SCREENSHOTS

*(Đính kèm ảnh chụp màn hình ứng dụng)*

1. Trang chủ Dashboard
2. Flashcard Mode
3. Quiz Mode
4. Typing Mode
5. Achievement System
6. Mini Mode
7. Settings

---

## 8. LIÊN HỆ

| Thông tin | Chi tiết |
|-----------|----------|
| **Họ tên** | Đại Lộc Võ |
| **Vai trò** | Backend Developer |
| **Website** | freelancerviet.vn/ho-so/dai-vo-1 |

---

*Tài liệu được tạo: Tháng 12/2024*
*Version: 2.0.0*
