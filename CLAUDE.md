# Chameleon Game - Project Overview

## Description
Mobile-first React web app implementation of the Chameleon board game with **online multiplayer** via Supabase. Supports both English and Filipino languages.

## Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Anonymous Auth)
- **Styling**: CSS with Framer Motion animations
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Key Features
- **Online multiplayer**: Real-time room-based gameplay with 3-8 players
- **Room codes**: 6-character codes to join games (e.g., "ABC123")
- **Host controls**: Start game, kick players, change settings
- **Filipino mode**: Toggle between English and Filipino topics
- **Voting system**: Timed voting phase to find the chameleon
- **Sound effects**: Custom Web Audio API sounds
- **Mobile optimized**: Responsive design

## Project Structure
```
chameleon-game/
├── src/
│   ├── components/
│   │   ├── screens/
│   │   │   ├── LobbyScreen.jsx      # Waiting room before game starts
│   │   │   ├── GameScreen.jsx       # Role reveal phase
│   │   │   ├── VotingScreen.jsx     # Voting phase
│   │   │   └── ResultsScreen.jsx    # Round results
│   │   ├── ModeSelect.jsx           # Choose create/join room
│   │   ├── CreateRoom.jsx           # Host creates a room
│   │   ├── JoinRoom.jsx             # Player joins via code
│   │   ├── JoinHandler.jsx          # Handles /room/:code URLs
│   │   ├── PlayerList.jsx           # Shows players with kick option
│   │   ├── KickedModal.jsx          # Modal when player is kicked
│   │   ├── WordBoard.jsx            # 4x4 grid of topic words
│   │   └── ChameleonIcon.jsx        # Long-press reveal icon
│   ├── context/
│   │   ├── AuthContext.jsx          # Supabase anonymous auth
│   │   └── GameContext.jsx          # Central game state
│   ├── hooks/
│   │   ├── useRoom.js               # Room CRUD operations
│   │   ├── useRealtime.js           # Supabase realtime subscriptions
│   │   ├── useVoting.js             # Voting logic and timer
│   │   └── useSounds.js             # Web Audio API sounds
│   ├── lib/
│   │   └── supabase.js              # Supabase client config
│   ├── data/
│   │   └── topics.json              # English & Filipino topics
│   └── App.jsx                      # Routes and providers
├── supabase-schema.sql              # Database schema
├── SUPABASE_SETUP.md                # Setup guide
└── .env                             # Supabase credentials (not committed)
```

## Game Flow
1. **Mode Select**: Create or join a room
2. **Lobby**: Wait for players, host configures settings
3. **Game Phase**: Each player reveals their role (chameleon or word)
4. **Discussion**: Players discuss to find the chameleon
5. **Voting Phase**: Timed voting to accuse a player
6. **Results**: Reveal chameleon, show votes, option for new round

## Supabase Architecture

### Tables
- **rooms**: Game sessions with status, topic, secret word, chameleon_id
- **players**: Players linked to rooms with auth_user_id, is_host, vote_target_id

### Row Level Security (RLS)
- Anyone authenticated can read rooms/players
- Only host can update rooms (when `host_id IS NULL` OR user is host)
- Users can only update their own player record
- Host can kick (delete) any player in their room

### Realtime Subscriptions
- Room updates (status changes, game start)
- Player joins/leaves/updates
- Requires `REPLICA IDENTITY FULL` on players table for DELETE events

## Important Implementation Details

### Anonymous Auth
- Users get anonymous Supabase session on first visit
- Session persists in localStorage
- `auth_user_id` links player records to auth session

### Host Privileges
- `is_host: true` on player record
- `host_id` on room points to host's player ID
- Only host can: start game, kick players, change settings, start voting

### Realtime Gotchas
- DELETE events don't support server-side filtering
- Must use `REPLICA IDENTITY FULL` to get old row data on DELETE
- Client-side filtering: `payload.old?.room_id === roomId`

### Room Rejoin on Refresh
- LobbyScreen checks if user is in room via `getRoomByCode`
- If not in room, redirects to join page
- Connection status updated on rejoin

## Common Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Known Issues & Solutions

### Issue: Start Game does nothing
- **Cause**: `host_id` is NULL, RLS blocks update
- **Fix**: RLS policy now allows update when `host_id IS NULL`

### Issue: Kicked player notification not showing
- **Cause**: DELETE events need `REPLICA IDENTITY FULL`
- **Fix**: `ALTER TABLE players REPLICA IDENTITY FULL;`

### Issue: Player leave not detected
- **Cause**: Server-side filter on DELETE doesn't work
- **Fix**: Remove filter, do client-side check on `payload.old.room_id`

### Issue: Refresh shows "not found"
- **Cause**: Rejoin logic failing or room state lost
- **Check**: `rejoinRoom()` in LobbyScreen useEffect

## Database Migrations
See `SUPABASE_SETUP.md` for migration SQL when updating existing databases.

## Future Enhancements
- Score tracking across rounds
- Custom word lists
- Spectator mode
- Game history
