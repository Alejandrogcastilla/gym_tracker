import { useState } from 'react';
import { TodayNutritionDonut } from '@/features/nutrition/components/TodayNutritionDonut';
import { AddNutritionEntryForm } from '@/features/nutrition/components/AddNutritionEntryForm';
import { TodayNutritionEntriesList } from '@/features/nutrition/components/TodayNutritionEntriesList';
import { useTodayNutrition } from '@/features/nutrition/hooks/useTodayNutrition';
import './DashboardHomePage.css';

type NutritionTab = 'overview' | 'today';

export function DashboardHomePage() {
  const { summary, entries, loading, error, reload } = useTodayNutrition();

  const [nutritionTab, setNutritionTab] = useState<NutritionTab>('overview');
  const [showAddNutritionModal, setShowAddNutritionModal] = useState(false);

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
          Registro de hoy
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
            <TodayNutritionEntriesList entries={entries} onUpdated={reload} />
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
            <AddNutritionEntryForm
              onSaved={() => {
                reload();
                setShowAddNutritionModal(false);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
