import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTraining } from '../context/TrainingContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, isAuthenticated, loading: authLoading, user } = useAuth();
  const { loadProgress, currentPosition } = useTraining();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || '/home';
      
      // Check for saved position
      if (currentPosition?.moduleId && currentPosition?.stepId) {
        navigate(`/module/${currentPosition.moduleId}/step/${currentPosition.stepId}`);
      } else {
        navigate(from);
      }
    }
  }, [isAuthenticated, user, currentPosition, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!employeeId || !password) {
      setFormError('Please enter both Employee ID and Password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(employeeId, password);
      
      // Load progress after successful login
      if (result.success) {
        await loadProgress(employeeId);
      }
    } catch (err) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!employeeId) {
      setFormError('Please enter your Employee ID');
      return;
    }
    if (!fullName) {
      setFormError('Please enter your full name');
      return;
    }
    if (!password) {
      setFormError('Please create a password');
      return;
    }
    if (password.length < 4) {
      setFormError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(employeeId, password, fullName, email);
      // Registration auto-logs in, so we'll be redirected
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <img 
          src="/images/GG_circle_grill_full_color-01.png" 
          alt="Golfin Garage" 
          className="login-logo"
        />
        <h1>Golfin Garage</h1>
        <p>On-the-Job Training System</p>
      </div>

      <Card className="login-card">
        {!isRegistering ? (
          <form onSubmit={handleLogin}>
            <h2>Sign In</h2>
            
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                type="text"
                className="form-input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your employee ID"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="large" 
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="login-divider">
              <span>New employee?</span>
            </div>

            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setIsRegistering(true);
                setFormError('');
              }}
              style={{ width: '100%' }}
            >
              Create Account
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2>Create Account</h2>
            <p className="form-subtitle">Set up your training account</p>
            
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input
                type="text"
                className="form-input"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Your employee ID"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Create Password *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="large"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account & Start Training'}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setIsRegistering(false);
                setFormError('');
              }}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Back to Sign In
            </Button>
          </form>
        )}
      </Card>

      <p className="login-footer">
        Need help? Contact your supervisor or IT support.
      </p>
    </div>
  );
}

export default LoginPage;
