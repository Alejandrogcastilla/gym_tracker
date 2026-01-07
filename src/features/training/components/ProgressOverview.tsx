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

export function ProgressOverview() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}${pad(sevenDaysAgo.getMonth() + 1)}${pad(sevenDaysAgo.getDate())}`;

        const lastWeekEntries = docs.filter((entry) => entry.fecha >= sevenDaysAgoKey);
        const sessions = lastWeekEntries.length;
        const minutes = lastWeekEntries.reduce((acc, entry) => acc + (entry.tiempo ?? 0), 0);

        setTrainingStats({ sessions, minutes });
      } catch (err) {
        console.error(err);
        setTrainingStats(null);
      }
    };

    loadTrainings();
  }, [user]);

  const weightPoints: WeightPoint[] = useMemo(
    () =>
      entries
        .filter((e) => e.peso != null)
        .map((e) => ({ fecha: e.fecha, value: e.peso as number })),
    [entries],
  );

  const weightGoal = profile?.weightGoalKg ?? null;

  const chartData = useMemo(() => {
    if (weightPoints.length === 0) {
      return null;
    }

    const values = weightPoints.map((p) => p.value);
    const allValues = weightGoal != null ? [...values, weightGoal] : values;
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min || 1) * 0.1;
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

    const goalY =
      weightGoal != null
        ? yForValue(weightGoal)
        : null;

    const first = weightPoints[0];
    const last = weightPoints[weightPoints.length - 1];

    const formatDate = (raw: string) => {
      if (raw.length !== 8) return raw;
      const year = raw.slice(0, 4);
      const month = raw.slice(4, 6);
      const day = raw.slice(6, 8);
      return `${day}/${month}/${year}`;
    };

    return {
      width,
      height,
      margin,
      innerWidth,
      innerHeight,
      pathD,
      goalY,
      yMin,
      yMax,
      firstLabel: formatDate(first.fecha),
      lastLabel: formatDate(last.fecha),
      firstValue: first.value,
      lastValue: last.value,
    };
  }, [weightPoints, weightGoal]);

  const trends = useMemo(() => {
    // Ventana de últimos 7 días (incluyendo hoy)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}${pad(sevenDaysAgo.getMonth() + 1)}${pad(sevenDaysAgo.getDate())}`;

    // Solo entradas de los últimos 7 días (formato fecha yyyymmdd)
    const recentEntries = entries.filter((e) => e.fecha >= sevenDaysAgoKey);

    const metricLabels: Record<keyof Omit<ProgressEntry, 'id' | 'id_usuario' | 'fecha'>, string> = {
      peso: 'Peso',
      cintura: 'Cintura',
      cadera: 'Cadera',
      pecho: 'Pecho',
      brazo: 'Brazo',
    };

    const units: Record<string, string> = {
      peso: 'kg',
      cintura: 'cm',
      cadera: 'cm',
      pecho: 'cm',
      brazo: 'cm',
    };

    const result: {
      key: keyof typeof metricLabels;
      label: string;
      arrow: string;
      description: string;
    }[] = [];

    (Object.keys(metricLabels) as (keyof typeof metricLabels)[]).forEach((key) => {
      const series = recentEntries.filter((e) => e[key] != null) as (ProgressEntry & {
        [K in typeof key]: number;
      })[];

      // Necesitamos al menos 2 medidas en los últimos 7 días
      if (series.length < 2) {
        result.push({
          key,
          label: metricLabels[key],
          arrow: '→',
          description: 'Sin datos suficientes (últimos 7 días)',
        });
        return;
      }

      const first = series[0][key];
      const last = series[series.length - 1][key];
      const diff = last - first;
      const unit = units[key];

      const threshold = key === 'peso' ? 0.1 : 0.5;

      if (diff > threshold) {
        result.push({
          key,
          label: metricLabels[key],
          arrow: '↑',
          description: `Creciente (+${diff.toFixed(1)} ${unit})`,
        });
      } else if (diff < -threshold) {
        result.push({
          key,
          label: metricLabels[key],
          arrow: '↓',
          description: `Decreciente (${diff.toFixed(1)} ${unit})`,
        });
      } else {
        result.push({
          key,
          label: metricLabels[key],
          arrow: '→',
          description: 'Neutro (últimos 7 días)',
        });
      }
    });

    return result;
  }, [entries]);

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

                return (
                  <circle
                    key={p.fecha + index}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
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
              <div>
                <span className="progress-overview__chart-label">Inicio</span>
                <span className="progress-overview__chart-value">
                  {chartData.firstValue.toFixed(1)} kg
                </span>
              </div>
              <div>
                <span className="progress-overview__chart-label">Actual</span>
                <span className="progress-overview__chart-value">
                  {chartData.lastValue.toFixed(1)} kg
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="progress-overview__trends">
        <h3 className="progress-overview__trends-title">Tendencia de medidas</h3>
        {trainingStats && (
          <div className="progress-overview__workout-summary">
            <div>
              <span className="progress-overview__workout-label">Entrenamientos (últimos 7 días)</span>
              <span className="progress-overview__workout-value">{trainingStats.sessions}</span>
            </div>
            <div>
              <span className="progress-overview__workout-label">Minutos entrenados (últimos 7 días)</span>
              <span className="progress-overview__workout-value">{trainingStats.minutes}</span>
            </div>
          </div>
        )}
        <div className="progress-overview__trends-grid">
          {trends.map((item) => (
            <div key={item.key} className="progress-overview__trend-card">
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
