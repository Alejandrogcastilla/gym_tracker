import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getNutritionByDateRangeForUser } from '@/features/nutrition/services/nutritionRepository';
import type { TodayNutritionEntrySummary, TodayNutritionData } from '@types/nutrition';

interface UseLast7DaysNutritionEntriesResult {
  entries: TodayNutritionEntrySummary[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function getLast7DaysRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  start.setDate(start.getDate() - 6);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return { start, end: endDay };
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

export function useLast7DaysNutritionEntries(): UseLast7DaysNutritionEntriesResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TodayNutritionEntrySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = (userId: string) => {
    const { start, end } = getLast7DaysRange();

    setLoading(true);
    setError(null);

    getNutritionByDateRangeForUser(userId, start, end)
      .then((dataByDay) => {
        setEntries(flattenDataByDay(dataByDay));
      })
      .catch((err) => {
        console.error(err);
        setError('No se han podido cargar los últimos registros de nutrición.');
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
