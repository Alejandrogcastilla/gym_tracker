import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import './DashboardLayout.css';

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__date">{formattedDate}</span>
        {user ? (
          <NavLink
            to="/app/profile"
            className="app-profile-pill app-header__profile"
            aria-label="Ver perfil"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </NavLink>
        ) : null}
      </header>

      <main className="app-main">
        <div className="app-main__inner">
          <div key={location.pathname} className="route-transition">
            <Outlet />
          </div>
        </div>
      </main>

      <nav className="app-bottom-nav" aria-label="Navegación de la aplicación">
        <NavLink
          to="/app/progress"
          className={({ isActive }) =>
            `app-bottom-nav__item${isActive ? ' app-bottom-nav__item--active' : ''}`
          }
        >
          <span className="material-symbols-outlined">query_stats</span>
          <span className="app-bottom-nav__label">Progreso</span>
        </NavLink>
        <NavLink
          to="/app"
          end
          className={({ isActive }) =>
            `app-bottom-nav__item${isActive ? ' app-bottom-nav__item--active' : ''}`
          }
        >
          <span className="material-symbols-outlined">home</span>
          <span className="app-bottom-nav__label">Inicio</span>
        </NavLink>
        <NavLink
          to="/app/photos"
          className={({ isActive }) =>
            `app-bottom-nav__item${isActive ? ' app-bottom-nav__item--active' : ''}`
          }
        >
          <span className="material-symbols-outlined">photo_camera</span>
          <span className="app-bottom-nav__label">Foto</span>
        </NavLink>
      </nav>
    </div>
  );
}
