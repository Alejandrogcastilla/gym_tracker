import { memo, useState } from 'react';
import { collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type { TodayNutritionEntrySummary } from '@types/nutrition';
import './TodayNutritionEntriesList.css';

const nutritionCollection = collection(firebaseDb, 'nutricion');

interface TodayNutritionEntriesListProps {
  entries: TodayNutritionEntrySummary[];
  onUpdated?: () => void;
  title?: string;
  emptyMessage?: string;
}

async function updateEntry(id: string, partial: Record<string, unknown>) {
  const ref = doc(nutritionCollection, id);
  await updateDoc(ref, partial);
}

async function deleteEntry(id: string) {
  const ref = doc(nutritionCollection, id);
  await deleteDoc(ref);
}

export const TodayNutritionEntriesList = memo(function TodayNutritionEntriesList({
  entries,
  onUpdated,
  title,
  emptyMessage,
}: TodayNutritionEntriesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<
    | {
        proteinas: string;
        hidratos: string;
        grasas: string;
        verduras: string;
        titulo: string;
        notas: string;
      }
    | null
  >(null);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const startEdit = (entry: TodayNutritionEntrySummary) => {
    setEditingId(entry.id);
    setEditValues({
      proteinas: String(entry.proteinas),
      hidratos: String(entry.hidratos),
      grasas: String(entry.grasas),
      verduras: String(entry.verduras),
      titulo: entry.titulo ?? '',
      notas: entry.notas ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleFieldChange = (field: keyof NonNullable<typeof editValues>, value: string) => {
    setEditValues((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async (id: string) => {
    if (!editValues) return;

    const p = Number(editValues.proteinas || '0');
    const h = Number(editValues.hidratos || '0');
    const g = Number(editValues.grasas || '0');
    const v = Number(editValues.verduras || '0');

    if ([p, h, g, v].some((n) => Number.isNaN(n) || n < 0)) {
      // Validación básica; en el futuro se puede mostrar feedback en UI
      alert('Proteínas, hidratos, grasas y verduras deben ser números mayores o iguales que 0');
      return;
    }

    const tituloTrimmed = editValues.titulo.trim();
    const notasTrimmed = editValues.notas.trim();

    try {
      await updateEntry(id, {
        proteinas: p,
        hidratos: h,
        grasas: g,
        verduras: v,
        titulo: tituloTrimmed || null,
        notas: notasTrimmed || null,
      });
      if (onUpdated) onUpdated();
      cancelEdit();
    } catch (err) {
      console.error('No se han podido guardar los cambios de la entrada de nutrición', err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este registro de nutrición?');
    if (!confirmed) return;

    try {
      await deleteEntry(id);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('No se ha podido eliminar la entrada de nutrición', err);
    }
  };

  const formatDateLabel = (raw: string | null | undefined): string => {
    if (!raw || raw.length < 8) return '';

    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.length >= 10 ? raw.slice(8, 10) : null;

    if (hour) {
      return `${day}/${month}/${year} · ${hour}h`;
    }

    return `${day}/${month}/${year}`;
  };

  const emptyText =
    emptyMessage ?? 'Todavía no has añadido ningún registro de nutrición en los últimos 7 días.';

  if (!entries.length) {
    return (
      <section className="nutrition-list">
        <p className="nutrition-list__empty">{emptyText}</p>
      </section>
    );
  }

  return (
    <section className="nutrition-list">
      <ul className="nutrition-list__items">
        {entries.map((entry) => {
          const isEditing = editingId === entry.id;
          const dateLabel = formatDateLabel(entry.fecha);
          const macros = {
            proteinas: isEditing && editValues ? editValues.proteinas : String(entry.proteinas),
            hidratos: isEditing && editValues ? editValues.hidratos : String(entry.hidratos),
            grasas: isEditing && editValues ? editValues.grasas : String(entry.grasas),
            verduras: isEditing && editValues ? editValues.verduras : String(entry.verduras),
          };
          const tituloValue = isEditing && editValues ? editValues.titulo : entry.titulo ?? '';
          const notasValue = isEditing && editValues ? editValues.notas : entry.notas ?? '';

          const hasNotes = Boolean((entry.notas ?? '').trim());
          const isNotesExpanded = expandedNotesId === entry.id;
          const fullNotes = entry.notas ?? '';
          const firstLine = fullNotes.split('\n')[0] ?? '';
          const previewText = firstLine.length > 80
            ? `${firstLine.slice(0, 80).trimEnd()}…`
            : firstLine;

          return (
            <li key={entry.id} className="nutrition-list__item">
              <div className="nutrition-list__item-header">
                <div className="nutrition-list__header-left">
                  {dateLabel && (
                    <span className="nutrition-list__date">{dateLabel}</span>
                  )}
                </div>
                <div className="nutrition-list__header-right">
                  {!isEditing && (
                    <button
                      type="button"
                      className="nutrition-list__icon-button"
                      onClick={() => startEdit(entry)}
                      aria-label="Modificar registro de nutrición"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="nutrition-list__main-row">
                <div className="nutrition-list__title-row">{tituloValue || 'Sin título'}</div>
                <span className="nutrition-list__kcal">{entry.totalCalories.toFixed(0)} kcal</span>
              </div>

              {isEditing ? (
                <div className="nutrition-list__macros-edit">
                  <label className="nutrition-list__macros-field">
                    <span>P</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={macros.proteinas}
                      onChange={(e) => handleFieldChange('proteinas', e.target.value)}
                    />
                  </label>
                  <label className="nutrition-list__macros-field">
                    <span>H</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={macros.hidratos}
                      onChange={(e) => handleFieldChange('hidratos', e.target.value)}
                    />
                  </label>
                  <label className="nutrition-list__macros-field">
                    <span>G</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={macros.grasas}
                      onChange={(e) => handleFieldChange('grasas', e.target.value)}
                    />
                  </label>
                  <label className="nutrition-list__macros-field">
                    <span>V</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={macros.verduras}
                      onChange={(e) => handleFieldChange('verduras', e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="nutrition-list__macros">
                  <div className="nutrition-list__macros-chips">
                    <div className="nutrition-list__macro-chip nutrition-list__macro-chip--proteinas">
                      <span className="nutrition-list__macro-chip-icon">P</span>
                      <span className="nutrition-list__macro-chip-value">{entry.proteinas}</span>
                    </div>
                    <div className="nutrition-list__macro-chip nutrition-list__macro-chip--hidratos">
                      <span className="nutrition-list__macro-chip-icon">H</span>
                      <span className="nutrition-list__macro-chip-value">{entry.hidratos}</span>
                    </div>
                    <div className="nutrition-list__macro-chip nutrition-list__macro-chip--grasas">
                      <span className="nutrition-list__macro-chip-icon">G</span>
                      <span className="nutrition-list__macro-chip-value">{entry.grasas}</span>
                    </div>
                    <div className="nutrition-list__macro-chip nutrition-list__macro-chip--verduras">
                      <span className="nutrition-list__macro-chip-icon">V</span>
                      <span className="nutrition-list__macro-chip-value">{entry.verduras}</span>
                    </div>
                  </div>
                </div>
              )}

              {!isEditing && hasNotes && (
                <button
                  type="button"
                  className="nutrition-list__notes-toggle"
                  onClick={() =>
                    setExpandedNotesId((prev) => (prev === entry.id ? null : entry.id))
                  }
                >
                  <span className="nutrition-list__notes-label">Notas</span>
                  <span className="nutrition-list__notes-preview">
                    {isNotesExpanded ? fullNotes : previewText}
                  </span>
                </button>
              )}

              {isEditing && (
                <>
                  <div className="nutrition-list__field">
                    <label className="nutrition-list__label" htmlFor={`titulo-${entry.id}`}>
                      Título
                    </label>
                    <input
                      id={`titulo-${entry.id}`}
                      className="nutrition-list__input"
                      type="text"
                      value={tituloValue}
                      onChange={(e) => handleFieldChange('titulo', e.target.value)}
                      placeholder="Ej. Desayuno, Comida post-entreno..."
                    />
                  </div>

                  <div className="nutrition-list__field">
                    <label className="nutrition-list__label" htmlFor={`notas-${entry.id}`}>
                      Notas
                    </label>
                    <textarea
                      id={`notas-${entry.id}`}
                      className="nutrition-list__textarea"
                      value={notasValue}
                      rows={2}
                      placeholder="Detalles adicionales que quieras recordar de esta comida."
                      onChange={(e) => handleFieldChange('notas', e.target.value)}
                    />
                  </div>

                  <div className="nutrition-list__actions">
                    <button
                      type="button"
                      className="nutrition-list__button"
                      onClick={() => handleSave(entry.id)}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="nutrition-list__button nutrition-list__button--ghost"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="nutrition-list__button nutrition-list__button--danger"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
});
