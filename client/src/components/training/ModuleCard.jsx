import { useNavigate } from 'react-router-dom';

function ModuleCard({ module, progress }) {
  const navigate = useNavigate();
  
  const moduleProgress = progress?.moduleProgress?.[module.id];
  const isCompleted = moduleProgress?.status === 'completed';
  const isInProgress = moduleProgress?.status === 'in_progress';

  const handleClick = () => {
    navigate(`/module/${module.id}`);
  };

  return (
    <div className="module-card" onClick={handleClick}>
      <img 
        src={module.thumbnailUrl} 
        alt={module.title}
        className="module-thumbnail"
      />
      <div className="module-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <h3 className="module-title">{module.title}</h3>
          {isCompleted && <span style={{ color: 'var(--secondary-color)', fontSize: '1.5rem' }}>✓</span>}
          {isInProgress && <span style={{ color: 'var(--warning-color)', fontSize: '1.5rem' }}>⏳</span>}
        </div>
        <p className="card-description">{module.description}</p>
        <div className="module-meta">
          <span>⏱️ {module.estimatedTime}</span>
          <span>📋 {module.stepCount} steps</span>
          {module.requiresSupervisorSignoff && <span>👨‍🏫 Signoff required</span>}
        </div>
        {moduleProgress && (
          <div style={{ marginTop: '1rem' }}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${(moduleProgress.completedSteps?.length || 0) / module.stepCount * 100}%` 
                }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              {moduleProgress.completedSteps?.length || 0} of {module.stepCount} steps completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModuleCard;
