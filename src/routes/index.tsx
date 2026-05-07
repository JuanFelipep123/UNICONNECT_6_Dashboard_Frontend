import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { DashboardLayout } from '@shared/components/layout/DashboardLayout';
import { useAuthStore } from '@shared/store/authStore';
import { LoginPage } from '@features/auth/presentation/pages/LoginPage';
import { AuthCallbackPage } from '@features/auth/presentation/pages/AuthCallbackPage';
import { GroupsListPage } from '@features/groups/presentation/pages/GroupsListPage';
import { GroupDetailPage } from '@features/groups/presentation/pages/GroupDetailPage';
import { CreateGroupPage } from '@features/groups/presentation/pages/CreateGroupPage';
import { WallInboxPage, WallHistoryPage } from '@features/chat';

import { ProfilePage } from '@features/profile/presentation/pages/ProfilePage';

function ProtectedLayout() {
  const { isLoading: auth0Loading, isAuthenticated } = useAuth0();
  const isHydrating = useAuthStore((state) => state.isHydrating);

  if (auth0Loading || isHydrating) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink-700">Validando sesion...</div>;
  }

  if (!isAuthenticated) {
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
        <Route path="/chat" element={<WallInboxPage />} />
        <Route path="/chat/groups/:groupId/wall" element={<WallHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}
