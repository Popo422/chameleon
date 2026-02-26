import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Initialize anonymous auth session
 * Creates a new anonymous user if none exists, or restores existing session
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
export const initializeAuth = async () => {
  try {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      return { user: session.user, error: null };
    }

    // No session - create anonymous user
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (err) {
    console.error('Auth initialization failed:', err);
    return { user: null, error: err.message };
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<object|null>}
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Subscribe to auth state changes
 * @param {function} callback - Called with (event, session) on auth changes
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription?.unsubscribe();
};

// Helper to get stored player name (still useful for remembering display name)
export const getStoredPlayerName = () => {
  return localStorage.getItem('chameleon_player_name');
};

export const setStoredPlayerName = (name) => {
  localStorage.setItem('chameleon_player_name', name);
};
