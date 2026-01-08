import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { firebaseDb } from '@/services/firebase/firebaseClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUserProfile } from '@/features/users/hooks/useUserProfile';
import type { ProgressEntry } from '@/types/progress';
import type { TrainingEntry } from '@/types/training';
import './ProgressOverview.css';

const progressCollection = collection(firebaseDb, 'progreso');
const trainingsCollection = collection(firebaseDb, 'entrenamientos');

interface WeightPoint {
  fecha: string;
  value: number;
}

type ProgressRange = 'today' | '7d' | 'month';

interface ProgressOverviewProps {
  range?: ProgressRange;
}

function getRangeConfig(effectiveRange: ProgressRange) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const baseDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const pad = (n: number) => n.toString().padStart(2, '0');

  const todayKey = `${baseDay.getFullYear()}${pad(baseDay.getMonth() + 1)}${pad(baseDay.getDate())}`;

  const sevenDaysAgo = new Date(baseDay);
  sevenDaysAgo.setDate(baseDay.getDate() - 6);
  const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}${pad(sevenDaysAgo.getMonth() + 1)}${pad(sevenDaysAgo.getDate())}`;

  const monthStart = new Date(baseDay.getFullYear(), baseDay.getMonth(), 1);
  const monthStartKey = `${monthStart.getFullYear()}${pad(monthStart.getMonth() + 1)}${pad(monthStart.getDate())}`;

  let startKey: string;
  let label: string;
  if (effectiveRange === 'today') {
    startKey = todayKey;
    label = 'hoy';
  } else if (effectiveRange === '7d') {
    startKey = sevenDaysAgoKey;
    label = 'últimos 7 días';
  } else {
    startKey = monthStartKey;
    label = 'este mes';
  }

  return { startKey, label };
}

function formatProgressDate(raw: string): string {
  if (raw.length !== 8) return raw;
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${day}/${month}/${year}`;
}

export function ProgressOverview({ range }: ProgressOverviewProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const effectiveRange: ProgressRange = range ?? '7d';

  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingStats, setTrainingStats] = useState<{ sessions: number; minutes: number } | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          progressCollection,
          where('id_usuario', '==', user.uid),
          orderBy('fecha', 'asc'),
        );
        const snapshot = await getDocs(q);
        const docs: ProgressEntry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Omit<ProgressEntry, 'id'>;
          return { id: docSnap.id, ...data };
        });
        setEntries(docs);
      } catch (err) {
        console.error(err);
        setError('No se han podido cargar los datos de progreso.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);
  useEffect(() => {
    if (!user) return;

    const loadTrainings = async () => {
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

        // Resumen de entrenamientos siempre basado en los últimos 7 días
        const { startKey } = getRangeConfig('7d');

        const rangeEntries = docs.filter((entry) => entry.fecha >= startKey);
        const sessions = rangeEntries.length;
        const minutes = rangeEntries.reduce((acc, entry) => acc + (entry.tiempo ?? 0), 0);

        setTrainingStats({ sessions, minutes });
      } catch (err) {
        console.error(err);
        setTrainingStats(null);
      }
    };

    loadTrainings();
  }, [user]);

  const weightPoints: WeightPoint[] = useMemo(() => {
    const { startKey } = getRangeConfig(effectiveRange);

    const allPoints = entries
      .filter((e) => e.peso != null)
      .map((e) => ({ fecha: e.fecha, value: e.peso as number }));

    const rangePoints = allPoints.filter((p) => p.fecha >= startKey);
    if (rangePoints.length >= 2) return rangePoints;
    return allPoints;
  }, [entries, effectiveRange]);

  const weightGoal = profile?.weightGoalKg ?? null;

  const chartData = useMemo(() => {
    if (weightPoints.length === 0) {
      return null;
    }

    const values = weightPoints.map((p) => p.value);
    const allValues = weightGoal != null ? [...values, weightGoal] : values;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    const rawSpan = max - min || 1;
    const padding = rawSpan * 0.15;
    const yMin = min - padding;
    const yMax = max + padding;

    const width = 400;
    const height = 160;
    const margin = { top: 16, right: 16, bottom: 24, left: 36 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xForIndex = (index: number) => {
      if (weightPoints.length === 1) {
        return margin.left + innerWidth / 2;
      }
      const t = index / (weightPoints.length - 1);
      return margin.left + t * innerWidth;
    };

    const yForValue = (value: number) => {
      if (yMax === yMin) return margin.top + innerHeight / 2;
      const t = (value - yMin) / (yMax - yMin);
      return margin.top + innerHeight - t * innerHeight;
    };

    const pathD = weightPoints
      .map((p, index) => {
        const x = xForIndex(index);
        const y = yForValue(p.value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const goalY = weightGoal != null ? yForValue(weightGoal) : null;

    let goalBandTop: number | null = null;
    let goalBandBottom: number | null = null;
    if (weightGoal != null) {
      const bandHalf = 2; // ±2 kg alrededor del objetivo
      const bandMin = weightGoal - bandHalf;
      const bandMax = weightGoal + bandHalf;
      const yBandMin = yForValue(bandMin);
      const yBandMax = yForValue(bandMax);
      goalBandTop = Math.min(yBandMin, yBandMax);
      goalBandBottom = Math.max(yBandMin, yBandMax);
    }

    const first = weightPoints[0];
    const last = weightPoints[weightPoints.length - 1];

    return {
      width,
      height,
      margin,
      innerWidth,
      innerHeight,
      pathD,
      goalY,
      goalBandTop,
      goalBandBottom,
      yMin,
      yMax,
      firstLabel: formatProgressDate(first.fecha),
      lastLabel: formatProgressDate(last.fecha),
      firstValue: first.value,
      lastValue: last.value,
    };
  }, [weightPoints, weightGoal]);

  const trends = useMemo(() => {
    const { startKey, label: rangeLabel } = getRangeConfig(effectiveRange);

    // Solo entradas en el rango seleccionado (formato fecha yyyymmdd)
    const recentEntries = entries.filter((e) => e.fecha >= startKey);

    const metricLabels: Record<keyof Omit<ProgressEntry, 'id' | 'id_usuario' | 'fecha'>, string> = {
      peso: 'Peso',
      cintura: 'Cintura',
      cadera: 'Cadera',
      pecho: 'Pecho',
      brazo: 'Brazo',
    };

    const result: {
      key: keyof typeof metricLabels;
      label: string;
      arrow: string;
      description: string;
      status: 'good' | 'neutral' | 'warn' | 'bad';
    }[] = [];

    (Object.keys(metricLabels) as (keyof typeof metricLabels)[]).forEach((key) => {
      const series = recentEntries.filter((e) => e[key] != null) as (ProgressEntry & {
        [K in typeof key]: number;
      })[];

      // Necesitamos al menos 2 medidas en el rango seleccionado
      if (series.length < 2) {
        const remaining = 2 - series.length;
        result.push({
          key,
          label: metricLabels[key],
          arrow: '→',
          description:
            series.length === 0
              ? `Sin datos recientes. Añade 2 mediciones para ver la tendencia.`
              : `Añade ${remaining} medición más para ver la tendencia (${rangeLabel}).`,
          status: 'neutral',
        });
        return;
      }

      const first = series[0][key];
      const last = series[series.length - 1][key];
      const diff = last - first;
      const unit = key === 'peso' ? 'kg' : 'cm';

      const threshold = key === 'peso' ? 0.1 : 0.5;
      const absDiff = Math.abs(diff);

      // Detección de cambios atípicos
      const outlierLimit = key === 'peso' ? 6 : 12;
      if (absDiff > outlierLimit) {
        result.push({
          key,
          label: metricLabels[key],
          arrow: '⚠️',
          description: `Cambio atípico (${diff.toFixed(1)} ${unit}). Revisa la medición.`,
          status: 'bad',
        });
        return;
      }

      if (key === 'peso') {
        if (diff < -1.5) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↓',
            description: `Descenso rápido (${diff.toFixed(1)} ${unit}). Revisa ingesta/calorías.`,
            status: 'bad',
          });
        } else if (diff < -0.3) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↓',
            description: `Descenso moderado (${diff.toFixed(1)} ${unit}) en ${rangeLabel}.`,
            status: 'neutral',
          });
        } else if (absDiff <= 0.3) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '→',
            description: `Peso estable (${diff.toFixed(1)} ${unit}) en ${rangeLabel}.`,
            status: 'neutral',
          });
        } else if (diff > 1.0) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↑',
            description: `Subida rápida (+${diff.toFixed(1)} ${unit}). Asegúrate de que sea ganancia de calidad.`,
            status: 'warn',
          });
        } else {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↑',
            description: `Subida moderada (+${diff.toFixed(1)} ${unit}) en ${rangeLabel}.`,
            status: 'neutral',
          });
        }
      } else if (key === 'cintura') {
        if (diff < -1) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↓',
            description: `Buen descenso de cintura (${diff.toFixed(1)} ${unit}).`,
            status: 'good',
          });
        } else if (diff > 1) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↑',
            description: `Aumento de cintura (+${diff.toFixed(1)} ${unit}). Vigila la ingesta y el estrés.`,
            status: 'bad',
          });
        } else {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '→',
            description: `Cintura estable (${rangeLabel}).`,
            status: 'good',
          });
        }
      } else {
        if (diff > 1) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↑',
            description: `Aumento significativo (+${diff.toFixed(1)} ${unit}). Puede reflejar ganancia muscular.`,
            status: 'good',
          });
        } else if (diff < -1) {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '↓',
            description: `Descenso (${diff.toFixed(1)} ${unit}). Revisa volumen de entrenamiento y nutrición.`,
            status: 'warn',
          });
        } else {
          result.push({
            key,
            label: metricLabels[key],
            arrow: '→',
            description: `Estable (${rangeLabel}).`,
            status: 'neutral',
          });
        }
      }
    });

    return result;
  }, [entries, effectiveRange]);

  const weightSummary = useMemo(() => {
    if (weightPoints.length < 2) {
      return {
        tone: 'neutral' as const,
        text: 'Añade al menos 2 registros de peso en este rango para ver una tendencia clara.',
      };
    }

    const { label: rangeLabel } = getRangeConfig(effectiveRange);
    const first = weightPoints[0].value;
    const last = weightPoints[weightPoints.length - 1].value;
    const diff = last - first;
    const diffText = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;

    let tone: 'good' | 'neutral' | 'warn' | 'bad' = 'neutral';
    let baseText: string;

    if (diff < -1.5) {
      baseText = `Descenso rápido de peso (${diffText}) en ${rangeLabel}.`;
      tone = 'bad';
    } else if (diff < -0.3) {
      baseText = `Descenso moderado de peso (${diffText}) en ${rangeLabel}.`;
      tone = 'neutral';
    } else if (Math.abs(diff) <= 0.3) {
      baseText = `Peso prácticamente estable (${diffText}) en ${rangeLabel}.`;
      tone = 'neutral';
    } else if (diff > 1.0) {
      baseText = `Subida rápida de peso (${diffText}) en ${rangeLabel}.`;
      tone = 'warn';
    } else {
      baseText = `Subida moderada de peso (${diffText}) en ${rangeLabel}.`;
      tone = 'neutral';
    }

    let goalText = '';
    if (weightGoal != null) {
      const toGoal = weightGoal - last;
      const absToGoal = Math.abs(toGoal).toFixed(1);
      if (Math.abs(toGoal) < 0.3) {
        goalText = ' Objetivo de peso prácticamente alcanzado.';
        tone = tone === 'bad' ? 'warn' : 'good';
      } else if (toGoal > 0) {
        goalText = ` Faltan aproximadamente ${absToGoal} kg para tu objetivo (${weightGoal} kg).`;
      } else {
        goalText = ` Has superado tu objetivo en ${absToGoal} kg (objetivo ${weightGoal} kg).`;
      }
    }

    return { tone, text: `${baseText}${goalText}` };
  }, [effectiveRange, weightGoal, weightPoints]);

  if (!user) {
    return null;
  }

  return (
    <section className="progress-overview">
      <div className="progress-overview__card">
        <h2 className="progress-overview__title">Evolución del peso</h2>

        {loading && <p className="progress-overview__status">Cargando datos de progreso...</p>}
        {error && <p className="progress-overview__status progress-overview__status--error">{error}</p>}

        {!loading && !error && chartData === null && (
          <p className="progress-overview__status">Aún no hay pesos registrados.</p>
        )}

        {chartData && (
          <div className="progress-overview__chart-wrapper">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="progress-overview__chart"
            >
              <rect
                x={chartData.margin.left}
                y={chartData.margin.top}
                width={chartData.innerWidth}
                height={chartData.innerHeight}
                fill="#f9fafb"
                stroke="#e5e7eb"
              />

              {chartData.goalBandTop != null && chartData.goalBandBottom != null && (
                <rect
                  x={chartData.margin.left}
                  y={chartData.goalBandTop}
                  width={chartData.innerWidth}
                  height={chartData.goalBandBottom - chartData.goalBandTop}
                  fill="rgba(34, 197, 94, 0.06)"
                />
              )}

              {chartData.goalY != null && (
                <g>
                  <line
                    x1={chartData.margin.left}
                    x2={chartData.margin.left + chartData.innerWidth}
                    y1={chartData.goalY}
                    y2={chartData.goalY}
                    stroke="#22c55e"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <text
                    x={chartData.margin.left + chartData.innerWidth}
                    y={chartData.goalY - 4}
                    textAnchor="end"
                    fontSize={11}
                    fill="#16a34a"
                  >
                    Peso objetivo {weightGoal} kg
                  </text>
                </g>
              )}

              <path
                d={chartData.pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth={2}
              />

              {weightPoints.map((p, index) => {
                const width = chartData.width;
                const height = chartData.height;
                const { margin, innerWidth, innerHeight, yMin, yMax } = chartData;

                const xForIndex = (i: number) => {
                  if (weightPoints.length === 1) {
                    return margin.left + innerWidth / 2;
                  }
                  const t = i / (weightPoints.length - 1);
                  return margin.left + t * innerWidth;
                };

                const yForValue = (value: number) => {
                  if (yMax === yMin) return margin.top + innerHeight / 2;
                  const t = (value - yMin) / (yMax - yMin);
                  return margin.top + innerHeight - t * innerHeight;
                };

                const cx = xForIndex(index);
                const cy = yForValue(p.value);

                const isFirst = index === 0;
                const isLast = index === weightPoints.length - 1;
                const radius = isFirst || isLast ? 4 : 3;

                const prev = index > 0 ? weightPoints[index - 1].value : null;
                const diff = prev != null ? p.value - prev : 0;
                const tooltip = prev != null
                  ? `${formatProgressDate(p.fecha)} • ${p.value.toFixed(1)} kg • ${
                      diff >= 0 ? '+' : ''
                    }${diff.toFixed(1)} kg vs anterior`
                  : `${formatProgressDate(p.fecha)} • ${p.value.toFixed(1)} kg`;

                return (
                  <circle
                    key={p.fecha + index}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth={1}
                  >
                    <title>{tooltip}</title>
                  </circle>
                );
              })}

              <text
                x={chartData.margin.left}
                y={chartData.height - 6}
                fontSize={11}
                fill="#6b7280"
              >
                {chartData.firstLabel}
              </text>
              <text
                x={chartData.margin.left + chartData.innerWidth}
                y={chartData.height - 6}
                fontSize={11}
                fill="#6b7280"
                textAnchor="end"
              >
                {chartData.lastLabel}
              </text>
            </svg>

            <div className="progress-overview__chart-summary">
              <div className="progress-overview__chart-summary-item progress-overview__chart-summary-item--start">
                <span className="progress-overview__chart-label">Inicio</span>
                <span className="progress-overview__chart-value">
                  {chartData.firstValue.toFixed(1)} kg
                </span>
              </div>
              <div className="progress-overview__chart-summary-item progress-overview__chart-summary-item--center">
                <span className="progress-overview__chart-label">Actual</span>
                <span className="progress-overview__chart-value">
                  {chartData.lastValue.toFixed(1)} kg
                </span>
              </div>
              <div className="progress-overview__chart-summary-item progress-overview__chart-summary-item--end">
                <span className="progress-overview__chart-label">Objetivo</span>
                <span className="progress-overview__chart-value">
                  {weightGoal != null ? `${weightGoal.toFixed(1)} kg` : '—'}
                </span>
              </div>
            </div>

            {weightSummary && (
              <p
                className={
                  `progress-overview__weight-summary progress-overview__weight-summary--${weightSummary.tone}`
                }
              >
                {weightSummary.text}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="progress-overview__trends">
        <h3 className="progress-overview__trends-title">Tendencia de medidas</h3>
        <div className="progress-overview__trends-grid">
          {trends.map((item) => (
            <div
              key={String(item.key)}
              className={
                `progress-overview__trend-card progress-overview__trend-card--${item.status}`
              }
            >
              <div className="progress-overview__trend-header">
                <span className="progress-overview__trend-label">{item.label}</span>
                <span className="progress-overview__trend-arrow">{item.arrow}</span>
              </div>
              <p className="progress-overview__trend-description">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
