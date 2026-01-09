import type { Gender, Goal } from '@/features/auth/types/auth';

export interface UserProfile {
  id: string; // uid de Firebase Auth
  email: string;
  name: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  goal: Goal;
  createdAt: string; // yyyymmdd
  // Peso objetivo del usuario en kg (opcional)
  weightGoalKg?: number | null;
  // Indica si el usuario ha aceptado generar imágenes con IA
  accept_ai?: boolean;
}
