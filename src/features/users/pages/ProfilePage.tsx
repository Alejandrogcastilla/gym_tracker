import { FormEvent, useEffect, useState } from 'react';
import { collection, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/features/users/hooks/useUserProfile';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logout } from '@services/firebase/authService';
import { upsertUserProfile } from '@/features/users/services/userRepository';
import { firebaseDb } from '@services/firebase/firebaseClient';
import type { Gender, Goal } from '@/features/auth/types/auth';
import './ProfilePage.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, error, reload } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('other');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [goal, setGoal] = useState<Goal>('gain_muscle');
  const [weightGoalKg, setWeightGoalKg] = useState('');

  useEffect(() => {
    if (profile && isEditing) {
      setName(profile.name);
      setGender(profile.gender);
      setHeightCm(String(profile.heightCm));
      setWeightKg(String(profile.weightKg));
      setAge(String(profile.age));
      setGoal(profile.goal);
      setWeightGoalKg(
        typeof profile.weightGoalKg === 'number' && !Number.isNaN(profile.weightGoalKg)
          ? String(profile.weightGoalKg)
          : '',
      );
    }
  }, [profile, isEditing]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // Limpiamos almacenamiento del navegador y redirigimos al login
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignorar errores de acceso al almacenamiento
      }
      navigate('/login', { replace: true });
    }
  };

  const openResetConfirm = () => {
    setResetError(null);
    setResetStatus(null);
    setShowResetConfirm(true);
  };

  const handleResetAccount = async () => {
    if (!user) return;

    setResetError(null);
    setResetStatus(null);
    setResetting(true);

    try {
      const uid = user.uid;
      const collectionsToClear = ['entrenamientos', 'nutricion', 'progreso'];

      for (const colName of collectionsToClear) {
        const colRef = collection(firebaseDb, colName);
        const q = query(colRef, where('id_usuario', '==', uid));
        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
      }

      setResetStatus('Se han borrado tus entrenamientos, registros de nutrición y progreso.');
    } catch (err) {
      console.error(err);
      setResetError('No se ha podido resetear la cuenta. Inténtalo más tarde.');
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);
    const parsedAge = Number(age);

    let parsedWeightGoal: number | null = null;
    if (weightGoalKg.trim() !== '') {
      const n = Number(weightGoalKg);
      if (Number.isNaN(n)) {
        setFormError('El peso objetivo debe ser un número válido');
        return;
      }
      parsedWeightGoal = n;
    }

    if (Number.isNaN(parsedHeight) || Number.isNaN(parsedWeight) || Number.isNaN(parsedAge)) {
      setFormError('Altura, peso y edad deben ser números válidos');
      return;
    }

    setFormError(null);
    setSaving(true);

    try {
      await upsertUserProfile({
        ...profile,
        name,
        gender,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        age: parsedAge,
        goal,
        weightGoalKg: parsedWeightGoal,
      });
      await reload();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setFormError('No se ha podido guardar los cambios. Inténtalo más tarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-page__inner">
          <p>Cargando perfil...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page">
        <div className="profile-page__inner">
          <p className="profile-error">{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <div className="profile-page__inner">
          <p>No hay perfil para mostrar. ¿Has iniciado sesión?</p>
        </div>
      </main>
    );
  }
  const genderLabel: Record<Gender, string> = {
    male: 'Hombre',
    female: 'Mujer',
    other: 'Otro / Prefiero no decirlo',
  };

  const goalLabel: Record<Goal, string> = {
    gain_muscle: 'Ganar músculo',
    lose_fat: 'Perder grasa',
    recomp: 'Recomposición muscular',
  };

  return (
    <main className="profile-page">
      <div className="profile-page__inner">
        <section className="profile-card">
          <header className="profile-header">
            <div className="profile-header__main">
              <div className="profile-header-text">
                <h1 className="profile-title">Mi perfil</h1>
                <p className="profile-subtitle">{profile.email}</p>
              </div>
            </div>
            <div className="profile-actions">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="profile-action profile-action--secondary"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {isEditing ? 'close' : 'edit'}
                </span>
              </button>
            </div>
          </header>

          <div className="profile-body">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="profile-form">
                <div className="profile-field-group">
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="name">
                      Nombre
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>

                  <div className="profile-field">
                    <label className="profile-label" htmlFor="gender">
                      Género
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="profile-select"
                    >
                      <option value="male">Hombre</option>
                      <option value="female">Mujer</option>
                      <option value="other">Otro / Prefiero no decirlo</option>
                    </select>
                  </div>
                </div>

                <div className="profile-field-row">
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="heightCm">
                      Altura (cm)
                    </label>
                    <input
                      id="heightCm"
                      type="number"
                      inputMode="decimal"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="weightKg">
                      Peso (kg)
                    </label>
                    <input
                      id="weightKg"
                      type="number"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>
                </div>

                <div className="profile-field-row">
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="age">
                      Edad
                    </label>
                    <input
                      id="age"
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      className="profile-input"
                    />
                  </div>
                  <div className="profile-field">
                    <label className="profile-label" htmlFor="goal">
                      Objetivo
                    </label>
                    <select
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as Goal)}
                      className="profile-select"
                    >
                      <option value="gain_muscle">Ganar músculo</option>
                      <option value="lose_fat">Perder grasa</option>
                      <option value="recomp">Recomposición muscular</option>
                    </select>
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label" htmlFor="weightGoalKg">
                    Peso objetivo (kg)
                  </label>
                  <input
                    id="weightGoalKg"
                    type="number"
                    inputMode="decimal"
                    value={weightGoalKg}
                    onChange={(e) => setWeightGoalKg(e.target.value)}
                    placeholder="Opcional, ej. 70"
                    className="profile-input"
                  />
                </div>

                <button type="submit" disabled={saving} className="profile-submit">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>

                {formError ? <p className="profile-error">{formError}</p> : null}
              </form>
            ) : (
              <dl className="profile-details">
                <dt>Email</dt>
                <dd>{profile.email}</dd>

                <dt>Nombre</dt>
                <dd>{profile.name}</dd>

                <dt>Género</dt>
                <dd>{genderLabel[profile.gender]}</dd>

                <dt>Altura</dt>
                <dd>{profile.heightCm} cm</dd>

                <dt>Peso</dt>
                <dd>{profile.weightKg} kg</dd>

                <dt>Edad</dt>
                <dd>{profile.age} años</dd>

                <dt>Objetivo</dt>
                <dd>{goalLabel[profile.goal]}</dd>

                <dt>Peso objetivo</dt>
                <dd>{profile.weightGoalKg != null ? `${profile.weightGoalKg} kg` : '—'}</dd>
              </dl>
            )}
          </div>
          <div className="profile-footer">
            {resetError && <p className="profile-reset-status profile-reset-status--error">{resetError}</p>}
            {resetStatus && !resetError && (
              <p className="profile-reset-status profile-reset-status--success">{resetStatus}</p>
            )}
            <button
              type="button"
              onClick={openResetConfirm}
              className="profile-reset"
              disabled={resetting}
            >
              {resetting ? 'Reseteando datos...' : 'Resetear cuenta (datos)'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="profile-logout"
            >
              Cerrar sesión
            </button>
          </div>
        </section>
      </div>

      {showResetConfirm && (
        <div className="profile-modal-overlay" role="dialog" aria-modal="true">
          <div className="profile-modal">
            <h2 className="profile-modal__title">Resetear cuenta</h2>
            <p className="profile-modal__text">
              Esto borrará todos tus entrenamientos, registros de nutrición y progreso. Esta acción no se puede
              deshacer.
            </p>
            <div className="profile-modal__actions">
              <button
                type="button"
                className="profile-modal__button profile-modal__button--secondary"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="profile-modal__button profile-modal__button--danger"
                onClick={handleResetAccount}
                disabled={resetting}
              >
                {resetting ? 'Borrando...' : 'Borrar datos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
