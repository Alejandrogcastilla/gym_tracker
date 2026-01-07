import { useState } from 'react';
import { AddTrainingEntryForm } from '@/features/training/components/AddTrainingEntryForm';
import { AddMeasurementsForm } from '@/features/training/components/AddMeasurementsForm';
import { ProgressOverview } from '@/features/training/components/ProgressOverview';
import './DashboardHomePage.css';

type ProgressTab = 'training' | 'measures' | 'progress';

export function ProgressDashboardPage() {
  const [progressTab, setProgressTab] = useState<ProgressTab>('training');

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
          <span>Añadir entrenamiento</span>
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
          <span>Añadir medidas</span>
        </button>
      </nav>

      <section className="dashboard-container">

        <div className="dashboard-progress-content">
          {progressTab === 'training' && <AddTrainingEntryForm />}
          {progressTab === 'measures' && <AddMeasurementsForm />}
          {progressTab === 'progress' && <ProgressOverview />}
        </div>
      </section>
    </main>
  );
}
