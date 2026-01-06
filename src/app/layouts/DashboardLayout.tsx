import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import './DashboardLayout.css';

export function DashboardLayout() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <Link to="/app">Gym Tracker</Link>
        </div>

        <nav className="app-header__nav" aria-label="Navegación principal">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `app-header__link${isActive ? ' app-header__link--active' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `app-header__link${isActive ? ' app-header__link--active' : ''}`
            }
          >
            Perfil
          </NavLink>
        </nav>

        <div className="app-header__user">
          {user ? <span>{user.email}</span> : null}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
