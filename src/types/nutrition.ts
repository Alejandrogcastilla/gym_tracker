export interface NutritionEntry {
  id: string;
  id_usuario: string;
  fecha: string; // yyyymmddhh
  proteinas: number;
  hidratos: number;
  grasas: number;
  verduras: number;
  titulo?: string | null;
  notas?: string | null;
}

export interface TodayNutritionSummary {
  totalCalories: number;
  proteinas: number;
  hidratos: number;
  grasas: number;
  verduras: number;
}

export interface TodayNutritionEntrySummary {
  id: string;
  fecha: string;
  proteinas: number;
  hidratos: number;
  grasas: number;
  verduras: number;
  totalCalories: number;
  titulo?: string | null;
  notas?: string | null;
}

export interface TodayNutritionData {
  summary: TodayNutritionSummary;
  entries: TodayNutritionEntrySummary[];
}
