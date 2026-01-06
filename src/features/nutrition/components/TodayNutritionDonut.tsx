import { ResponsivePie } from '@nivo/pie';
import type { TodayNutritionSummary, TodayNutritionEntrySummary } from '@types/nutrition';

interface TodayNutritionDonutProps {
  summary: TodayNutritionSummary | null;
  entries: TodayNutritionEntrySummary[];
  loading: boolean;
  error: string | null;
}

const SEGMENT_COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f97316', '#facc15', '#fb7185'];

const MACRO_COLORS: Record<string, string> = {
  proteinas: '#6366f1', // índigo
  hidratos: '#f97316', // naranja
  grasas: '#fb7185', // rosado
  verduras: '#22c55e', // verde
};

export function TodayNutritionDonut({ summary, entries, loading, error }: TodayNutritionDonutProps) {

  if (loading) {
    return <p>Cargando nutrición de hoy...</p>;
  }

  if (error) {
    return <p style={{ color: '#b91c1c' }}>{error}</p>;
  }

  const total = summary?.totalCalories ?? 0;
  const hasData = total > 0;
  const macroConfigs = [
    {
      key: 'proteinas' as const,
      label: 'Proteínas',
      total: summary?.proteinas ?? 0,
      getValue: (entry: TodayNutritionEntrySummary) => entry.proteinas,
    },
    {
      key: 'hidratos' as const,
      label: 'Hidratos',
      total: summary?.hidratos ?? 0,
      getValue: (entry: TodayNutritionEntrySummary) => entry.hidratos,
    },
    {
      key: 'grasas' as const,
      label: 'Grasas',
      total: summary?.grasas ?? 0,
      getValue: (entry: TodayNutritionEntrySummary) => entry.grasas,
    },
    {
      key: 'verduras' as const,
      label: 'Fruta / verdura',
      total: summary?.verduras ?? 0,
      getValue: (entry: TodayNutritionEntrySummary) => entry.verduras,
    },
  ];

  const maxBarValue = Math.max(...macroConfigs.map((item) => item.total), 1);

  const data = hasData
    ? [
        {
          id: 'proteinas',
          label: 'Proteínas',
          value: summary?.proteinas ?? 0,
          color: MACRO_COLORS.proteinas,
        },
        {
          id: 'hidratos',
          label: 'Hidratos',
          value: summary?.hidratos ?? 0,
          color: MACRO_COLORS.hidratos,
        },
        {
          id: 'grasas',
          label: 'Grasas',
          value: summary?.grasas ?? 0,
          color: MACRO_COLORS.grasas,
        },
        {
          id: 'verduras',
          label: 'Verduras',
          value: summary?.verduras ?? 0,
          color: MACRO_COLORS.verduras,
        },
      ]
    : [
        {
          id: 'sin_datos',
          label: 'Sin datos',
          value: 1, // placeholder para mostrar el donut vacío
        },
      ];

  return (
    <>
      <section
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 style={{ fontSize: 18 }}>Nutrición de hoy</h2>
          <span style={{ fontSize: 14, color: '#4b5563' }}>{total} kcal</span>
        </header>
        <div
          style={{
            height: 260,
            width: '100%',
            maxWidth: 320,
            margin: '0 auto',
          }}
        >
          <ResponsivePie
            data={data}
            margin={{ top: 20, right: 40, bottom: 40, left: 40 }}
            innerRadius={0.6}
            padAngle={1}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={hasData ? { datum: 'data.color' } : ['#e5e7eb']}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            enableArcLinkLabels={false}
            arcLabelsSkipAngle={hasData ? 10 : 360}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          />
        </div>
        {!hasData && (
          <div style={{ textAlign: 'center', paddingTop: 8, color: '#6b7280' }}>
            <p>0 kcal hoy</p>
            <p style={{ fontSize: 12 }}>Registra tus comidas para ver el desglose.</p>
          </div>
        )}
      </section>

      {hasData && (
        <section
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Detalle por grupo</h3>
          {macroConfigs.map((macro) => {
            const segments = entries.map((entry, index) => ({
              index,
              value: macro.getValue(entry),
            }));

            const hasAnySegment = segments.some((seg) => seg.value > 0);

            return (
              <div key={macro.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span
                    style={{
                      color: (MACRO_COLORS as any)[macro.key] ?? '#111827',
                      fontWeight: 600,
                    }}
                  >
                    {macro.label}
                  </span>
                  <span style={{ color: '#4b5563' }}>{macro.total} kcal</span>
                </div>
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: '#e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      width: `${(macro.total / maxBarValue) * 100}%`,
                      height: '100%',
                      transition: 'width 0.25s ease-out',
                    }}
                  >
                    {segments.map((segment) => {
                      if (segment.value <= 0) {
                        return null;
                      }

                      const color = SEGMENT_COLORS[segment.index % SEGMENT_COLORS.length];

                      return (
                        <div
                          key={segment.index}
                          style={{
                            flexGrow: segment.value,
                            backgroundColor: color,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  [
                  {hasAnySegment
                    ? segments.map((segment, index) => {
                        const value = segment.value;
                        const color = SEGMENT_COLORS[segment.index % SEGMENT_COLORS.length];

                        return (
                          <span key={segment.index} style={{ color }}>
                            {` ${value} kcal${index < segments.length - 1 ? ' |' : ''}`}
                          </span>
                        );
                      })
                    : ' 0 kcal'}
                  ]
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );
}
