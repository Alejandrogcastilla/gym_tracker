import './DashboardHomePage.css';

export function PhotosPage() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-container">
        <header className="dashboard-header">
          <p className="dashboard-header-text">Tus fotos de progreso.</p>
        </header>

        <div style={{ padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Aquí podrás gestionar y consultar tus fotos de progreso. Próximamente podrás subir nuevas
            fotos y compararlas con semanas anteriores.
          </p>
        </div>
      </section>
    </main>
  );
}
