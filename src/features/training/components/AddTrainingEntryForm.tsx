import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addDoc, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type { TrainingEntry } from '@types/training';
import './AddTrainingEntryForm.css';

const trainingsCollection = collection(firebaseDb, 'entrenamientos');

function formatNowAsYYYYMMDDHH(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  return `${year}${month}${day}${hour}`;
}

function formatDateTime(raw: string): string {
  if (raw.length !== 10) return raw;
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  const hour = raw.slice(8, 10);
  return `${day}/${month}/${year} · ${hour}:00`;
}

function RecentTrainingsList({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          trainingsCollection,
          where('id_usuario', '==', userId),
          orderBy('fecha', 'desc'),
        );
        const snapshot = await getDocs(q);
        const docs: TrainingEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<TrainingEntry, 'id'>;
          return { id: docSnap.id, ...data };
        });
        setEntries(docs.slice(0, 10));
      } catch (err) {
        console.error(err);
        setError('No se han podido cargar los entrenamientos recientes.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  if (loading) {
    return <p className="training-list__status">Cargando entrenamientos recientes...</p>;
  }

  if (error) {
    return <p className="training-list__status training-list__status--error">{error}</p>;
  }

  if (!entries.length) {
    return <p className="training-list__empty">Todavía no has registrado entrenamientos.</p>;
  }

  return (
    <section className="training-list">
      <h3 className="training-list__title">Entrenamientos recientes</h3>
      <ul className="training-list__items">
        {entries.map((entry) => (
          <li key={entry.id} className="training-list__item">
            <div className="training-list__item-header">
              <span className="training-list__type">{entry.tipo_entrenamiento}</span>
              <span className="training-list__time">{entry.tiempo} min</span>
            </div>
            <p className="training-list__date">{formatDateTime(entry.fecha)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AddTrainingEntryForm() {
  const { user } = useAuth();
  const [tipoEntrenamiento, setTipoEntrenamiento] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const tiempoNumber = Number(tiempo || '0');

    if (!tipoEntrenamiento.trim()) {
      setError('El tipo de entrenamiento es obligatorio');
      setSuccess(null);
      return;
    }

    if (Number.isNaN(tiempoNumber) || tiempoNumber <= 0) {
      setError('El tiempo debe ser un número mayor que 0');
      setSuccess(null);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const entry: Omit<TrainingEntry, 'id'> = {
        id_usuario: user.uid,
        fecha: formatNowAsYYYYMMDDHH(),
        tipo_entrenamiento: tipoEntrenamiento.trim(),
        tiempo: tiempoNumber,
      };

      await addDoc(trainingsCollection, entry);

      setTipoEntrenamiento('');
      setTiempo('');
      setSuccess('Entrenamiento añadido');
    } catch (err) {
      console.error(err);
      setError('No se ha podido guardar el entrenamiento. Inténtalo más tarde.');
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="training-form">
      <h2 className="training-form__title">Añadir entrenamiento</h2>
      <form onSubmit={handleSubmit}>
        <div className="training-form__row">
          <div className="training-form__field">
            <label className="training-form__label" htmlFor="tipo_entrenamiento">
              Tipo de entrenamiento
            </label>
            <input
              id="tipo_entrenamiento"
              className="training-form__input"
              type="text"
              value={tipoEntrenamiento}
              onChange={(e) => setTipoEntrenamiento(e.target.value)}
              placeholder="Ej. Fuerza, cardio, HIIT..."
            />
          </div>
          <div className="training-form__field">
            <label className="training-form__label" htmlFor="tiempo">
              Tiempo (minutos)
            </label>
            <input
              id="tiempo"
              className="training-form__input"
              type="number"
              inputMode="decimal"
              value={tiempo}
              onChange={(e) => setTiempo(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="training-form__button">
          {saving ? 'Guardando...' : 'Añadir entrenamiento'}
        </button>

        {error ? <p className="training-form__error">{error}</p> : null}
        {success ? <p className="training-form__success">{success}</p> : null}
      </form>

      <RecentTrainingsList userId={user.uid} />
    </section>
  );
}
