import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Gender, Goal } from '../types/auth';
import { registerWithEmail } from '@services/firebase/authService';
import { upsertUserProfile } from '@features/users/services/userRepository';
import type { UserProfile } from '@types/user';
import './AuthLayout.css';

function formatTodayAsYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('other');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<Goal>('gain_muscle');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);
    const parsedAge = Number(age);

    if (Number.isNaN(parsedHeight) || Number.isNaN(parsedWeight) || Number.isNaN(parsedAge)) {
      // Aquí podrías mostrar un mensaje de error de validación en UI
      setError('Altura, peso y edad deben ser números válidos');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const user = await registerWithEmail(email, password);

      const profile: UserProfile = {
        id: user.uid,
        email,
        name,
        gender,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        age: parsedAge,
        goal,
        createdAt: formatTodayAsYYYYMMDD(),
        accept_ai: false,
      };

      await upsertUserProfile(profile);

      // Tras registrar y guardar el perfil, redirigimos al login
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('No se ha podido crear la cuenta. Revisa los datos o inténtalo más tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-card__title">Crear cuenta</h1>
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
            <label className="auth-form__label" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="auth-form__input"
            />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="gender">
              Género
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="auth-form__select"
            >
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="other">Otro / Prefiero no decirlo</option>
            </select>
          </div>

          <div className="auth-form__row">
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor="heightCm">
                Altura (cm)
              </label>
              <input
                id="heightCm"
                type="number"
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
                className="auth-form__input"
              />
            </div>
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor="weightKg">
                Peso (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
                className="auth-form__input"
              />
            </div>
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="age">
              Edad
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="auth-form__input"
            />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label" htmlFor="goal">
              Objetivo
            </label>
            <select
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              className="auth-form__select"
            >
              <option value="gain_muscle">Ganar músculo</option>
              <option value="lose_fat">Perder grasa</option>
              <option value="recomp">Recomposición muscular</option>
            </select>
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
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {error ? (
          <p className="auth-message auth-message--error">{error}</p>
        ) : null}

        <div className="auth-links">
          <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </section>
    </main>
  );
}
