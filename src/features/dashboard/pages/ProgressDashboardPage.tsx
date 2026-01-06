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
      <section className="dashboard-container">
        <header className="dashboard-header">
          <p className="dashboard-header-text">
            Gestiona tus entrenamientos, medidas y progreso.
          </p>
        </header>

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
      </section>
    </main>
  );
}
