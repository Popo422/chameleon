import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import JoinModal from './JoinModal';

/**
 * Handles direct room links and join redirects
 * - If player is already in room → redirect to appropriate screen
 * - If player has auth and was in room → attempt rejoin
 * - Otherwise → show join modal
 */
const JoinHandler = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [checking, setChecking] = useState(true);
  const hasCheckedRef = useRef(false);

  const { room, roomStatus, rejoinRoom, userId, authLoading } = useGame();

  // Helper to get the correct route based on room status
  const getRouteForStatus = (status) => {
    switch (status) {
      case 'playing':
        return `/room/${code}/game`;
      case 'voting':
        return `/room/${code}/vote`;
      case 'results':
        return `/room/${code}/results`;
      case 'lobby':
      default:
        return `/room/${code}/lobby`;
    }
  };

  // Wait for auth to be ready, then check room status
  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // Prevent duplicate checks
    if (hasCheckedRef.current) return;

    const checkAndRedirect = async () => {
      hasCheckedRef.current = true;

      // If already in this room, redirect based on status
      if (room && room.code === code) {
        setChecking(false);
        navigate(getRouteForStatus(roomStatus), { replace: true });
        return;
      }

      // If we have auth, try to rejoin (user might be in this room already)
      if (userId) {
        const result = await rejoinRoom(code);

        if (result.success) {
          // Rejoin worked - let the roomStatus effect handle navigation
          return;
        }
      }

      // Not in room or rejoin failed - show join modal
      setShowJoin(true);
      setChecking(false);
    };

    checkAndRedirect();
  }, [code, room, roomStatus, rejoinRoom, navigate, userId, authLoading]);

  // Navigate when room is successfully joined/rejoined and status changes
  useEffect(() => {
    if (room && room.code === code && !showJoin) {
      setChecking(false);
      navigate(getRouteForStatus(roomStatus), { replace: true });
    }
  }, [room, roomStatus, code, navigate, showJoin]);

  const handleJoinSuccess = () => {
    navigate(`/room/${code}/lobby`, { replace: true });
  };

  const handleClose = () => {
    navigate('/', { replace: true });
  };

  // Show loading while auth is initializing or checking room
  if (authLoading || (checking && !showJoin)) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="join-handler">
      <JoinModal
        isOpen={showJoin}
        onClose={handleClose}
        onSuccess={handleJoinSuccess}
        initialCode={code}
      />
    </div>
  );
};

export default JoinHandler;
