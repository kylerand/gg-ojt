import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearningPath } from '../services/api';
import { useTraining } from '../context/TrainingContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function LearningPathPage() {
  const { learningPathId } = useParams();
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const { trainee, progress, isInitialized, loadProgress } = useTraining();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && !trainee && isInitialized) {
      loadProgress(user.employeeId);
    }
  }, [isAuthenticated, user, trainee, isInitialized, loadProgress]);

  const loadLearningPath = useCallback(async () => {
    try {
      const response = await getLearningPath(learningPathId);
      setLearningPath(response.data);
    } catch (error) {
      console.error('Failed to load learning path:', error);
    } finally {
      setLoading(false);
    }
  }, [learningPathId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (trainee || user) {
      loadLearningPath();
    }
  }, [learningPathId, trainee, user, isAuthenticated, navigate, loadLearningPath]);

  if (loading) return <LoadingSpinner />;
  if (!learningPath) return <div>Learning path not found</div>;

  const modules = learningPath.modules || [];
  const moduleIds = learningPath.moduleIds || [];

  const completedModuleIds = moduleIds.filter(
    (id) => progress?.moduleProgress?.[id]?.status === 'completed'
  );
  const allModulesComplete =
    moduleIds.length > 0 && completedModuleIds.length === moduleIds.length;
  const lpProgress = progress?.learningPathProgress?.[learningPath.id];
  const isCompleted = lpProgress?.status === 'completed';

  const completionPct =
    moduleIds.length > 0
      ? Math.round((completedModuleIds.length / moduleIds.length) * 100)
      : 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <Button variant="outline" onClick={() => navigate('/home')}>
          ← Back to Home
        </Button>
      </div>

      <Card>
        {learningPath.thumbnailUrl && (
          <img
            src={learningPath.thumbnailUrl}
            alt={learningPath.title}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
            }}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <span
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Learning Path
          </span>
          {isCompleted && (
            <span style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>
              ✓ Completed
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{learningPath.title}</h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {learningPath.description}
        </p>

        {/* Learning Path Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-color)',
            borderRadius: '0.5rem',
          }}
        >
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estimated Time</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>⏱️ {learningPath.estimatedTime}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Modules</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>📚 {moduleIds.length} modules</p>
          </div>
          {learningPath.knowledgeChecks?.length > 0 && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Final Test</p>
              <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                ❓ {learningPath.knowledgeChecks.length} questions
              </p>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        {moduleIds.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Your Progress</h3>
            <div className="progress-bar" style={{ height: '10px' }}>
              <div className="progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {completedModuleIds.length} of {moduleIds.length} modules completed
            </p>
          </div>
        )}

        {/* Modules List */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Modules in this Learning Path</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {modules.map((module, index) => {
              const isModuleCompleted =
                progress?.moduleProgress?.[module.id]?.status === 'completed';
              const isModuleInProgress =
                progress?.moduleProgress?.[module.id]?.status === 'in_progress';
              return (
                <div
                  key={module.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: isModuleCompleted
                      ? '#d1fae5'
                      : 'var(--bg-color)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    transition: 'box-shadow 0.2s',
                  }}
                  onClick={() => navigate(`/module/${module.id}`)}
                >
                  <span style={{ fontSize: '1.5rem', minWidth: '30px' }}>
                    {isModuleCompleted ? '✓' : isModuleInProgress ? '⏳' : index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold' }}>{module.title}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      ⏱️ {module.estimatedTime} &nbsp;•&nbsp; 📋 {module.stepCount} steps
                    </p>
                  </div>
                  <Button
                    variant={isModuleCompleted ? 'outline' : 'primary'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/module/${module.id}`);
                    }}
                  >
                    {isModuleCompleted ? 'Review' : isModuleInProgress ? 'Continue →' : 'Start →'}
                  </Button>
                </div>
              );
            })}
            {/* Placeholder for modules not yet loaded */}
            {moduleIds
              .filter((id) => !modules.find((m) => m.id === id))
              .map((id) => (
                <div
                  key={id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    border: '1px solid var(--border-color)',
                    opacity: 0.6,
                  }}
                >
                  <span style={{ fontSize: '1.5rem', minWidth: '30px' }}>📋</span>
                  <p style={{ fontWeight: 'bold' }}>{id}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Final Test Notice */}
        {learningPath.knowledgeChecks?.length > 0 && (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: allModulesComplete ? '#d1fae5' : 'var(--bg-color)',
              borderRadius: '0.5rem',
              border: `1px solid ${allModulesComplete ? 'var(--secondary-color)' : 'var(--border-color)'}`,
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ marginBottom: '0.5rem' }}>
              🎓 Final Learning Path Test
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {allModulesComplete
                ? 'You have completed all required modules! Take the final test to complete this learning path.'
                : `Complete all ${moduleIds.length} modules above to unlock the final test.`}
            </p>
            {allModulesComplete && !isCompleted && (
              <Button
                variant="primary"
                onClick={() => navigate(`/learning-path/${learningPath.id}/test`)}
              >
                Take Final Test →
              </Button>
            )}
            {isCompleted && (
              <p style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>
                ✓ Final test passed — Learning path complete!
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default LearningPathPage;
