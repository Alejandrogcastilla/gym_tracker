import { useState } from 'react';
import { TodayNutritionDonut } from '@/features/nutrition/components/TodayNutritionDonut';
import { AddNutritionEntryForm } from '@/features/nutrition/components/AddNutritionEntryForm';
import { TodayNutritionEntriesList } from '@/features/nutrition/components/TodayNutritionEntriesList';
import { useTodayNutrition } from '@/features/nutrition/hooks/useTodayNutrition';
import { useLast7DaysNutritionEntries } from '@/features/nutrition/hooks/useLast7DaysNutritionEntries';
import { useThisMonthNutritionEntries } from '@/features/nutrition/hooks/useThisMonthNutritionEntries';
import './DashboardHomePage.css';

type NutritionTab = 'overview' | 'today';
type NutritionRange = 'today' | '7d' | 'month';

export function DashboardHomePage() {
  const { summary, entries, loading, error, reload } = useTodayNutrition();

  const {
    entries: last7DaysEntries,
    reload: reloadLast7Days,
  } = useLast7DaysNutritionEntries();

  const {
    entries: monthEntries,
    reload: reloadMonth,
  } = useThisMonthNutritionEntries();

  const [nutritionTab, setNutritionTab] = useState<NutritionTab>('overview');
  const [showAddNutritionModal, setShowAddNutritionModal] = useState(false);
  const [nutritionRange, setNutritionRange] = useState<NutritionRange>('7d');

  return (
    <main className="dashboard-page">
      <nav
        className="app-top-nav"
        aria-label="Navegación de inicio de nutrición"
      >
        <button
          type="button"
          onClick={() => setNutritionTab('overview')}
          className={`app-top-nav__item${
            nutritionTab === 'overview' ? ' app-top-nav__item--active' : ''
          }`}
        >
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setNutritionTab('today')}
          className={`app-top-nav__item${
            nutritionTab === 'today' ? ' app-top-nav__item--active' : ''
          }`}
        >
          Últimos registros
        </button>
      </nav>

      <section className="dashboard-container">

        <div className="dashboard-nutrition">
          {nutritionTab === 'overview' && (
            <div className="dashboard-today-main">
              <TodayNutritionDonut
                summary={summary}
                entries={entries}
                loading={loading}
                error={error}
              />

              <button
                type="button"
                className="dashboard-add-entry-button"
                onClick={() => setShowAddNutritionModal(true)}
              >
                Añadir registro de nutrición
              </button>
            </div>
          )}

          {nutritionTab === 'today' && (
            <>
              <div className="dashboard-progress-tabs" aria-label="Filtro de rango de registros de nutrición">
                <button
                  type="button"
                  className={`dashboard-progress-tab${
                    nutritionRange === 'today' ? ' dashboard-progress-tab--active' : ''
                  }`}
                  onClick={() => setNutritionRange('today')}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className={`dashboard-progress-tab${
                    nutritionRange === '7d' ? ' dashboard-progress-tab--active' : ''
                  }`}
                  onClick={() => setNutritionRange('7d')}
                >
                  Últimos 7 días
                </button>
                <button
                  type="button"
                  className={`dashboard-progress-tab${
                    nutritionRange === 'month' ? ' dashboard-progress-tab--active' : ''
                  }`}
                  onClick={() => setNutritionRange('month')}
                >
                  Mes
                </button>
              </div>

              <TodayNutritionEntriesList
                entries={
                  nutritionRange === 'today'
                    ? entries
                    : nutritionRange === '7d'
                      ? last7DaysEntries
                      : monthEntries
                }
                onUpdated={
                  nutritionRange === 'today'
                    ? reload
                    : nutritionRange === '7d'
                      ? reloadLast7Days
                      : reloadMonth
                }
                title={
                  nutritionRange === 'today'
                    ? 'Registros de hoy'
                    : nutritionRange === '7d'
                      ? 'Últimos registros (7 días)'
                      : 'Registros de este mes'
                }
                emptyMessage={
                  nutritionRange === 'today'
                    ? 'Todavía no has añadido ningún registro de nutrición hoy.'
                    : nutritionRange === '7d'
                      ? 'Todavía no has añadido ningún registro de nutrición en los últimos 7 días.'
                      : 'Todavía no has añadido ningún registro de nutrición en este mes.'
                }
              />
            </>
          )}
        </div>
      </section>

      {showAddNutritionModal && (
        <div
          className="dashboard-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Añadir registro de nutrición"
        >
          <div className="dashboard-modal">
            <button
              type="button"
              className="dashboard-modal__close"
              aria-label="Cerrar"
              onClick={() => setShowAddNutritionModal(false)}
            >
              ×
            </button>
            <div className="dashboard-modal__body">
              <AddNutritionEntryForm
                onSaved={() => {
                  reload();
                  setShowAddNutritionModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
