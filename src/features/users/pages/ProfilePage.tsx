import { FormEvent, useEffect, useState } from 'react';
import { useUserProfile } from '@/features/users/hooks/useUserProfile';
import { logout } from '@services/firebase/authService';
import { useNavigate } from 'react-router-dom';
import { upsertUserProfile } from '@/features/users/services/userRepository';
import type { Gender, Goal } from '@/features/auth/types/auth';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, loading, error, reload } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      <main style={{ minHeight: '100vh', padding: 24 }}>
        <p>Cargando perfil...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: 24 }}>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ minHeight: '100vh', padding: 24 }}>
        <p>No hay perfil para mostrar. ¿Has iniciado sesión?</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24, maxWidth: 640 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24 }}>Mi perfil</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #dc2626',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            style={{
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#111827',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Cancelar' : 'Editar información'}
          </button>
        </div>
      </header>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} style={{ maxWidth: 480 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="gender">
              Género
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            >
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
              <option value="other">Otro / Prefiero no decirlo</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4 }} htmlFor="heightCm">
                Altura (cm)
              </label>
              <input
                id="heightCm"
                type="number"
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 4 }} htmlFor="weightKg">
                Peso (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="age">
              Edad
            </label>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="goal">
              Objetivo
            </label>
            <select
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            >
              <option value="gain_muscle">Ganar músculo</option>
              <option value="lose_fat">Perder grasa</option>
              <option value="recomp">Recomposición muscular</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }} htmlFor="weightGoalKg">
              Peso objetivo (kg)
            </label>
            <input
              id="weightGoalKg"
              type="number"
              inputMode="decimal"
              value={weightGoalKg}
              onChange={(e) => setWeightGoalKg(e.target.value)}
              placeholder="Opcional, ej. 70"
              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              backgroundColor: '#111827',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>

          {formError ? (
            <p style={{ marginTop: 12, color: '#b91c1c' }}>{formError}</p>
          ) : null}
        </form>
      ) : (
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 8, columnGap: 16 }}>
          <dt style={{ fontWeight: 600 }}>Email</dt>
          <dd>{profile.email}</dd>

          <dt style={{ fontWeight: 600 }}>Nombre</dt>
          <dd>{profile.name}</dd>

          <dt style={{ fontWeight: 600 }}>Género</dt>
          <dd>{profile.gender}</dd>

          <dt style={{ fontWeight: 600 }}>Altura</dt>
          <dd>{profile.heightCm} cm</dd>

          <dt style={{ fontWeight: 600 }}>Peso</dt>
          <dd>{profile.weightKg} kg</dd>

          <dt style={{ fontWeight: 600 }}>Edad</dt>
          <dd>{profile.age} años</dd>

          <dt style={{ fontWeight: 600 }}>Objetivo</dt>
          <dd>{profile.goal}</dd>

          <dt style={{ fontWeight: 600 }}>Peso objetivo</dt>
          <dd>{profile.weightGoalKg != null ? `${profile.weightGoalKg} kg` : '—'}</dd>
        </dl>
      )}
    </main>
  );
}
