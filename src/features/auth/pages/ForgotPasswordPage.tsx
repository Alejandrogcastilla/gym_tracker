import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendResetPasswordEmail } from '@services/firebase/authService';
import './AuthLayout.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      await sendResetPasswordEmail(email);
      setMessage('Si el email existe, hemos enviado un enlace de recuperación.');
    } catch (err) {
      console.error(err);
      setError('No se ha podido enviar el enlace de recuperación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-card__title">Recuperar contraseña</h1>
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

          <button
            type="submit"
            disabled={submitting}
            className="auth-form__submit"
          >
            {submitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        {message ? (
          <p className="auth-message auth-message--success">{message}</p>
        ) : null}
        {error ? (
          <p className="auth-message auth-message--error">{error}</p>
        ) : null}

        <div className="auth-links">
          <Link to="/login">Volver al login</Link>
        </div>
      </section>
    </main>
  );
}
