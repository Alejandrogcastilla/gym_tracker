import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '@services/firebase/authService';
import './AuthLayout.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginWithEmail(email, password);
      // Redirigimos a la zona interna de la app
      navigate('/app');
    } catch (err) {
      console.error(err);
      setError('No se ha podido iniciar sesión. Revisa tus credenciales.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-card__title">Iniciar sesión</h1>
        <p className="auth-card__subtitle">Vuelve a tu progreso de nutrición y entrenos.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-form__input"
            />
          </div>
          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-form__input"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="auth-form__submit"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error ? (
          <p className="auth-message auth-message--error">{error}</p>
        ) : null}

        <div className="auth-links">
          <Link to="/forgot-password">¿Has olvidado tu contraseña?</Link>
          <Link to="/register">¿No tienes cuenta? Crear cuenta</Link>
        </div>
      </section>
    </main>
  );
}
