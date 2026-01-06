import { useState } from 'react';
import { TodayNutritionDonut } from '@/features/nutrition/components/TodayNutritionDonut';
import { AddNutritionEntryForm } from '@/features/nutrition/components/AddNutritionEntryForm';
import { TodayNutritionEntriesList } from '@/features/nutrition/components/TodayNutritionEntriesList';
import { AddTrainingEntryForm } from '@/features/training/components/AddTrainingEntryForm';
import { AddMeasurementsForm } from '@/features/training/components/AddMeasurementsForm';
import { ProgressOverview } from '@/features/training/components/ProgressOverview';
import { useTodayNutrition } from '@/features/nutrition/hooks/useTodayNutrition';
import './DashboardHomePage.css';

type DashboardMode = 'nutrition' | 'progress';
type ProgressTab = 'training' | 'measures' | 'progress';
type NutritionTab = 'overview' | 'today';


export function DashboardHomePage() {
  const { summary, entries, loading, error, reload } = useTodayNutrition();

  const [mode, setMode] = useState<DashboardMode>('nutrition');
  const [nutritionTab, setNutritionTab] = useState<NutritionTab>('overview');
  const [progressTab, setProgressTab] = useState<ProgressTab>('training');
  const [showAddNutritionModal, setShowAddNutritionModal] = useState(false);

  return (
    <main className="dashboard-page">

      <section className="dashboard-container">
        <nav
          className="dashboard-main-nav"
          aria-label="Secciones principales del dashboard"
        >
          <button
            type="button"
            onClick={() => setMode('nutrition')}
            className={`dashboard-main-nav__button${
              mode === 'nutrition' ? ' dashboard-main-nav__button--active' : ''
            }`}
          >
            Nutrición
          </button>
          <button
            type="button"
            onClick={() => setMode('progress')}
            className={`dashboard-main-nav__button${
              mode === 'progress' ? ' dashboard-main-nav__button--active' : ''
            }`}
          >
            Progreso
          </button>
        </nav>

        <header className="dashboard-header">
          {mode === 'nutrition' && (
            <p className="dashboard-header-text">Resumen de tu día de hoy.</p>
          )}
          {mode === 'progress' && (
            <p className="dashboard-header-text">Gestiona tus entrenamientos, medidas y progreso.</p>
          )}
        </header>

        {mode === 'nutrition' && (
          <div className="dashboard-nutrition">
            <div className="dashboard-nutrition-tabs">
              <button
                type="button"
                onClick={() => setNutritionTab('overview')}
                className={`dashboard-nutrition-tab${
                  nutritionTab === 'overview' ? ' dashboard-nutrition-tab--active' : ''
                }`}
              >
                Resumen
              </button>
              <button
                type="button"
                onClick={() => setNutritionTab('today')}
                className={`dashboard-nutrition-tab${
                  nutritionTab === 'today' ? ' dashboard-nutrition-tab--active' : ''
                }`}
              >
                Registros de hoy
              </button>
            </div>

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
        )}

        {mode === 'progress' && (
          <div className="dashboard-progress-content">
            <div className="dashboard-progress-tabs">
              <button
                type="button"
                onClick={() => setProgressTab('training')}
                className={`dashboard-progress-tab${
                  progressTab === 'training' ? ' dashboard-progress-tab--active' : ''
                }`}
              >
                Añadir entrenamiento
              </button>
              <button
                type="button"
                onClick={() => setProgressTab('measures')}
                className={`dashboard-progress-tab${
                  progressTab === 'measures' ? ' dashboard-progress-tab--active' : ''
                }`}
              >
                Añadir medidas
              </button>
              <button
                type="button"
                onClick={() => setProgressTab('progress')}
                className={`dashboard-progress-tab${
                  progressTab === 'progress' ? ' dashboard-progress-tab--active' : ''
                }`}
              >
                Progreso
              </button>
            </div>

            {progressTab === 'training' && <AddTrainingEntryForm />}
            {progressTab === 'measures' && <AddMeasurementsForm />}
            {progressTab === 'progress' && <ProgressOverview />}
          </div>
        )}
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
