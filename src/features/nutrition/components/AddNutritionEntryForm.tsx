import { FormEvent, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addDoc, collection } from 'firebase/firestore';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type { NutritionEntry } from '@types/nutrition';
import './AddNutritionEntryForm.css';

const nutritionCollection = collection(firebaseDb, 'nutricion');

interface AddNutritionEntryFormProps {
  onSaved?: () => void;
}

function formatNowAsYYYYMMDDHH(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  return `${year}${month}${day}${hour}`;
}

export function AddNutritionEntryForm({ onSaved }: AddNutritionEntryFormProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [proteinas, setProteinas] = useState('');
  const [hidratos, setHidratos] = useState('');
  const [grasas, setGrasas] = useState('');
  const [verduras, setVerduras] = useState('');
  const [titulo, setTitulo] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiInfo, setAiInfo] = useState('');

  if (!user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const p = Number(proteinas || '0');
    const h = Number(hidratos || '0');
    const g = Number(grasas || '0');
    const v = Number(verduras || '0');

    if ([p, h, g, v].some((n) => Number.isNaN(n) || n < 0)) {
      setError('Todos los campos deben ser números mayores o iguales que 0');
      setSuccess(null);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const entry: Omit<NutritionEntry, 'id'> = {
        id_usuario: user.uid,
        fecha: formatNowAsYYYYMMDDHH(),
        proteinas: p,
        hidratos: h,
        grasas: g,
        verduras: v,
        titulo: titulo.trim() || null,
        notas: notas.trim() || null,
      };

      await addDoc(nutritionCollection, entry);

      setProteinas('');
      setHidratos('');
      setGrasas('');
      setVerduras('');
      setTitulo('');
      setNotas('');
      setSuccess('Registro añadido');
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error(err);
      setError('No se ha podido guardar el registro. Inténtalo más tarde.');
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAiSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!aiFile) {
      console.log('AI submit sin imagen seleccionada', { info: aiInfo, titulo });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string | null;
      if (!result) {
        console.error('No se ha podido leer la imagen para la llamada AI');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:5000/process_meal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: result,
            title: titulo,
            description: aiInfo,
          }),
        });

        const data = await response.json();
        console.log('AI response /process_meal', data);

        if (response.ok && onSaved) {
          onSaved();
        }
      } catch (err) {
        console.error('Error llamando a /process_meal', err);
      }
    };
    reader.readAsDataURL(aiFile);
  };

  return (
    <section className="nutrition-entry-modal">
      <div className="nutrition-entry-modal__tabs">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={
            mode === 'manual'
              ? 'nutrition-entry-modal__tab nutrition-entry-modal__tab--active'
              : 'nutrition-entry-modal__tab'
          }
        >
          Inserción manual
        </button>
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={
            mode === 'ai'
              ? 'nutrition-entry-modal__tab nutrition-entry-modal__tab--active'
              : 'nutrition-entry-modal__tab'
          }
        >
          Por AI
        </button>
      </div>

      {mode === 'manual' ? (
        <form key="manual" onSubmit={handleSubmit} className="nutrition-entry-modal__form">
          <div className="nutrition-entry-modal__field">
            <label className="nutrition-entry-modal__label" htmlFor="titulo">
              Título (opcional)
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Desayuno, Comida post-entreno..."
              className="nutrition-entry-modal__input"
            />
          </div>

          <div className="nutrition-entry-modal__field">
            <label className="nutrition-entry-modal__label" htmlFor="notas">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Detalles adicionales que quieras recordar de esta comida."
              className="nutrition-entry-modal__textarea"
            />
          </div>

          <div className="nutrition-entry-modal__grid">
            <div className="nutrition-entry-modal__field">
              <label className="nutrition-entry-modal__label" htmlFor="proteinas">
                Proteínas
              </label>
              <input
                id="proteinas"
                type="number"
                inputMode="decimal"
                value={proteinas}
                onChange={(e) => setProteinas(e.target.value)}
                className="nutrition-entry-modal__input"
              />
            </div>

            <div className="nutrition-entry-modal__field">
              <label className="nutrition-entry-modal__label" htmlFor="hidratos">
                Hidratos de carbono
              </label>
              <input
                id="hidratos"
                type="number"
                inputMode="decimal"
                value={hidratos}
                onChange={(e) => setHidratos(e.target.value)}
                className="nutrition-entry-modal__input"
              />
            </div>

            <div className="nutrition-entry-modal__field">
              <label className="nutrition-entry-modal__label" htmlFor="verduras">
                Frutas / verduras
              </label>
              <input
                id="verduras"
                type="number"
                inputMode="decimal"
                value={verduras}
                onChange={(e) => setVerduras(e.target.value)}
                className="nutrition-entry-modal__input"
              />
            </div>

            <div className="nutrition-entry-modal__field">
              <label className="nutrition-entry-modal__label" htmlFor="grasas">
                Grasas
              </label>
              <input
                id="grasas"
                type="number"
                inputMode="decimal"
                value={grasas}
                onChange={(e) => setGrasas(e.target.value)}
                className="nutrition-entry-modal__input"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="nutrition-entry-modal__submit">
            {saving ? 'Guardando…' : 'Guardar registro'}
          </button>

          {error && <p className="nutrition-entry-modal__error">{error}</p>}
          {success && <p className="nutrition-entry-modal__success">{success}</p>}
        </form>
      ) : (
        <form key="ai" onSubmit={handleAiSubmit} className="nutrition-entry-modal__form">
          <div className="nutrition-entry-modal__field">
            <label className="nutrition-entry-modal__label" htmlFor="ai-titulo">
              Título (opcional)
            </label>
            <input
              id="ai-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Desayuno, Comida post-entreno..."
              className="nutrition-entry-modal__input"
            />
          </div>

          <div className="nutrition-entry-modal__field">
            <label className="nutrition-entry-modal__label" htmlFor="ai-file">
              Sube una foto del plato
            </label>
            <label htmlFor="ai-file" className="nutrition-entry-modal__upload">
              <div className="nutrition-entry-modal__upload-text">
                <span className="nutrition-entry-modal__upload-title">Seleccionar foto</span>
              </div>
              <div className="nutrition-entry-modal__upload-icon">
                <span className="material-symbols-outlined">photo_camera</span>
              </div>
            </label>
            <input
              id="ai-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setAiFile(file);
              }}
              className="nutrition-entry-modal__file-input"
            />
            {aiFile && (
              <p className="nutrition-entry-modal__hint">Archivo seleccionado: {aiFile.name}</p>
            )}
          </div>

          <div className="nutrition-entry-modal__field">
            <label className="nutrition-entry-modal__label" htmlFor="ai-info">
              Información adicional (opcional)
            </label>
            <textarea
              id="ai-info"
              value={aiInfo}
              onChange={(e) => setAiInfo(e.target.value)}
              rows={3}
              placeholder="Ej. Comida post-entreno, muy cargada de verduras..."
              className="nutrition-entry-modal__textarea"
            />
          </div>

          <p className="nutrition-entry-modal__hint">
            * De momento la inserción por IA solo registra la información para que puedas probar el
            flujo. Más adelante se conectará con un modelo que estime los macros automáticamente.
          </p>

          <button type="submit" className="nutrition-entry-modal__submit">
            Probar inserción por IA
          </button>
        </form>
      )}
    </section>
  );
}
