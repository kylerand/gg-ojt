import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModule } from '../services/api';
import { useTraining } from '../context/TrainingContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function ModuleOverviewPage() {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const { trainee, progress } = useTraining();
  const navigate = useNavigate();

  useEffect(() => {
    if (!trainee) {
      navigate('/');
      return;
    }
    loadModule();
  }, [moduleId, trainee]);

  const loadModule = async () => {
    try {
      const response = await getModule(moduleId);
      setModule(response.data);
    } catch (error) {
      console.error('Failed to load module:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!module) return <div>Module not found</div>;

  const moduleProgress = progress?.moduleProgress?.[moduleId];
  const isCompleted = moduleProgress?.status === 'completed';
  const completedSteps = moduleProgress?.completedSteps?.length || 0;

  const handleStartModule = () => {
    const firstStepId = module.steps[0].id;
    navigate(`/module/${moduleId}/step/${firstStepId}`);
  };

  const handleContinue = () => {
    // Find the first incomplete step or last step
    const lastCompletedIndex = module.steps.findIndex(
      step => !moduleProgress?.completedSteps?.includes(step.id)
    );
    const stepId = lastCompletedIndex >= 0 
      ? module.steps[lastCompletedIndex].id 
      : module.steps[0].id;
    navigate(`/module/${moduleId}/step/${stepId}`);
  };

  const renderActionButtons = () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {!moduleProgress || completedSteps === 0 ? (
        <Button variant="primary" size="large" onClick={handleStartModule}>
          Start Module →
        </Button>
      ) : isCompleted ? (
        <Button variant="secondary" size="large" onClick={handleStartModule}>
          Review Module
        </Button>
      ) : (
        <Button variant="primary" size="large" onClick={handleContinue}>
          Continue Training →
        </Button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <Button 
          variant="outline" 
          onClick={() => navigate('/home')}
        >
          ← Back to Modules
        </Button>
        {renderActionButtons()}
      </div>

      <Card>
        <img 
          src={module.thumbnailUrl} 
          alt={module.title}
          style={{ 
            width: '100%', 
            height: '300px', 
            objectFit: 'cover',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}
        />

        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          {module.title}
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {module.description}
        </p>

        {/* Module Info */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '0.5rem'
        }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Estimated Time</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>⏱️ {module.estimatedTime}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Steps</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>📋 {module.steps.length} steps</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Knowledge Checks</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>❓ {module.knowledgeChecks.length} questions</p>
          </div>
          {module.requiresSupervisorSignoff && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Supervisor</p>
              <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>👨‍🏫 Signoff required</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {moduleProgress && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Your Progress</h3>
            <div className="progress-bar" style={{ height: '10px' }}>
              <div 
                className="progress-fill" 
                style={{ width: `${(completedSteps / module.steps.length) * 100}%` }}
              />
            </div>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {completedSteps} of {module.steps.length} steps completed
            </p>
            {isCompleted && (
              <p style={{ color: 'var(--secondary-color)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                ✓ Module completed with score: {moduleProgress.knowledgeCheckScore}
              </p>
            )}
          </div>
        )}

        {/* Steps List */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Module Steps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {module.steps.map((step, index) => {
              const isStepCompleted = moduleProgress?.completedSteps?.includes(step.id);
              return (
                <div 
                  key={step.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: isStepCompleted ? '#d1fae5' : 'var(--bg-color)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <span style={{ 
                    fontSize: '1.5rem',
                    minWidth: '30px'
                  }}>
                    {isStepCompleted ? '✓' : index + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 'bold' }}>{step.title}</p>
                    {step.safetyWarnings?.length > 0 && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--danger-color)' }}>
                        ⚠️ Contains safety warnings
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        {renderActionButtons()}
      </Card>
    </div>
  );
}

export default ModuleOverviewPage;
