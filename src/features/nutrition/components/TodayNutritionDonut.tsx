import { useEffect, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import type { TodayNutritionSummary, TodayNutritionEntrySummary } from '@types/nutrition';
import './TodayNutritionDonut.css';

interface TodayNutritionDonutProps {
  summary: TodayNutritionSummary | null;
  entries: TodayNutritionEntrySummary[];
  loading: boolean;
  error: string | null;
}

const MACRO_COLORS: Record<string, string> = {
  // Rojo: proteínas, antioxidantes
  proteinas: '#ef4444',
  // Amarillo/Naranja: hidratos, vitamina C
  hidratos: '#f97316',
  // Marrón/Blanco: grasas saludables
  grasas: '#92400e',
  // Verde: vitaminas, minerales, fibra
  verduras: '#22c55e',
};

export function TodayNutritionDonut({ summary, entries, loading, error }: TodayNutritionDonutProps) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [hoveredMacroSegment, setHoveredMacroSegment] = useState<{
    macroKey: string;
    value: number;
    centerPercent: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 640px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSmallScreen(event.matches);
    };

    // Initial value
    handleChange(mq);

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
      return () => mq.removeEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    }

    // Fallback para navegadores antiguos
    // eslint-disable-next-line deprecation/deprecation
    mq.addListener(handleChange as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
    return () => {
      // eslint-disable-next-line deprecation/deprecation
      mq.removeListener(handleChange as (this: MediaQueryList, ev: MediaQueryListEvent) => void);
    };
  }, []);

  if (loading) {
    return <p>Cargando nutrición de hoy...</p>;
  }

  if (error) {
    return <p className="today-nutrition__error">{error}</p>;
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
      label: 'Fruta / Verdura',
      total: summary?.verduras ?? 0,
      getValue: (entry: TodayNutritionEntrySummary) => entry.verduras,
    },
  ];

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
      <section className="today-nutrition">
        <div className="today-nutrition__chart">
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
            enableArcLabels={false}
            enableArcLinkLabels={hasData && !isSmallScreen}
            arcLinkLabel={(datum) =>
              ((datum.data as { label?: string }).label ?? String(datum.id))
            }
            arcLinkLabelsSkipAngle={8}
            arcLinkLabelsOffset={10}
            arcLinkLabelsDiagonalLength={14}
            arcLinkLabelsStraightLength={12}
            arcLinkLabelsTextColor="#0f172a"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            tooltip={({ datum }) => {
              const label = (datum.data as { label?: string }).label ?? String(datum.id);
              return (
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'white',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.18)',
                    fontSize: 12,
                    color: '#0f172a',
                  }}
                >
                  <strong>{label}</strong>
                  <div>{`${datum.value} kcal`}</div>
                </div>
              );
            }}
            layers={[
              'arcs',
              'arcLinkLabels',
              (layerProps) => (
                <text
                  key="center-label"
                  x={layerProps.centerX}
                  y={layerProps.centerY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={18}
                  fontWeight={600}
                  fill="#111827"
                >
                  {`${total} kcal`}
                </text>
              ),
            ]}
          />
        </div>
        {hasData && isSmallScreen && (
          <div className="today-nutrition__legend">
            {data.map((item) => (
              <div key={String(item.id)} className="today-nutrition__legend-item">
                {'color' in item && (
                  <span
                    className="today-nutrition__legend-dot"
                    style={{ backgroundColor: (item as { color?: string }).color }}
                  />
                )}
                <span className="today-nutrition__legend-label">{item.label}</span>
                <span className="today-nutrition__legend-value">{item.value} kcal</span>
              </div>
            ))}
          </div>
        )}
        {!hasData && (
          <div className="today-nutrition__empty">
            <p>0 kcal hoy</p>
            <p className="today-nutrition__empty-text">Registra tus comidas para ver el desglose.</p>
          </div>
        )}
      </section>

      <section className="today-nutrition-macros">
        {macroConfigs.map((macro) => {
          const segments = entries.map((entry, index) => ({
            index,
            value: macro.getValue(entry),
          }));

          return (
            <div key={macro.key} className="today-nutrition-macros__item">
              <div className="today-nutrition-macros__item-header">
                <span
                  className={
                    `today-nutrition-macros__label today-nutrition-macros__label--${macro.key}`
                  }
                >
                  {macro.label}
                </span>
                <span className="today-nutrition-macros__total">{macro.total} kcal</span>
              </div>
              <div className="today-nutrition-macros__bar-wrapper">
                <div className="today-nutrition-macros__bar">
                  {macro.total > 0 &&
                    (() => {
                      const activeSegments = segments.filter((segment) => segment.value > 0);
                      let offsetPercent = 0;

                      return activeSegments.map((segment) => {
                        const widthPercent = (segment.value / macro.total) * 100;
                        const centerPercent = offsetPercent + widthPercent / 2;
                        offsetPercent += widthPercent;

                        return (
                          <div
                            key={segment.index}
                            className="today-nutrition-macros__bar-segment"
                            style={{
                              width: `${widthPercent}%`,
                              backgroundColor: MACRO_COLORS[macro.key],
                            }}
                            title={`${macro.label}: ${segment.value} kcal`}
                            aria-label={`${macro.label}: ${segment.value} kcal`}
                            onMouseEnter={() =>
                              setHoveredMacroSegment({
                                macroKey: macro.key,
                                value: segment.value,
                                centerPercent,
                              })
                            }
                            onMouseLeave={() => setHoveredMacroSegment(null)}
                          />
                        );
                      });
                    })()}
                </div>
                {hoveredMacroSegment && hoveredMacroSegment.macroKey === macro.key && (
                  <div
                    className="today-nutrition-macros__hover-value"
                    style={{ left: `${hoveredMacroSegment.centerPercent}%` }}
                  >
                    {hoveredMacroSegment.value} kcal
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
