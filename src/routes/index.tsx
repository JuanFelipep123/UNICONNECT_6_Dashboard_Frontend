import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@shared/components/layout/DashboardLayout';
import { useAuthStore } from '@shared/store/authStore';
import { LoginPage } from '@features/auth/presentation/pages/LoginPage';
import { AuthCallbackPage } from '@features/auth/presentation/pages/AuthCallbackPage';
import { GroupsListPage } from '@features/groups/presentation/pages/GroupsListPage';
import { GroupDetailPage } from '@features/groups/presentation/pages/GroupDetailPage';
import { CreateGroupPage } from '@features/groups/presentation/pages/CreateGroupPage';

function ProtectedLayout() {
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);

  if (isHydrating) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-700">Validando sesion...</div>;
  }

  if (!token && !userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/groups" replace />} />
        <Route path="/groups" element={<GroupsListPage />} />
        <Route path="/groups/create" element={<CreateGroupPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}
