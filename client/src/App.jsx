import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TrainingProvider } from './context/TrainingContext';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ModuleOverviewPage from './pages/ModuleOverviewPage';
import StepPage from './pages/StepPage';
import ProgressPage from './pages/ProgressPage';
import AdminPage from './pages/AdminPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoadingSpinner from './components/common/LoadingSpinner';

// Protected Route component
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/module/:moduleId" element={
            <ProtectedRoute>
              <ModuleOverviewPage />
            </ProtectedRoute>
          } />
          <Route path="/module/:moduleId/step/:stepId" element={
            <ProtectedRoute>
              <StepPage />
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TrainingProvider>
          <AppRoutes />
        </TrainingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
