import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getNutritionByDateRangeForUser } from '@/features/nutrition/services/nutritionRepository';
import type { TodayNutritionData } from '@types/nutrition';

interface UseMonthlyNutritionResult {
  dataByDay: Record<string, TodayNutritionData>;
  loading: boolean;
  error: string | null;
}

export function useMonthlyNutrition(year: number, month: number): UseMonthlyNutritionResult {
  const { user } = useAuth();
  const [dataByDay, setDataByDay] = useState<Record<string, TodayNutritionData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDataByDay({});
      return;
    }

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

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
  }, [user, year, month]);

  return { dataByDay, loading, error };
}
