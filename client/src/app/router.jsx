import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@store";
import { getDashboardPath } from "@utils";
import ProtectedRoute from "@lib/ProtectedRoute";
import MainLayout from "@layouts/MainLayout";
import AuthLayout from "@layouts/AuthLayout";
import DashboardLayout from "@layouts/DashboardLayout";
import HomePage from "@features/landing/pages/HomePage";

const LoginPage = lazy(() => import("@features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@features/auth/pages/RegisterPage"));
const WorkerDashboardPage = lazy(() => import("@features/dashboard/worker/pages/WorkerDashboardPage"));
const ClientDashboardPage = lazy(() => import("@features/dashboard/client/pages/ClientDashboardPage"));
const AdminDashboardPage = lazy(() => import("@features/dashboard/admin/pages/AdminDashboardPage"));
const JobsPage = lazy(() => import("@features/jobs/pages/JobsPage"));
const WorkersPage = lazy(() => import("@features/workers/pages/WorkersPage"));
const ProfilePage = lazy(() => import("@features/profiles/pages/ProfilePage"));
const MessagesPage = lazy(() => import("@features/messaging/pages/MessagesPage"));
const NotFoundPage = lazy(() => import("@features/misc/pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    </div>
  );
}

function AuthRedirect({ children }) {
  const { isAuthenticated, user, initialized, loading } = useAuthStore();

  if (!initialized || loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return children;
}

function DashboardHomeRedirect() {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={getDashboardPath(user?.role)} replace />;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="worker/:id" element={<ProfilePage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route
            path="login"
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />
          <Route
            path="register"
            element={
              <AuthRedirect>
                <RegisterPage />
              </AuthRedirect>
            }
          />
        </Route>

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHomeRedirect />} />
          <Route
            path="worker"
            element={
              <ProtectedRoute allowedRoles={["worker"]}>
                <WorkerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="client"
            element={
              <ProtectedRoute allowedRoles={["client", "admin"]}>
                <ClientDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="messages" element={<MessagesPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
