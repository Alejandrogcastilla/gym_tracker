export interface ProgressEntry {
  id: string;
  id_usuario: string;
  fecha: string; // yyyymmdd
  peso: number | null;
  brazo: number | null;
  pecho: number | null;
  cadera: number | null;
  cintura: number | null;
}
