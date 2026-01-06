import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getTodayNutritionForUser } from '@/features/nutrition/services/nutritionRepository';
import type { TodayNutritionSummary, TodayNutritionEntrySummary } from '@types/nutrition';

interface UseTodayNutritionResult {
  summary: TodayNutritionSummary | null;
  entries: TodayNutritionEntrySummary[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useTodayNutrition(): UseTodayNutritionResult {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TodayNutritionSummary | null>(null);
  const [entries, setEntries] = useState<TodayNutritionEntrySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = (userId: string) => {
    setLoading(true);
    setError(null);

    getTodayNutritionForUser(userId)
      .then((data) => {
        setSummary(data.summary);
        setEntries(data.entries);
      })
      .catch((err) => {
        console.error(err);
        setError('No se ha podido cargar la nutrición de hoy.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) {
      setSummary(null);
      setEntries([]);
      return;
    }

    load(user.uid);
  }, [user]);

  return {
    summary,
    entries,
    loading,
    error,
    reload: () => {
      if (user) {
        load(user.uid);
      }
    },
  };
}
