import { FormEvent, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addDoc } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type { NutritionEntry } from '@types/nutrition';

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
      console.log('AI submit sin imagen seleccionada', { info: aiInfo });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      console.log('AI submit', {
        imageBase64: result,
        info: aiInfo,
      });
    };
    reader.readAsDataURL(aiFile);
  };

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        width: '100%',
      }}
    >
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Añadir registro de nutrición</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setMode('manual')}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            backgroundColor: mode === 'manual' ? '#111827' : '#f9fafb',
            color: mode === 'manual' ? '#ffffff' : '#111827',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Inserción manual
        </button>
        <button
          type="button"
          onClick={() => setMode('ai')}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #d1d5db',
            backgroundColor: mode === 'ai' ? '#111827' : '#f9fafb',
            color: mode === 'ai' ? '#ffffff' : '#111827',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Por AI
        </button>
      </div>

      {mode === 'manual' ? (
        <form key="manual" onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="titulo">
              Título (opcional)
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Desayuno, Comida post-entreno..."
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="notas">
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Detalles adicionales que quieras recordar de esta comida."
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="proteinas">
              Proteínas
            </label>
            <input
              id="proteinas"
              type="number"
              inputMode="decimal"
              value={proteinas}
              onChange={(e) => setProteinas(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="hidratos">
              Hidratos de carbono
            </label>
            <input
              id="hidratos"
              type="number"
              inputMode="decimal"
              value={hidratos}
              onChange={(e) => setHidratos(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="verduras">
              Frutas / verduras
            </label>
            <input
              id="verduras"
              type="number"
              inputMode="decimal"
              value={verduras}
              onChange={(e) => setVerduras(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="grasas">
              Grasas
            </label>
            <input
              id="grasas"
              type="number"
              inputMode="decimal"
              value={grasas}
              onChange={(e) => setGrasas(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#111827',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Añadir registro'}
          </button>

          {error ? <p style={{ marginTop: 8, color: '#b91c1c' }}>{error}</p> : null}
          {success ? <p style={{ marginTop: 8, color: '#15803d' }}>{success}</p> : null}
        </form>
      ) : (
        <form key="ai" onSubmit={handleAiSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="ai-image">
              Imagen de la comida
            </label>
            <input
              id="ai-image"
              type="file"
              accept="image/*"
              onChange={(e) => setAiFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="ai-info">
              Información adicional (opcional)
            </label>
            <textarea
              id="ai-info"
              value={aiInfo}
              onChange={(e) => setAiInfo(e.target.value)}
              rows={3}
              placeholder="Ej. Cantidades aproximadas, marca del producto, etc."
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#111827',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Enviar (demo)
          </button>

          <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
            Por ahora este modo solo hace console.log de la imagen en base64 y del texto introducido.
          </p>
        </form>
      )}
    </section>
  );
}
