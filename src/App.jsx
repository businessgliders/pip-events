import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Calendar from './pages/Calendar.jsx';
import RequestForm from './pages/RequestForm';
import Confirmation from './pages/Confirmation';
import Dashboard from './pages/Dashboard';
import PublicForm from './pages/PublicForm';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings } = useAuth();

  // Fully public route — bypass any auth/public-settings loading gate.
  // Must short-circuit BEFORE the loading spinner so visitors are never blocked.
  if (typeof window !== 'undefined' && window.location.pathname.toLowerCase() === '/form') {
    return <PublicForm />;
  }

  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/form" element={<PublicForm />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Calendar" element={<Calendar />} />
      <Route path="/RequestForm" element={<RequestForm />} />
      <Route path="/Confirmation" element={<Confirmation />} />

      {/* Protected routes (staff only) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/RequestBoard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App