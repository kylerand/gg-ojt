import { useState } from 'react';
import ModuleCard from './ModuleCard';

function LearningPathCard({ path, progress }) {
  const [expanded, setExpanded] = useState(false);

  const completedCount = path.modules.filter(m => {
    const mp = progress?.moduleProgress?.[m.id];
    return mp?.status === 'completed';
  }).length;

  const totalCount = path.modules.length;
  const completionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isCompleted = completedCount === totalCount && totalCount > 0;

  return (
    <div className={`learning-path-card${isCompleted ? ' learning-path-card--completed' : ''}`}>
      {/* Path header */}
      <div
        className="learning-path-header"
        onClick={() => setExpanded(prev => !prev)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="learning-path-header-left">
          <span className="learning-path-icon">🎓</span>
          <div>
            <h2 className="learning-path-title">
              {path.title}
              {isCompleted && <span className="learning-path-badge">✓ Complete</span>}
            </h2>
            <p className="learning-path-description">{path.description}</p>
          </div>
        </div>
        <div className="learning-path-header-right">
          <div className="learning-path-progress-wrap">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="learning-path-progress-label">
              {completedCount}/{totalCount} modules
            </p>
          </div>
          <span className="learning-path-toggle">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded module grid */}
      {expanded && (
        <div className="learning-path-modules">
          <div className="module-grid">
            {path.modules.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                progress={progress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningPathCard;
