import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function ProgressPage() {
  const { trainee, progress, isInitialized, loadProgress } = useTraining();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load progress if we're authenticated but don't have trainee yet
  useEffect(() => {
    if (isAuthenticated && user && !trainee && isInitialized) {
      loadProgress(user.employeeId);
    }
  }, [isAuthenticated, user, trainee, isInitialized, loadProgress]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!trainee || !progress) {
    return <LoadingSpinner />;
  }

  const totalModules = 7; // From cart config
  const completedCount = progress.completedModules.length;
  const completionPercentage = (completedCount / totalModules) * 100;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Button variant="outline" onClick={() => navigate('/home')} style={{ marginBottom: '2rem' }}>
        ← Back to Home
      </Button>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>My Progress</h1>

      <Card style={{ marginBottom: '2rem' }}>
        <h2>Overall Progress</h2>
        <div style={{ marginTop: '1.5rem' }}>
          <div className="progress-bar" style={{ height: '16px' }}>
            <div className="progress-fill" style={{ width: `${completionPercentage}%` }} />
          </div>
          <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>
            {completedCount} of {totalModules} modules completed ({completionPercentage.toFixed(0)}%)
          </p>
        </div>
      </Card>

      <Card style={{ marginBottom: '2rem' }}>
        <h2>Training Details</h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Trainee ID</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{progress.traineeId}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Name</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{progress.traineeName}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Cart Type</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
              {progress.cartType === 'electric-standard' ? 'Electric Standard' : progress.cartType}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Started</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
              {new Date(progress.startedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2>Module Progress</h2>
        <div style={{ marginTop: '1.5rem' }}>
          {Object.entries(progress.moduleProgress).map(([moduleId, moduleData]) => (
            <div
              key={moduleId}
              style={{
                padding: '1.5rem',
                marginBottom: '1rem',
                backgroundColor: moduleData.status === 'completed' ? '#d1fae5' : '#fef3c7',
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                    {moduleId.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Status: {moduleData.status === 'completed' ? 'Completed' : 'In Progress'}
                  </p>
                  {moduleData.completedAt && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Completed: {new Date(moduleData.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {moduleData.status === 'completed' ? (
                    <>
                      <p style={{ fontSize: '2rem', color: 'var(--secondary-color)' }}>✓</p>
                      {moduleData.knowledgeCheckScore && (
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                          Score: {moduleData.knowledgeCheckScore}
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize: '2rem', color: 'var(--warning-color)' }}>⏳</p>
                  )}
                </div>
              </div>
              {moduleData.completedSteps && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Steps completed: {moduleData.completedSteps.length}
                </p>
              )}
              {moduleData.supervisorSignoff && (
                <p style={{ marginTop: '0.5rem', color: 'var(--secondary-color)', fontWeight: 'bold' }}>
                  ✓ Supervisor approved
                  {moduleData.supervisorName && ` by ${moduleData.supervisorName}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default ProgressPage;
