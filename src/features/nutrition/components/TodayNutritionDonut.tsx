import { ResponsivePie } from '@nivo/pie';
import type { TodayNutritionSummary, TodayNutritionEntrySummary } from '@types/nutrition';
import './TodayNutritionDonut.css';

interface TodayNutritionDonutProps {
  summary: TodayNutritionSummary | null;
  entries: TodayNutritionEntrySummary[];
  loading: boolean;
  error: string | null;
}

const SEGMENT_COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f97316', '#facc15', '#fb7185'];

const SEGMENT_COLOR_CLASSNAMES = [
  'today-nutrition__value--segment-0',
  'today-nutrition__value--segment-1',
  'today-nutrition__value--segment-2',
  'today-nutrition__value--segment-3',
  'today-nutrition__value--segment-4',
  'today-nutrition__value--segment-5',
];

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
      <section className="today-nutrition">
        <header className="today-nutrition__header">
          <h2 className="today-nutrition__title">Nutrición de hoy</h2>
        </header>
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
            enableArcLinkLabels={false}
            arcLabelsSkipAngle={hasData ? 10 : 360}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            layers={[
              'arcs',
              'arcLabels',
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
        {!hasData && (
          <div className="today-nutrition__empty">
            <p>0 kcal hoy</p>
            <p className="today-nutrition__empty-text">Registra tus comidas para ver el desglose.</p>
          </div>
        )}
      </section>

      <section className="today-nutrition-macros">
        <h3 className="today-nutrition-macros__title">Macros</h3>
        {macroConfigs.map((macro) => {
          const segments = entries.map((entry, index) => ({
            index,
            value: macro.getValue(entry),
          }));

          const hasAnySegment = segments.some((seg) => seg.value > 0);

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
              <div className="today-nutrition-macros__values">
                [
                {hasAnySegment
                  ? segments.map((segment, index) => {
                      const value = segment.value;
                      const className =
                        SEGMENT_COLOR_CLASSNAMES[segment.index % SEGMENT_COLOR_CLASSNAMES.length];

                      return (
                        <span key={segment.index} className={className}>
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
    </>
  );
}
