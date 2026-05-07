import { useRef } from 'react';
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
import { OnboardingWelcomePage } from '@features/onboarding/presentation/pages/OnboardingWelcomePage';
import { OnboardingStepOnePage } from '@features/onboarding/presentation/pages/OnboardingStepOnePage';
import { OnboardingSubjectsPage } from '@features/onboarding/presentation/pages/OnboardingSubjectsPage';

/** Guard: requires Auth0 + hydration, redirects to /onboarding if needsOnboarding */
function ProtectedLayout() {
  const { isLoading: auth0Loading, isAuthenticated } = useAuth0();
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);

  // Always wait for BOTH Auth0 AND the backend sync to complete
  if (auth0Loading || isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#002147]">
        <div className="flex flex-col items-center gap-3 text-white">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px' }}>progress_activity</span>
          <p className="text-sm font-medium">Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only redirect to onboarding AFTER hydration confirms it's needed
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

/** Guard: requires Auth0, allows onboarding flow regardless of profile completeness */
function OnboardingLayout() {
  const { isLoading: auth0Loading, isAuthenticated } = useAuth0();
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);

  // Once the user is confirmed to need onboarding, lock them in so
  // transient state changes (between steps) don't kick them to /groups.
  const lockedInRef = useRef(false);
  if (!isHydrating && needsOnboarding) {
    lockedInRef.current = true;
  }

  // Wait for full hydration — do NOT make routing decisions before backend sync
  if (auth0Loading || isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5F7]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '32px', color: '#062E57' }}>progress_activity</span>
          <p className="text-sm font-medium" style={{ color: '#4C5E76' }}>Preparando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // After hydration: redirect to /groups only if confirmed NOT needed
  // AND the user hasn't been locked into the flow yet
  if (!needsOnboarding && !lockedInRef.current) {
    return <Navigate to="/groups" replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Onboarding flow — no dashboard layout */}
      <Route element={<OnboardingLayout />}>
        <Route path="/onboarding" element={<OnboardingWelcomePage />} />
        <Route path="/onboarding/step-1" element={<OnboardingStepOnePage />} />
        <Route path="/onboarding/subjects" element={<OnboardingSubjectsPage />} />
      </Route>

      {/* Protected dashboard */}
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
