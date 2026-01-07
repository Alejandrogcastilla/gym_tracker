import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import './DashboardLayout.css';

type ThemeMode = 'light' | 'dark';

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem('app-theme');
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__left">
          <div className="app-logo">
            <span className="app-logo__dot" />
            <div className="app-logo__text-group">
              <span className="app-logo__title">GymTrack</span>
              <span className="app-logo__subtitle">Salud &amp; progreso</span>
            </div>
          </div>
          <span className="app-header__date">{formattedDate}</span>
        </div>
        <div className="app-header__right">
          <button
            type="button"
            className="app-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          {user ? (
            <NavLink
              to="/app/profile"
              className="app-profile-pill"
              aria-label="Ver perfil"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </NavLink>
          ) : null}
        </div>
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
