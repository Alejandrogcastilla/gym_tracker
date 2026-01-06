import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthChanges } from '@services/firebase/authService';

interface UseAuthResult {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  return { user, initializing, isAuthenticated: !!user };
}
