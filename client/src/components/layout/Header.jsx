import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTraining } from '../../context/TrainingContext';

function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { trainee } = useTraining();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.name || trainee?.name || 'User';

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/home" className="logo">
          <img src="/images/GG_circle_grill_full_color-01.png" alt="Golfin Garage" className="logo-image" />
          <span>Golfin Garage Training</span>
        </Link>
        {isAuthenticated && (
          <nav className="header-nav">
            <span className="header-welcome">Welcome, {displayName}</span>
            <Link to="/progress" className="header-btn header-btn-progress">
              📊 My Progress
            </Link>
            {isAdmin && (
              <Link to="/admin" className="header-btn header-btn-admin">
                ⚙️ Admin
              </Link>
            )}
            <button onClick={handleLogout} className="header-btn header-btn-logout">
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
