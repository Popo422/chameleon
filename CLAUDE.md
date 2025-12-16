# Chameleon Game - Project Overview

## Description
Mobile-first React web app implementation of the Chameleon board game with pass-the-phone mechanics, supporting both English and Filipino languages.

## Key Features
- **Pass-the-phone gameplay**: Each player takes turns revealing their role
- **Long press to reveal**: Hold chameleon icon to see role/word
- **Filipino mode**: Toggle between English and Filipino topics
- **Sound effects**: Custom Web Audio API sounds for interactions
- **Mobile optimized**: Responsive design with landscape support
- **Navigation controls**: Previous/Next buttons for easy player switching
- **Role review**: Players can review roles after initial reveal phase

## Project Structure
```
chameleon-game/
├── src/
│   ├── components/
│   │   ├── GameSetup.jsx          # Initial screen with player selection
│   │   ├── PlayerIndicator.jsx    # Shows current player with navigation
│   │   ├── ChameleonIcon.jsx      # Long-press icon for role reveal
│   │   ├── RevealCard.jsx         # Shows role/word after reveal
│   │   ├── WordBoard.jsx          # 4x4 grid of topic words
│   │   ├── WordBoardModal.jsx     # Modal wrapper for word board
│   │   ├── AllPlayersRevealed.jsx # Summary screen after all reveals
│   │   └── DiscussionPhase.jsx    # Discussion phase with word board
│   ├── hooks/
│   │   ├── useGameState.js        # Central game state management
│   │   └── useSounds.js           # Web Audio API sound effects
│   ├── data/
│   │   └── topics.json            # English & Filipino topics/words
│   └── App.jsx                    # Main app component
```

## Game Flow
1. **Setup Phase**: Select number of players (3-8), toggle Filipino mode
2. **Role Assignment**: Random chameleon selection, secret word picked
3. **Reveal Phase**: Each player long-presses chameleon icon to see role
4. **Summary Screen**: Shows player count breakdown after all reveals
5. **Discussion Phase**: Players discuss and try to find chameleon

## Important Implementation Details

### Long Press Mechanism
- Uses `mousedown`/`touchstart` events
- Progress ring animation shows hold progress
- 1 second hold time to reveal
- Sound effect plays on successful reveal

### Filipino Mode
- Toggle via flag button on setup screen
- Changes topics to Filipino categories:
  - Pagkaing Pinoy (Filipino Food)
  - Artista (Celebrities)
  - Lugar sa Pilipinas (Philippine Places)
  - Salitang Pinoy (Filipino Words)
  - TV Shows
  - Mga Hayop (Animals)

### Mobile Optimizations
- Touch-friendly buttons with proper sizing
- Landscape orientation support with media queries
- Reduced font sizes for mobile screens
- Previous/Next navigation for easy player switching

### State Management
Key state properties in `useGameState`:
- `players`: Array of player objects with role info
- `currentPlayer`: Index of active player
- `secretWord`: The word non-chameleons see
- `chameleonPlayer`: Index of chameleon
- `isRevealed`: Current player's reveal status
- `allPlayersRevealed`: All players have seen roles
- `discussionStarted`: In discussion phase
- `isFilipino`: Language mode toggle
- `hasSeenSummary`: Tracks if summary was shown

### Sound System
Custom sounds using Web Audio API:
- `playClickSound()`: Button clicks (800Hz → 400Hz)
- `playRevealSound()`: Role reveals (dual oscillators)
- `playSuccessSound()`: Game actions (C-E-G chord)

## Common Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## UI/UX Notes
- Green theme throughout (#10b981 primary)
- Framer Motion for smooth animations
- React Hot Toast for notifications
- Lucide React for icons
- All text/buttons optimized for touch

## Recent Updates
- Added Filipino flag SVG button with proper colors
- Integrated Previous/Next navigation into PlayerIndicator
- Added "Back to Summary" button during role review
- Implemented Web Audio API sound effects
- Fixed bug where last player couldn't see their role

## Known Issues & Solutions
- **Issue**: Last player immediately sees summary
  - **Fix**: Added `!gameState.isRevealed` check to summary display condition
- **Issue**: UI too large on mobile
  - **Fix**: Reduced font sizes, padding, and element dimensions
- **Issue**: No landscape support
  - **Fix**: Added landscape media queries for all components

## Future Enhancements
- Timer for discussion phase
- Voting mechanism
- Score tracking across rounds
- More topic categories
- Custom word lists