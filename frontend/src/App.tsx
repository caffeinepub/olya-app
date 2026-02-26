import React, { useEffect, useRef } from 'react';
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import {
  useGetCallerUserProfile,
  useSaveCallerUserProfile,
  useEnsureUserRole,
} from './hooks/useQueries';
import { useAppLanguagePreference } from './hooks/useAppLanguagePreference';
import ProfileSetupModal from './components/ProfileSetupModal';
import { AppLanguageSelectorFull } from './components/AppLanguageSelector';
import Dashboard from './pages/Dashboard';
import UserManual from './pages/UserManual';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Root layout component
function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const userManualRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/user-manual',
  component: UserManual,
});

const routeTree = rootRoute.addChildren([indexRoute, userManualRoute]);
const router = createRouter({ routeTree });

// Main app logic component
function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { language, setAppLanguage } = useAppLanguagePreference();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const saveProfile = useSaveCallerUserProfile();
  const ensureUserRole = useEnsureUserRole();

  // Track whether we've already attempted role assignment for this login session
  const roleAssignedRef = useRef(false);

  // Assign #user role as soon as the actor is ready and the user is authenticated
  useEffect(() => {
    if (isAuthenticated && !actorFetching && !roleAssignedRef.current) {
      roleAssignedRef.current = true;
      ensureUserRole.mutate();
    }
    if (!isAuthenticated) {
      roleAssignedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, actorFetching]);

  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  const showLanguageSelection =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile !== null &&
    !language;

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/assets/generated/olya-logo.dim_256x256.png"
            alt="Olya"
            className="w-16 h-16 rounded-xl animate-pulse"
          />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <RouterProvider router={router} />;
  }

  if (showProfileSetup) {
    return (
      <>
        <RouterProvider router={router} />
        <ProfileSetupModal
          onSave={async (name: string) => {
            await saveProfile.mutateAsync({ name });
          }}
          isSaving={saveProfile.isPending}
        />
      </>
    );
  }

  if (showLanguageSelection) {
    return (
      <AppLanguageSelectorFull
        onContinue={() => {
          if (!language) setAppLanguage('en');
        }}
      />
    );
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
