import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { TodayNutritionDonut } from '@/features/nutrition/components/TodayNutritionDonut';
import { useMonthlyNutrition } from '@/features/nutrition/hooks/useMonthlyNutrition';

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function getMonthKey(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() };
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(year: number, month: number): number {
  // 0 (Sunday) - 6 (Saturday); we want 0 = Monday
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function NutritionHistoryPage() {
  const { user } = useAuth();
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const { year, month } = getMonthKey(currentMonthDate);
  const { dataByDay, loading, error } = useMonthlyNutrition(year, month);

  if (!user) {
    return null;
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);

  const cells: Array<{ day: number | null; key: string | null; hasData: boolean }> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ day: null, key: null, hasData: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = toDayKey(date);
    const hasData = Boolean(dataByDay[key] && dataByDay[key].summary.totalCalories > 0);
    cells.push({ day, key, hasData });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const selectedData = selectedDayKey ? dataByDay[selectedDayKey] : null;

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDayKey(null);
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDayKey(null);
  };

  const todayKey = toDayKey(new Date());

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Histórico de nutrición</h1>
      <p style={{ marginBottom: 16 }}>Selecciona un día del calendario para ver el resumen.</p>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 960,
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 360,
          }}
        >
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            {'<'}
          </button>
          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{formatMonthLabel(currentMonthDate)}</span>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
            }}
          >
            {'>'}
          </button>
        </header>

        <section
          style={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            padding: 12,
            maxWidth: 360,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 4,
              marginBottom: 8,
              fontSize: 12,
              color: '#6b7280',
              textAlign: 'center',
            }}
          >
            <span>L</span>
            <span>M</span>
            <span>X</span>
            <span>J</span>
            <span>V</span>
            <span>S</span>
            <span>D</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 4,
            }}
          >
            {weeks.map((week, wi) =>
              week.map((cell, di) => {
                if (!cell.key || cell.day === null) {
                  return <div key={`${wi}-${di}`} style={{ height: 32 }} />;
                }

                const isSelected = selectedDayKey === cell.key;
                const isToday = cell.key === todayKey;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDayKey(cell.key)}
                    style={{
                      height: 32,
                      borderRadius: 6,
                      border: isSelected ? '2px solid #111827' : '1px solid #e5e7eb',
                      backgroundColor: cell.hasData ? '#dcfce7' : '#f9fafb',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      color: '#111827',
                    }}
                  >
                    <span>{cell.day}</span>
                    {cell.hasData ? (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '999px',
                          backgroundColor: '#16a34a',
                          position: 'absolute',
                          bottom: 3,
                          right: 3,
                        }}
                      />
                    ) : null}
                    {isToday ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 3,
                          width: 4,
                          height: 4,
                          borderRadius: '999px',
                          backgroundColor: '#3b82f6',
                        }}
                      />
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>

          {loading ? <p style={{ marginTop: 8, fontSize: 12 }}>Cargando datos del mes...</p> : null}
          {error ? (
            <p style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>{error}</p>
          ) : null}

          <p style={{ marginTop: 8, fontSize: 11, color: '#6b7280' }}>
            Verde indica que hay al menos un registro de nutrición en ese día.
          </p>
        </section>

        {selectedData ? (
          <section style={{ marginTop: 8 }}>
            <TodayNutritionDonut
              summary={selectedData.summary}
              entries={selectedData.entries}
              loading={false}
              error={null}
            />
          </section>
        ) : null}
      </section>
    </main>
  );
}
