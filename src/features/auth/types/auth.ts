export type Goal = 'gain_muscle' | 'lose_fat' | 'recomp';

export type Gender = 'male' | 'female' | 'other';

export interface RegisterFormValues {
  email: string;
  name: string;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  age: number;
  goal: Goal;
  createdAt: string; // yyyymmdd
  password: string;
}
