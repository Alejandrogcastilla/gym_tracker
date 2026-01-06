import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { DashboardHomePage } from '@/features/dashboard/pages/DashboardHomePage';
import { ProgressDashboardPage } from '@/features/dashboard/pages/ProgressDashboardPage';
import { PhotosPage } from '@/features/dashboard/pages/PhotosPage';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { ProfilePage } from '@/features/users/pages/ProfilePage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<DashboardHomePage />} />
        <Route path="progress" element={<ProgressDashboardPage />} />
        <Route path="photos" element={<PhotosPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
