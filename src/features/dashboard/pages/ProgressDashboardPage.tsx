import { useState } from 'react';
import { AddTrainingEntryForm } from '@/features/training/components/AddTrainingEntryForm';
import { AddMeasurementsForm } from '@/features/training/components/AddMeasurementsForm';
import { ProgressOverview } from '@/features/training/components/ProgressOverview';
import { RecentTrainingsList } from '@/features/training/components/RecentTrainingsList';
import './DashboardHomePage.css';

type ProgressTab = 'training' | 'measures' | 'progress';
type ProgressRange = 'today' | '7d' | 'month';

export function ProgressDashboardPage() {
  const [progressTab, setProgressTab] = useState<ProgressTab>('training');
  const [progressRange, setProgressRange] = useState<ProgressRange>('7d');
  const [showTrainingHistoryModal, setShowTrainingHistoryModal] = useState(false);

  return (
    <main className="dashboard-page">
      <nav
        className="app-top-nav"
        aria-label="Navegación de progreso"
      >
        <button
          type="button"
          onClick={() => setProgressTab('training')}
          className={`app-top-nav__item${
            progressTab === 'training' ? ' app-top-nav__item--active' : ''
          }`}
        >
          <span className="material-symbols-outlined">fitness_center</span>
          <span>Entrenamiento</span>
        </button>
        <button
          type="button"
          onClick={() => setProgressTab('progress')}
          className={`app-top-nav__item${
            progressTab === 'progress' ? ' app-top-nav__item--active' : ''
          }`}
        >
          <span className="material-symbols-outlined">query_stats</span>
          <span>Progreso</span>
        </button>
        <button
          type="button"
          onClick={() => setProgressTab('measures')}
          className={`app-top-nav__item${
            progressTab === 'measures' ? ' app-top-nav__item--active' : ''
          }`}
        >
          <span className="material-symbols-outlined">straighten</span>
          <span>Medidas</span>
        </button>
      </nav>

      <section className="dashboard-container">
        {progressTab === 'training' && (
          <>
            <AddTrainingEntryForm
              onOpenHistory={() => setShowTrainingHistoryModal(true)}
            />
          </>
        )}
        {progressTab === 'measures' && <AddMeasurementsForm />}
        {progressTab === 'progress' && (
          <>
            <div className="dashboard-progress-tabs" aria-label="Filtro de rango de progreso">
              <button
                type="button"
                className={`dashboard-progress-tab${
                  progressRange === 'today' ? ' dashboard-progress-tab--active' : ''
                }`}
                onClick={() => setProgressRange('today')}
              >
                Hoy
              </button>
              <button
                type="button"
                className={`dashboard-progress-tab${
                  progressRange === '7d' ? ' dashboard-progress-tab--active' : ''
                }`}
                onClick={() => setProgressRange('7d')}
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                className={`dashboard-progress-tab${
                  progressRange === 'month' ? ' dashboard-progress-tab--active' : ''
                }`}
                onClick={() => setProgressRange('month')}
              >
                Mes
              </button>
            </div>

            <ProgressOverview range={progressRange} />
          </>
        )}
      </section>
      {showTrainingHistoryModal && (
        <div
          className="dashboard-modal-overlay dashboard-modal-overlay--full"
          role="dialog"
          aria-modal="true"
          aria-label="Historial de entrenamientos"
        >
          <div className="dashboard-modal dashboard-modal--full">
            <button
              type="button"
              className="dashboard-modal__close"
              aria-label="Cerrar"
              onClick={() => setShowTrainingHistoryModal(false)}
            >
              ×
            </button>
            <div className="dashboard-modal__body">
              <RecentTrainingsList />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
