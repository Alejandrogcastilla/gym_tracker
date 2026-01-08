import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { firebaseDb } from '@/services/firebase/firebaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { TrainingEntry } from '@types/training';
import './AddTrainingEntryForm.css';

const trainingsCollection = collection(firebaseDb, 'entrenamientos');

type TrainingRange = 'day' | 'week' | 'month';

function getDayKeyFromFecha(fecha: string): string | null {
  if (!fecha || fecha.length < 8) return null;
  return fecha.slice(0, 8);
}

function getTodayKeys() {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const pad = (n: number) => n.toString().padStart(2, '0');

  const todayKey = `${base.getFullYear()}${pad(base.getMonth() + 1)}${pad(base.getDate())}`;

  const sevenDaysAgo = new Date(base);
  sevenDaysAgo.setDate(base.getDate() - 6);
  const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}${pad(sevenDaysAgo.getMonth() + 1)}${pad(sevenDaysAgo.getDate())}`;

  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const monthStartKey = `${monthStart.getFullYear()}${pad(monthStart.getMonth() + 1)}${pad(monthStart.getDate())}`;

  return { todayKey, sevenDaysAgoKey, monthStartKey };
}

function formatDayLabel(dayKey: string): string {
  if (dayKey.length !== 8) return dayKey;
  const year = Number(dayKey.slice(0, 4));
  const month = Number(dayKey.slice(4, 6));
  const day = Number(dayKey.slice(6, 8));

  const date = new Date(year, month - 1, day);
  const today = new Date();
  const baseToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = baseToday.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'HOY';
  if (diffDays === 1) return 'AYER';

  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
}

function formatTimeLabel(raw: string): string {
  if (!raw || raw.length < 10) return '';
  const hour = raw.slice(8, 10);
  return `${hour}:00`;
}

export function RecentTrainingsList() {
  const { user } = useAuth();
  const [allEntries, setAllEntries] = useState<TrainingEntry[]>([]);
  const [range, setRange] = useState<TrainingRange>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTipo, setEditTipo] = useState('');
  const [editTiempo, setEditTiempo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setAllEntries([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          trainingsCollection,
          where('id_usuario', '==', user.uid),
          orderBy('fecha', 'desc'),
        );
        const snapshot = await getDocs(q);
        const docs: TrainingEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<TrainingEntry, 'id'>;
          return { id: docSnap.id, ...data };
        });
        setAllEntries(docs);
      } catch (err) {
        console.error(err);
        setError('No se han podido cargar los entrenamientos recientes.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const filteredEntries = useMemo(() => {
    if (!allEntries.length) return [];

    const { todayKey, sevenDaysAgoKey, monthStartKey } = getTodayKeys();

    return allEntries.filter((entry) => {
      const dayKey = getDayKeyFromFecha(entry.fecha);
      if (!dayKey) return false;

      if (range === 'day') {
        return dayKey === todayKey;
      }

      if (range === 'week') {
        return dayKey >= sevenDaysAgoKey && dayKey <= todayKey;
      }

      // month
      return dayKey >= monthStartKey && dayKey <= todayKey;
    });
  }, [allEntries, range]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, TrainingEntry[]>();

    filteredEntries.forEach((entry) => {
      const dayKey = getDayKeyFromFecha(entry.fecha);
      if (!dayKey) return;
      const current = groups.get(dayKey) ?? [];
      current.push(entry);
      groups.set(dayKey, current);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  const handleStartEdit = (entry: TrainingEntry) => {
    setEditingId(entry.id);
    setEditTipo(entry.tipo_entrenamiento);
    setEditTiempo(String(entry.tiempo));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTipo('');
    setEditTiempo('');
  };

  const handleSaveEdit = async (entry: TrainingEntry) => {
    const tiempoNumber = Number(editTiempo || '0');
    if (!editTipo.trim() || Number.isNaN(tiempoNumber) || tiempoNumber <= 0) {
      alert('Revisa tipo de entrenamiento y minutos (deben ser > 0).');
      return;
    }

    try {
      setSaving(true);
      const ref = doc(trainingsCollection, entry.id);
      await updateDoc(ref, {
        tipo_entrenamiento: editTipo.trim(),
        tiempo: tiempoNumber,
      });

      setAllEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id
            ? { ...e, tipo_entrenamiento: editTipo.trim(), tiempo: tiempoNumber }
            : e,
        ),
      );
      handleCancelEdit();
    } catch (err) {
      console.error('No se ha podido actualizar el entrenamiento', err);
      alert('No se ha podido actualizar el entrenamiento. Inténtalo más tarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: TrainingEntry) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este entrenamiento de hoy?');
    if (!confirmed) return;

    try {
      setSaving(true);
      const ref = doc(trainingsCollection, entry.id);
      await deleteDoc(ref);
      setAllEntries((prev) => prev.filter((e) => e.id !== entry.id));
      handleCancelEdit();
    } catch (err) {
      console.error('No se ha podido eliminar el entrenamiento', err);
      alert('No se ha podido eliminar el entrenamiento. Inténtalo más tarde.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className="training-list">
      <div
        className="dashboard-progress-tabs"
        aria-label="Filtro de rango de entrenamientos recientes"
      >
        <button
          type="button"
          className={`dashboard-progress-tab${
            range === 'day' ? ' dashboard-progress-tab--active' : ''
          }`}
          onClick={() => setRange('day')}
        >
          Día
        </button>
        <button
          type="button"
          className={`dashboard-progress-tab${
            range === 'week' ? ' dashboard-progress-tab--active' : ''
          }`}
          onClick={() => setRange('week')}
        >
          Semana
        </button>
        <button
          type="button"
          className={`dashboard-progress-tab${
            range === 'month' ? ' dashboard-progress-tab--active' : ''
          }`}
          onClick={() => setRange('month')}
        >
          Mes
        </button>
      </div>

      {loading && (
        <p className="training-list__status">Cargando entrenamientos recientes...</p>
      )}
      {error && (
        <p className="training-list__status training-list__status--error">{error}</p>
      )}

      {!loading && !error && groupedByDay.length === 0 && (
        <p className="training-list__empty">Todavía no has registrado entrenamientos.</p>
      )}

      {groupedByDay.map(([dayKey, entries]) => (
        <div key={dayKey} className="training-list__day-group">
          <ul className="training-list__items">
            {entries.map((entry) => (
              <li key={entry.id} className="training-list__item">
                <div className="training-list__item-main-row">
                  {range === 'day' && editingId === entry.id ? (
                    <>
                      <input
                        className="training-list__edit-input training-list__edit-input--tipo"
                        type="text"
                        value={editTipo}
                        onChange={(e) => setEditTipo(e.target.value)}
                        placeholder="Tipo de entrenamiento"
                      />
                      <input
                        className="training-list__edit-input training-list__edit-input--tiempo"
                        type="number"
                        inputMode="decimal"
                        value={editTiempo}
                        onChange={(e) => setEditTiempo(e.target.value)}
                        placeholder="Min"
                      />
                    </>
                  ) : (
                    <>
                      <span className="training-list__type">{entry.tipo_entrenamiento}</span>
                      <span className="training-list__time">{entry.tiempo} min</span>
                    </>
                  )}
                </div>
                <div className="training-list__date-row">
                  {formatTimeLabel(entry.fecha)}
                  {range === 'day' && editingId !== entry.id && (
                    <button
                      type="button"
                      className="training-list__edit-button"
                      onClick={() => handleStartEdit(entry)}
                      aria-label="Editar entrenamiento de hoy"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  )}
                  {range === 'day' && editingId === entry.id && (
                    <span className="training-list__edit-actions">
                      <button
                        type="button"
                        className="training-list__edit-save"
                        onClick={() => handleSaveEdit(entry)}
                        disabled={saving}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="training-list__edit-cancel"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="training-list__edit-delete"
                        onClick={() => handleDelete(entry)}
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
