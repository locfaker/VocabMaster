# VocabMaster - English Vocabulary Learning App

A desktop application for learning English vocabulary using the Spaced Repetition System (SM-2 algorithm).

## Features

- 📚 Create and manage vocabulary decks
- 🔄 Flashcard learning with flip animation
- 🧠 SM-2 Spaced Repetition algorithm
- 🔊 Text-to-Speech pronunciation
- 📊 Learning statistics and progress tracking
- 🔥 Daily streak tracking
- ⌨️ Keyboard shortcuts for fast learning
- 🌙 Dark/Light mode

## Tech Stack

- Electron
- React 18
- TypeScript
- Tailwind CSS
- SQLite (better-sqlite3)
- Zustand (state management)
- Framer Motion (animations)
- Recharts (statistics)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for Windows
npm run build:win
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Flip flashcard |
| `1` | Rate: Again |
| `2` | Rate: Good |
| `3` | Rate: Easy |
| `Ctrl+N` | Add new word |
| `Esc` | Close modal / Go back |

## Build Output

After running `npm run build:win`, you'll find:
- `release/VocabMaster Setup x.x.x.exe` - Installer
- `release/VocabMaster-Portable.exe` - Portable version

## License

MIT
