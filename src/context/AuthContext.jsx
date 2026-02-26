import { createContext, useContext, useState, useEffect } from 'react';
import { initializeAuth, onAuthStateChange } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize auth on mount
    const init = async () => {
      const { user: authUser, error: authError } = await initializeAuth();

      if (authError) {
        setError(authError);
      } else {
        setUser(authUser);
      }
      setLoading(false);
    };

    init();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        // Re-initialize anonymous auth if signed out
        initializeAuth().then(({ user: newUser }) => {
          setUser(newUser);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userId: user?.id ?? null,
    loading,
    error,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
