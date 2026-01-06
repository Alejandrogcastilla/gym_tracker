import { collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type {
  NutritionEntry,
  TodayNutritionSummary,
  TodayNutritionEntrySummary,
  TodayNutritionData,
} from '@types/nutrition';

const nutritionCollection = collection(firebaseDb, 'nutricion');

function getTodayDateRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const prefix = `${year}${month}${day}`; // yyyymmdd
  return {
    start: `${prefix}00`,
    end: `${prefix}23`,
  };
}

export async function getTodayNutritionForUser(userId: string): Promise<TodayNutritionData> {
  const { start, end } = getTodayDateRange();

  const q = query(
    nutritionCollection,
    where('id_usuario', '==', userId),
    where('fecha', '>=', start),
    where('fecha', '<=', end),
  );

  const snapshot = await getDocs(q);

  let proteinas = 0;
  let hidratos = 0;
  let grasas = 0;
  let verduras = 0;
  const entries: TodayNutritionEntrySummary[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as NutritionEntry;

    const p = data.proteinas || 0;
    const h = data.hidratos || 0;
    const g = data.grasas || 0;
    const v = data.verduras || 0;
    const totalCalories = p + h + g + v;

    proteinas += p;
    hidratos += h;
    grasas += g;
    verduras += v;

    entries.push({
      id: docSnap.id,
      fecha: data.fecha,
      proteinas: p,
      hidratos: h,
      grasas: g,
      verduras: v,
      totalCalories,
      titulo: data.titulo ?? null,
      notas: data.notas ?? null,
    });
  });

  entries.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const summary: TodayNutritionSummary = {
    totalCalories: proteinas + hidratos + grasas + verduras,
    proteinas,
    hidratos,
    grasas,
    verduras,
  };

  return {
    summary,
    entries,
  };
}

export async function getNutritionByDateRangeForUser(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<Record<string, TodayNutritionData>> {
  const yearStart = startDate.getFullYear();
  const monthStart = String(startDate.getMonth() + 1).padStart(2, '0');
  const dayStart = String(startDate.getDate()).padStart(2, '0');
  const startPrefix = `${yearStart}${monthStart}${dayStart}`;

  const yearEnd = endDate.getFullYear();
  const monthEnd = String(endDate.getMonth() + 1).padStart(2, '0');
  const dayEnd = String(endDate.getDate()).padStart(2, '0');
  const endPrefix = `${yearEnd}${monthEnd}${dayEnd}`;

  const q = query(
    nutritionCollection,
    where('id_usuario', '==', userId),
    where('fecha', '>=', `${startPrefix}00`),
    where('fecha', '<=', `${endPrefix}23`),
  );

  const snapshot = await getDocs(q);

  const result: Record<string, TodayNutritionData> = {};

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as NutritionEntry;
    const dayKey = (data.fecha || '').slice(0, 8);

    if (!dayKey) {
      return;
    }

    if (!result[dayKey]) {
      result[dayKey] = {
        summary: {
          totalCalories: 0,
          proteinas: 0,
          hidratos: 0,
          grasas: 0,
          verduras: 0,
        },
        entries: [],
      };
    }

    const p = data.proteinas || 0;
    const h = data.hidratos || 0;
    const g = data.grasas || 0;
    const v = data.verduras || 0;
    const totalCalories = p + h + g + v;

    const entrySummary: TodayNutritionEntrySummary = {
      id: docSnap.id,
      fecha: data.fecha,
      proteinas: p,
      hidratos: h,
      grasas: g,
      verduras: v,
      totalCalories,
      titulo: data.titulo ?? null,
      notas: data.notas ?? null,
    };

    result[dayKey].summary.proteinas += p;
    result[dayKey].summary.hidratos += h;
    result[dayKey].summary.grasas += g;
    result[dayKey].summary.verduras += v;
    result[dayKey].summary.totalCalories += totalCalories;

    result[dayKey].entries.push(entrySummary);
  });

  Object.values(result).forEach((dayData) => {
    dayData.entries.sort((a, b) => a.fecha.localeCompare(b.fecha));
  });

  return result;
}
