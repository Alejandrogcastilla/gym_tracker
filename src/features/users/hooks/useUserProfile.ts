import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserProfileById } from '@/features/users/services/userRepository';
import type { UserProfile } from '@/types/user';

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = (userId: string) => {
    setLoading(true);
    setError(null);

    getUserProfileById(userId)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error(err);
        setError('No se ha podido cargar tu perfil.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    loadProfile(user.uid);
  }, [user]);

  return {
    profile,
    loading,
    error,
    reload: () => {
      if (user) {
        loadProfile(user.uid);
      }
    },
  };
}
