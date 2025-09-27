# L1xi - Cross-Platform Language Flashcard App

A comprehensive language learning flashcard application with spaced repetition, supporting web, desktop, and browser extension platforms.

## 🌟 Features

### Core Features

- 🧠 **Smart Spaced Repetition**: SM-2 algorithm for optimal review scheduling
- 📚 **Deck Management**: Organize flashcards into themed collections
- 🃏 **Rich Flashcards**: Support for text, pronunciation, examples, notes, images, and audio
- 🌍 **Multi-language Support**: Support for various language pairs and alphabets
- � **Progress Tracking**: Detailed analytics and study statistics
- 🔐 **User Authentication**: Secure JWT-based authentication system

### Platform Support

- 🌐 **Web Application**: Responsive React app with modern UI
- 🖥️ **Desktop Application**: Cross-platform Electron app (Windows, macOS, Linux)
- 🔌 **Chrome Extension**: Add words from any website with context menu integration
- 📱 **Mobile-ready**: Responsive design works on all devices

### Advanced Features

- ⚡ **Real-time Sync**: All platforms sync with the same backend
- � **Customizable**: Color-coded decks, custom tags, difficulty levels
- 🔄 **Import/Export**: Backup and migrate your data
- 📈 **Analytics**: Study streaks, accuracy rates, time tracking
- 🌙 **Dark Mode**: Eye-friendly dark theme support
- 🔍 **Search & Filter**: Quickly find cards and decks

## 📁 Project Structure

```
L1xi/
├── 📁 backend/           # Node.js + TypeScript + Prisma API
│   ├── src/routes/       # API endpoints
│   ├── src/middleware/   # Auth, validation, error handling
│   ├── prisma/          # Database schema and migrations
│   └── src/seed.ts      # Sample data
├── 📁 frontend/          # React + TypeScript + TailwindCSS
│   ├── src/components/   # Reusable UI components
│   ├── src/pages/       # Application pages
│   ├── src/stores/      # Zustand state management
│   └── src/lib/         # API client and utilities
├── 📁 desktop/           # Electron wrapper
│   ├── src/main.ts      # Electron main process
│   └── src/preload.ts   # Preload scripts
├── 📁 extension/         # Chrome extension
│   ├── src/background.ts # Service worker
│   ├── src/content.ts   # Content scripts
│   └── src/popup.ts     # Extension popup
├── 📁 database/          # Database configuration
├── docker-compose.yml    # Development environment
├── setup.sh             # Unix setup script
└── setup.bat            # Windows setup script
```

## 🚀 Quick Start

### Automated Setup (Recommended)

**Windows:**

```cmd
# Run the setup script
setup.bat
```

**Unix/macOS/Linux:**

```bash
# Make script executable and run
chmod +x setup.sh
./setup.sh
```

**Manual Setup:**

```bash
# Install dependencies
npm install && npm run setup:all

# Start database
docker-compose up -d

# Setup database schema
cd backend && npm run db:push && npm run db:seed

# Start development servers
npm run dev
```

### Access Points

| Service    | URL                   | Description         |
| ---------- | --------------------- | ------------------- |
| 🌐 Web App | http://localhost:3000 | Main application    |
| 🔌 API     | http://localhost:5000 | REST API            |
| 🗄️ pgAdmin | http://localhost:5050 | Database management |
| 🖥️ Desktop | `npm run dev:desktop` | Electron app        |

### Demo Account

- **Email:** demo@l1xi.com
- **Password:** password123

## 🛠️ Development

### Backend API

```bash
cd backend
npm install
npm run db:generate
npm run dev          # Start with hot reload
npm run db:reset     # Reset database
npm run db:seed      # Add sample data
```

### Frontend Web App

```bash
cd frontend
npm install
npm run dev          # Vite dev server
npm run build        # Production build
npm run lint         # ESLint checks
```

### Desktop App

```bash
cd desktop
npm install
npm run dev          # Development mode
npm run build        # Build for production
npm run electron:dist # Create installers
```

### Browser Extension

```bash
cd extension
npm install
npm run build        # Build extension
npm run build:dev    # Build with watch mode

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension/dist folder
```

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM:

- **Users**: Authentication and profile data
- **Decks**: Collections of flashcards with metadata
- **Cards**: Individual flashcards with spaced repetition data
- **Reviews**: User review history and quality ratings
- **StudySessions**: Learning session tracking

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Decks

- `GET /api/decks` - List user's decks
- `POST /api/decks` - Create new deck
- `PUT /api/decks/:id` - Update deck
- `DELETE /api/decks/:id` - Delete deck

### Cards

- `GET /api/decks/:id/cards` - Get deck cards
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `GET /api/cards/review/due` - Get cards due for review

### Reviews & Study

- `POST /api/reviews` - Submit card review
- `GET /api/reviews/stats` - Review statistics
- `POST /api/study/session/start` - Start study session

## 🔧 Configuration

### Environment Variables

**Backend (.env):**

```env
DATABASE_URL=postgresql://l1xi_user:l1xi_password@localhost:5432/l1xi_db
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
```

**Frontend (.env.development):**

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:3000
```

## 🐳 Docker Support

Start the complete development environment:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services included:

- PostgreSQL database
- Redis (for sessions/caching)
- pgAdmin (database management UI)

## 📱 Chrome Extension Features

### Context Menu Integration

- Right-click any selected text → "Add to L1xi"
- Automatically captures page context for examples
- Quick deck selection and card creation

### Popup Interface

- View study statistics
- Quick word addition
- Access to main web application
- User authentication

### Content Script

- Highlight and save words from any webpage
- Modal interface for translation input
- Seamless integration with existing pages

## 🎯 Spaced Repetition Algorithm

L1xi implements the SM-2 (SuperMemo-2) algorithm:

1. **Quality Scale**: 0-5 rating for each review
2. **Ease Factor**: Adjusted based on performance (min: 1.3)
3. **Intervals**: Calculated based on ease factor and repetition count
4. **Scheduling**: Cards appear when interval expires

**Quality Ratings:**

- 0-2: Incorrect (reset interval to 1 day)
- 3: Hard (normal interval)
- 4: Good (longer interval)
- 5: Easy (maximum interval)

## 📈 Analytics & Progress Tracking

### User Statistics

- Total decks and cards created
- Cards due for review
- Review completion rate
- Study streaks and consistency

### Session Tracking

- Time spent studying
- Cards reviewed per session
- Accuracy rates over time
- Progress visualization

## 🚀 Deployment

### Production Build

```bash
# Build all components
npm run build

# Docker production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Desktop App Distribution

```bash
cd desktop
npm run electron:dist  # Creates installers for current platform
```

### Extension Store Submission

```bash
cd extension
npm run build
npm run package  # Creates .zip for store submission
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run lints and tests: `npm run lint && npm run test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📋 Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Docker**: Latest version
- **PostgreSQL**: 15+ (via Docker)

## 🔗 Links

- [Live Demo](https://demo.l1xi.com)
- [API Documentation](https://docs.l1xi.com)
- [Chrome Extension](https://chrome.google.com/webstore/detail/l1xi)
- [Release Notes](https://github.com/yourusername/l1xi/releases)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SuperMemo](https://www.supermemo.com/) for the SM-2 algorithm
- [Anki](https://apps.ankiweb.net/) for spaced repetition inspiration
- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/) teams
- [Prisma](https://www.prisma.io/) for excellent database tooling
