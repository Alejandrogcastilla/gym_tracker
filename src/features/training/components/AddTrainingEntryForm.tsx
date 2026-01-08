import { FormEvent, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addDoc, collection } from 'firebase/firestore';
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

type AddTrainingEntryFormProps = {
  onOpenHistory?: () => void;
};

export function AddTrainingEntryForm({ onOpenHistory }: AddTrainingEntryFormProps) {
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
      <div className="training-form__header">
        <h2 className="training-form__title">Añadir entrenamiento</h2>
        {onOpenHistory && (
          <button
            type="button"
            className="training-form__history-button"
            onClick={onOpenHistory}
            aria-label="Ver historial de entrenamientos"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
        )}
      </div>
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

    </section>
  );
}
