import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { GameProvider, useGame } from './context/GameContext';

// Mode Selection
import ModeSelect from './components/ModeSelect';

// Local Game (Original)
import LocalGame from './components/LocalGame';

// Online Game Screens
import HomeScreen from './components/screens/HomeScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import VotingScreen from './components/screens/VotingScreen';
import ResultsScreen from './components/screens/ResultsScreen';
import JoinHandler from './components/JoinHandler';
import KickedModal from './components/KickedModal';

// Wrapper to show kicked modal
const KickedModalWrapper = () => {
  const { wasKicked, dismissKicked } = useGame();
  return <KickedModal isOpen={wasKicked} onClose={dismissKicked} />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <div className="app-container">
            <Routes>
              {/* Mode Selection */}
              <Route path="/" element={<ModeSelect />} />

              {/* Local Game (Pass-the-Phone) */}
              <Route path="/local" element={<LocalGame />} />

              {/* Online Game - Create/Join */}
              <Route path="/online" element={<HomeScreen />} />

              {/* Direct room link - redirects to lobby or shows join modal */}
              <Route path="/room/:code" element={<JoinHandler />} />

              {/* Join with pre-filled code */}
              <Route path="/join/:code" element={<JoinHandler />} />

              {/* Online Game flow routes */}
              <Route path="/room/:code/lobby" element={<LobbyScreen />} />
              <Route path="/room/:code/game" element={<GameScreen />} />
              <Route path="/room/:code/vote" element={<VotingScreen />} />
              <Route path="/room/:code/results" element={<ResultsScreen />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <KickedModalWrapper />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 2000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
