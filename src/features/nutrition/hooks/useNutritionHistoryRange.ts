import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getNutritionByDateRangeForUser } from '@/features/nutrition/services/nutritionRepository';
import type { TodayNutritionData } from '@types/nutrition';

export type NutritionHistoryRange = 'week' | 'month' | 'year';

interface UseNutritionHistoryRangeResult {
  dataByDay: Record<string, TodayNutritionData>;
  loading: boolean;
  error: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getRangeDates(range: NutritionHistoryRange, base: Date): { start: Date; end: Date } {
  const baseDay = startOfDay(base);

  if (range === 'week') {
    const dayOfWeek = baseDay.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (dayOfWeek + 6) % 7; // 0 = Monday
    const start = addDays(baseDay, -diffToMonday);
    const end = addDays(start, 6);
    return { start, end };
  }

  if (range === 'month') {
    const start = new Date(baseDay.getFullYear(), baseDay.getMonth(), 1);
    const end = new Date(baseDay.getFullYear(), baseDay.getMonth() + 1, 0);
    return { start, end };
  }

  // year
  const start = new Date(baseDay.getFullYear(), 0, 1);
  const end = new Date(baseDay.getFullYear(), 11, 31);
  return { start, end };
}

export function useNutritionHistoryRange(
  range: NutritionHistoryRange,
  baseDate: Date,
): UseNutritionHistoryRangeResult {
  const { user } = useAuth();
  const [dataByDay, setDataByDay] = useState<Record<string, TodayNutritionData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      setDataByDay({});
      setStartDate(null);
      setEndDate(null);
      return;
    }

    const { start, end } = getRangeDates(range, baseDate);
    setStartDate(start);
    setEndDate(end);

    setLoading(true);
    setError(null);

    getNutritionByDateRangeForUser(user.uid, start, end)
      .then((result) => {
        setDataByDay(result);
      })
      .catch((err) => {
        console.error(err);
        setError('No se ha podido cargar el histórico de nutrición.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, range, baseDate]);

  return { dataByDay, loading, error, startDate, endDate };
}
