import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getNutritionByDateRangeForUser } from '@/features/nutrition/services/nutritionRepository';
import type { TodayNutritionEntrySummary, TodayNutritionData } from '@types/nutrition';

interface UseThisMonthNutritionEntriesResult {
  entries: TodayNutritionEntrySummary[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function getThisMonthRange(): { start: Date; end: Date } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start, end };
}

function flattenDataByDay(dataByDay: Record<string, TodayNutritionData>): TodayNutritionEntrySummary[] {
  const allEntries: TodayNutritionEntrySummary[] = [];

  const sortedKeys = Object.keys(dataByDay).sort((a, b) => b.localeCompare(a));

  sortedKeys.forEach((dayKey) => {
    const dayData = dataByDay[dayKey];
    if (!dayData) return;
    allEntries.push(...dayData.entries);
  });

  allEntries.sort((a, b) => b.fecha.localeCompare(a.fecha));

  return allEntries;
}

export function useThisMonthNutritionEntries(): UseThisMonthNutritionEntriesResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TodayNutritionEntrySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = (userId: string) => {
    const { start, end } = getThisMonthRange();

    setLoading(true);
    setError(null);

    getNutritionByDateRangeForUser(userId, start, end)
      .then((dataByDay) => {
        setEntries(flattenDataByDay(dataByDay));
      })
      .catch((err) => {
        console.error(err);
        setError('No se han podido cargar los registros de nutrición de este mes.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    load(user.uid);
  }, [user]);

  return {
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
