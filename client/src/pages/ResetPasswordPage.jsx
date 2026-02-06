import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

// Get API URL (same logic as AuthContext)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('golfingarage.com'))) {
    return 'https://gg-ojt-production.up.railway.app';
  }
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  
  // Get tokens from URL - Supabase sends them as hash fragments or query params
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  useEffect(() => {
    // Supabase can send tokens in URL hash (fragment) or as query params
    // Check hash first (format: #access_token=xxx&refresh_token=xxx&type=recovery)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    let token = hashParams.get('access_token') || searchParams.get('access_token');
    let refresh = hashParams.get('refresh_token') || searchParams.get('refresh_token');
    const type = hashParams.get('type') || searchParams.get('type');
    
    if (token && type === 'recovery') {
      setAccessToken(token);
      setRefreshToken(refresh || '');
      // Clear the hash from URL for cleaner look
      window.history.replaceState(null, '', window.location.pathname);
    } else {
      setTokenValid(false);
      setError('Invalid or expired password reset link. Please request a new one.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="login-page">
        <div className="login-container">
          <Card className="login-card">
            <div className="login-header">
              <h1>Password Reset</h1>
            </div>
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
            <Button variant="primary" onClick={() => navigate('/')}>
              Back to Login
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <Card className="login-card">
            <div className="login-header">
              <h1>Password Reset Successful</h1>
            </div>
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Your password has been updated successfully. Redirecting to login...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="login-card">
          <div className="login-header">
            <h1>Reset Password</h1>
            <p>Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !password || !confirmPassword}
              style={{ width: '100%' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="login-footer" style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              type="button" 
              className="link-button"
              onClick={() => navigate('/')}
            >
              Back to Login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
