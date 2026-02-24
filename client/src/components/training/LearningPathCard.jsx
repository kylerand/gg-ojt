import { useNavigate } from 'react-router-dom';

function LearningPathCard({ learningPath, progress }) {
  const navigate = useNavigate();

  const moduleIds = learningPath.moduleIds || [];
  const completedCount = moduleIds.filter(
    (id) => progress?.moduleProgress?.[id]?.status === 'completed'
  ).length;
  const allModulesComplete = moduleIds.length > 0 && completedCount === moduleIds.length;

  // Check if the learning path final test has been passed
  const lpProgress = progress?.learningPathProgress?.[learningPath.id];
  const isCompleted = lpProgress?.status === 'completed';
  const isInProgress = !isCompleted && completedCount > 0;

  const handleClick = () => {
    navigate(`/learning-path/${learningPath.id}`);
  };

  return (
    <div className="learning-path-card" onClick={handleClick}>
      <div className="learning-path-card-header">
        {learningPath.thumbnailUrl && (
          <img
            src={learningPath.thumbnailUrl}
            alt={learningPath.title}
            className="module-thumbnail"
          />
        )}
        <div className="learning-path-badge">Learning Path</div>
      </div>
      <div className="module-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <h3 className="module-title">{learningPath.title}</h3>
          {isCompleted && <span style={{ color: 'var(--secondary-color)', fontSize: '1.5rem' }}>✓</span>}
          {isInProgress && !isCompleted && (
            <span style={{ color: 'var(--warning-color)', fontSize: '1.5rem' }}>⏳</span>
          )}
        </div>
        <p className="card-description">{learningPath.description}</p>
        <div className="module-meta">
          <span>⏱️ {learningPath.estimatedTime}</span>
          <span>📚 {moduleIds.length} module{moduleIds.length !== 1 ? 's' : ''}</span>
          {learningPath.knowledgeCheckCount > 0 && (
            <span>❓ Final test</span>
          )}
        </div>
        {moduleIds.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(completedCount / moduleIds.length) * 100}%` }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              {completedCount} of {moduleIds.length} modules completed
              {allModulesComplete && !isCompleted && ' • Final test required'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningPathCard;
