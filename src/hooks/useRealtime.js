import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing Supabase realtime subscriptions
 * @param {string} roomId - Room ID to subscribe to
 * @param {object} callbacks - Event callbacks
 * @returns {object} - Subscription management functions
 */
export const useRealtime = (roomId, callbacks = {}) => {
  const channelRef = useRef(null);
  const {
    onRoomUpdate,
    onPlayerJoin,
    onPlayerLeave,
    onPlayerUpdate,
    onAllRevealed,
  } = callbacks;

  // Subscribe to room and player changes
  useEffect(() => {
    if (!roomId) return;

    // Create a channel for this room
    const channel = supabase.channel(`room:${roomId}`);

    // Subscribe to room changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (onRoomUpdate) {
          onRoomUpdate(payload.new);
        }
      }
    );

    // Subscribe to player inserts (joins)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (onPlayerJoin) {
          onPlayerJoin(payload.new);
        }
      }
    );

    // Subscribe to player deletes (leaves/kicks)
    // Note: No filter here because DELETE events can't filter on deleted row data
    // We pass the payload.old.id and let the callback handle filtering
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'players',
      },
      (payload) => {
        // Filter client-side: only handle if it's for our room
        if (onPlayerLeave && payload.old?.room_id === roomId) {
          onPlayerLeave(payload.old);
        }
      }
    );

    // Subscribe to player updates (reveal, vote, connection status)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (onPlayerUpdate) {
          onPlayerUpdate(payload.new, payload.old);
        }
      }
    );

    // Subscribe to the channel
    channel.subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, onRoomUpdate, onPlayerJoin, onPlayerLeave, onPlayerUpdate]);

  // Function to broadcast custom events (for things like sounds, animations)
  const broadcast = useCallback(
    (event, payload) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload,
        });
      }
    },
    []
  );

  // Subscribe to broadcast events
  const onBroadcast = useCallback(
    (event, callback) => {
      if (channelRef.current) {
        channelRef.current.on('broadcast', { event }, ({ payload }) => {
          callback(payload);
        });
      }
    },
    []
  );

  return {
    broadcast,
    onBroadcast,
  };
};

/**
 * Hook for presence tracking (online status)
 * @param {string} roomId - Room ID
 * @param {string} playerId - Current player ID
 * @param {string} playerName - Current player name
 */
export const usePresence = (roomId, playerId, playerName) => {
  const presenceChannelRef = useRef(null);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const presenceChannel = supabase.channel(`presence:${roomId}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        // Presence state synced
      })
      .on('presence', { event: 'join' }, () => {
        // Player joined presence
      })
      .on('presence', { event: 'leave' }, () => {
        // Player left presence
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            playerId,
            playerName,
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await presenceChannel.track({
          playerId,
          playerName,
          online_at: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [roomId, playerId, playerName]);
};
