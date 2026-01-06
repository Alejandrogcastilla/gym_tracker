import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type { ProgressEntry } from '@types/progress';
import './AddMeasurementsForm.css';

const progressCollection = collection(firebaseDb, 'progreso');

function formatTodayAsYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function MeasurementsList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<
    | {
        cintura: string;
        peso: string;
        cadera: string;
        pecho: string;
        brazo: string;
      }
    | null
  >(null);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          progressCollection,
          where('id_usuario', '==', user.uid),
          orderBy('fecha', 'desc')
        );
        const snapshot = await getDocs(q);
        const docs: ProgressEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<ProgressEntry, 'id'>;
          return { id: docSnap.id, ...data };
        });
        setEntries(docs);
      } catch (err) {
        console.error(err);
        setError('No se han podido cargar las medidas.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const toOptionalNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) {
      throw new Error('Las medidas deben ser números mayores que 0');
    }
    return n;
  };

  const startEdit = (entry: ProgressEntry) => {
    setEditingId(entry.id);
    setEditValues({
      cintura: entry.cintura != null ? String(entry.cintura) : '',
      peso: entry.peso != null ? String(entry.peso) : '',
      cadera: entry.cadera != null ? String(entry.cadera) : '',
      pecho: entry.pecho != null ? String(entry.pecho) : '',
      brazo: entry.brazo != null ? String(entry.brazo) : '',
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleEditFieldChange = (
    field: keyof NonNullable<typeof editValues>,
    value: string,
  ) => {
    setEditValues((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async (id: string) => {
    if (!user || !editValues) return;

    try {
      const cinturaValue = toOptionalNumber(editValues.cintura);
      const pesoValue = toOptionalNumber(editValues.peso);
      const caderaValue = toOptionalNumber(editValues.cadera);
      const pechoValue = toOptionalNumber(editValues.pecho);
      const brazoValue = toOptionalNumber(editValues.brazo);

      if (
        cinturaValue === null &&
        pesoValue === null &&
        caderaValue === null &&
        pechoValue === null &&
        brazoValue === null
      ) {
        throw new Error('Debes introducir al menos una medida.');
      }

      const ref = doc(progressCollection, id);
      await updateDoc(ref, {
        cintura: cinturaValue,
        peso: pesoValue,
        cadera: caderaValue,
        pecho: pechoValue,
        brazo: brazoValue,
      });

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                cintura: cinturaValue,
                peso: pesoValue,
                cadera: caderaValue,
                pecho: pechoValue,
                brazo: brazoValue,
              }
            : entry,
        ),
      );

      cancelEdit();
      setError(null);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se han podido actualizar las medidas. Inténtalo más tarde.');
      }
    }
  };

  if (!user) {
    return null;
  }

  const visibleEntries = showAll ? entries : entries.slice(0, 10);

  const formatDate = (raw: string) => {
    if (raw.length !== 8) return raw;
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `${day}/${month}/${year}`;
  };

  return (
    <section className="measures-list">
      <h3 className="measures-list__title">Últimas medidas</h3>
      {loading ? <p className="measures-list__status">Cargando medidas...</p> : null}
      {error ? <p className="measures-list__status measures-list__status--error">{error}</p> : null}

      {!loading && !error && entries.length === 0 ? (
        <p className="measures-list__empty">Aún no hay medidas guardadas.</p>
      ) : null}

      {visibleEntries.length > 0 && (
        <ul className="measures-list__items">
          {visibleEntries.map((entry) => {
            const parts: string[] = [];
            if (entry.cintura != null) parts.push(`Cintura: ${entry.cintura} cm`);
            if (entry.peso != null) parts.push(`Peso: ${entry.peso} kg`);
            if (entry.cadera != null) parts.push(`Cadera: ${entry.cadera} cm`);
            if (entry.pecho != null) parts.push(`Pecho: ${entry.pecho} cm`);
            if (entry.brazo != null) parts.push(`Brazo: ${entry.brazo} cm`);

            const isEditing = editingId === entry.id;

            return (
              <li key={entry.id} className="measures-list__item">
                <div className="measures-list__item-header">
                  <span className="measures-list__date">{formatDate(entry.fecha)}</span>
                  <div className="measures-list__actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="measures-list__button"
                          onClick={() => handleSave(entry.id)}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="measures-list__button measures-list__button--secondary"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="measures-list__button"
                        onClick={() => startEdit(entry)}
                      >
                        Modificar
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div className="measures-list__edit-grid">
                    <div className="measures-list__edit-field">
                      <label className="measures-list__edit-label" htmlFor={`cintura-${entry.id}`}>
                        Cintura (cm)
                      </label>
                      <input
                        id={`cintura-${entry.id}`}
                        className="measures-list__edit-input"
                        type="number"
                        inputMode="decimal"
                        value={editValues?.cintura ?? ''}
                        onChange={(e) => handleEditFieldChange('cintura', e.target.value)}
                      />
                    </div>
                    <div className="measures-list__edit-field">
                      <label className="measures-list__edit-label" htmlFor={`peso-${entry.id}`}>
                        Peso (kg)
                      </label>
                      <input
                        id={`peso-${entry.id}`}
                        className="measures-list__edit-input"
                        type="number"
                        inputMode="decimal"
                        value={editValues?.peso ?? ''}
                        onChange={(e) => handleEditFieldChange('peso', e.target.value)}
                      />
                    </div>
                    <div className="measures-list__edit-field">
                      <label className="measures-list__edit-label" htmlFor={`cadera-${entry.id}`}>
                        Cadera (cm)
                      </label>
                      <input
                        id={`cadera-${entry.id}`}
                        className="measures-list__edit-input"
                        type="number"
                        inputMode="decimal"
                        value={editValues?.cadera ?? ''}
                        onChange={(e) => handleEditFieldChange('cadera', e.target.value)}
                      />
                    </div>
                    <div className="measures-list__edit-field">
                      <label className="measures-list__edit-label" htmlFor={`pecho-${entry.id}`}>
                        Pecho (cm)
                      </label>
                      <input
                        id={`pecho-${entry.id}`}
                        className="measures-list__edit-input"
                        type="number"
                        inputMode="decimal"
                        value={editValues?.pecho ?? ''}
                        onChange={(e) => handleEditFieldChange('pecho', e.target.value)}
                      />
                    </div>
                    <div className="measures-list__edit-field">
                      <label className="measures-list__edit-label" htmlFor={`brazo-${entry.id}`}>
                        Brazo (cm)
                      </label>
                      <input
                        id={`brazo-${entry.id}`}
                        className="measures-list__edit-input"
                        type="number"
                        inputMode="decimal"
                        value={editValues?.brazo ?? ''}
                        onChange={(e) => handleEditFieldChange('brazo', e.target.value)}
                      />
                    </div>
                  </div>
                ) : parts.length > 0 ? (
                  <p className="measures-list__values">{parts.join(' · ')}</p>
                ) : (
                  <p className="measures-list__values measures-list__values--muted">
                    Medida sin detalles registrados.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!showAll && entries.length > 10 ? (
        <button
          type="button"
          className="measures-list__more-button"
          onClick={() => setShowAll(true)}
        >
          Ver más
        </button>
      ) : null}
    </section>
  );
}

export function AddMeasurementsForm() {
  const { user } = useAuth();

  const [cintura, setCintura] = useState('');
  const [peso, setPeso] = useState('');
  const [cadera, setCadera] = useState('');
  const [pecho, setPecho] = useState('');
  const [brazo, setBrazo] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const toOptionalNumber = (value: string): number | null => {
      if (!value.trim()) return null;
      const n = Number(value);
      if (Number.isNaN(n) || n <= 0) {
        throw new Error('Las medidas opcionales deben ser números mayores que 0');
      }
      return n;
    };

    setError(null);
    setSaving(true);

    try {
      const cinturaValue = toOptionalNumber(cintura);
      const pesoValue = toOptionalNumber(peso);
      const caderaValue = toOptionalNumber(cadera);
      const pechoValue = toOptionalNumber(pecho);
      const brazoValue = toOptionalNumber(brazo);

      if (
        cinturaValue === null &&
        pesoValue === null &&
        caderaValue === null &&
        pechoValue === null &&
        brazoValue === null
      ) {
        throw new Error('Debes introducir al menos una medida.');
      }

      const entry: Omit<ProgressEntry, 'id'> = {
        id_usuario: user.uid,
        fecha: formatTodayAsYYYYMMDD(),
        cintura: cinturaValue,
        peso: pesoValue,
        cadera: caderaValue,
        pecho: pechoValue,
        brazo: brazoValue,
      };

      await addDoc(progressCollection, entry);

      setCintura('');
      setPeso('');
      setCadera('');
      setPecho('');
      setBrazo('');
      setSuccess('Medidas guardadas');
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message.startsWith('Las medidas opcionales')) {
        setError(err.message);
      } else if (err instanceof Error && err.message.startsWith('Debes introducir al menos')) {
        setError(err.message);
      } else {
        setError('No se han podido guardar las medidas. Inténtalo más tarde.');
      }
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="measures">
      <div className="measures-form">
        <h2 className="measures-form__title">Añadir medidas de progreso</h2>
        <form onSubmit={handleSubmit}>
          <div className="measures-form__grid">
            <div className="measures-form__field">
              <label className="measures-form__label" htmlFor="cintura">
                Cintura (cm)
              </label>
              <input
                id="cintura"
                className="measures-form__input"
                type="number"
                inputMode="decimal"
                value={cintura}
                onChange={(e) => setCintura(e.target.value)}
                placeholder="Ej. 80"
              />
            </div>

            <div className="measures-form__field">
              <label className="measures-form__label" htmlFor="peso">
                Peso corporal (kg)
              </label>
              <input
                id="peso"
                className="measures-form__input"
                type="number"
                inputMode="decimal"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ej. 72.5"
              />
            </div>

            <div className="measures-form__field">
              <label className="measures-form__label" htmlFor="cadera">
                Cadera (cm)
              </label>
              <input
                id="cadera"
                className="measures-form__input"
                type="number"
                inputMode="decimal"
                value={cadera}
                onChange={(e) => setCadera(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="measures-form__field">
              <label className="measures-form__label" htmlFor="pecho">
                Pecho (cm)
              </label>
              <input
                id="pecho"
                className="measures-form__input"
                type="number"
                inputMode="decimal"
                value={pecho}
                onChange={(e) => setPecho(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="measures-form__field">
              <label className="measures-form__label" htmlFor="brazo">
                Brazo relajado (cm)
              </label>
              <input
                id="brazo"
                className="measures-form__input"
                type="number"
                inputMode="decimal"
                value={brazo}
                onChange={(e) => setBrazo(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="measures-form__button">
            {saving ? 'Guardando...' : 'Guardar medidas'}
          </button>

          {error ? <p className="measures-form__error">{error}</p> : null}
          {success ? <p className="measures-form__success">{success}</p> : null}
        </form>

        <MeasurementsList />
      </div>

      <aside className="measures-info">
        <h3 className="measures-info__title">Cómo interpretar estas medidas</h3>

        <div className="measures-info__block measures-info__block--primary">
          <h4 className="measures-info__heading">🥇 1) Cintura (muy recomendable)</h4>
          <p className="measures-info__text">
            Es la medida más importante después del peso. Es uno de los mejores proxys de grasa corporal sin usar
            máquinas tipo DXA y, además, correlaciona muy bien con salud metabólica.
          </p>
          <p className="measures-info__subtitle">Por qué es clave</p>
          <ul className="measures-info__list">
            <li>Mejor proxy de grasa corporal sin DXA.</li>
            <li>Detecta recomposición aunque el peso no cambie.</li>
            <li>Correlaciona con salud metabólica.</li>
          </ul>
          <p className="measures-info__subtitle">Cómo medirla</p>
          <ul className="measures-info__list">
            <li>A la altura del ombligo.</li>
            <li>Relajado, sin meter barriga.</li>
            <li>Siempre en el mismo punto y con condiciones similares.</li>
          </ul>
          <p className="measures-info__subtitle">Frecuencia recomendada</p>
          <p className="measures-info__text">1 vez por semana es más que suficiente.</p>
          <p className="measures-info__subtitle">Interpretación rápida</p>
          <ul className="measures-info__list">
            <li>⬇️ Cintura baja + peso estable → recomposición (pierdes grasa y ganas músculo).</li>
            <li>⬆️ Cintura sube rápido → estás ganando grasa.</li>
            <li>Peso sube + cintura estable → volumen más limpio y controlado.</li>
          </ul>
        </div>

        <div className="measures-info__block">
          <h4 className="measures-info__heading">🥈 2) Peso corporal</h4>
          <p className="measures-info__text">
            No es una medida de perímetro, pero va siempre asociada. Es el dato que mejor refleja el balance
            energético real a medio plazo.
          </p>
          <p className="measures-info__subtitle">Por qué importa</p>
          <ul className="measures-info__list">
            <li>Indica el balance energético real.</li>
            <li>Es necesario para ratios (% de peso por semana, g/kg de proteína, etc.).</li>
          </ul>
          <p className="measures-info__subtitle">Cómo usarlo bien</p>
          <ul className="measures-info__list">
            <li>Usa medias móviles de 7 días (MA7).</li>
            <li>No valores un día aislado: observa la tendencia.</li>
          </ul>
          <p className="measures-info__subtitle">Frecuencia recomendada</p>
          <p className="measures-info__text">Ideal: diario. Mínimo útil: 4 veces por semana.</p>
        </div>

        <div className="measures-info__block">
          <h4 className="measures-info__heading">🥉 3) Cadera (opcional pero útil)</h4>
          <p className="measures-info__text">
            Especialmente interesante si tiendes a acumular grasa en la zona de cadera y glúteos.
          </p>
          <p className="measures-info__subtitle">Por qué puede ayudarte</p>
          <ul className="measures-info__list">
            <li>Junto con la cintura permite calcular el ratio cintura/cadera.</li>
            <li>Ayuda a detectar redistribución de grasa.</li>
          </ul>
          <p className="measures-info__subtitle">Frecuencia recomendada</p>
          <p className="measures-info__text">1 vez cada 2–4 semanas suele ser suficiente.</p>
        </div>

        <div className="measures-info__block">
          <h4 className="measures-info__heading">🟡 4) Pecho</h4>
          <p className="measures-info__text">
            Muy útil en volumen o recomposición si entrenas fuerza, porque suele reflejar bien la ganancia muscular
            real en el torso.
          </p>
          <p className="measures-info__subtitle">Por qué es interesante</p>
          <ul className="measures-info__list">
            <li>Refleja ganancia muscular real cuando se entrena fuerza de manera consistente.</li>
            <li>Es muy motivacional: suele subir cuando haces las cosas bien.</li>
          </ul>
          <p className="measures-info__subtitle">Frecuencia recomendada</p>
          <p className="measures-info__text">1 vez cada 2–4 semanas.</p>
        </div>

        <div className="measures-info__block">
          <h4 className="measures-info__heading">🟡 5) Brazo (relajado)</h4>
          <p className="measures-info__text">
            Medida sencilla y muy motivacional si te interesa la hipertrofia. Mídelo siempre relajado, sin contraer.
          </p>
          <p className="measures-info__subtitle">Por qué merece la pena</p>
          <ul className="measures-info__list">
            <li>Indica hipertrofia periférica (brazos, hombros, etc.).</li>
            <li>Es poco ruidosa si se mide siempre igual.</li>
          </ul>
          <p className="measures-info__subtitle">Frecuencia recomendada</p>
          <p className="measures-info__text">1 vez cada 2–4 semanas.</p>
        </div>
      </aside>
    </section>
  );
}
