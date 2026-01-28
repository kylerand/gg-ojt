import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ModuleSidebar({ 
  module, 
  currentStepId, 
  moduleProgress, 
  onStepSelect,
  isCollapsed,
  onToggleCollapse 
}) {
  const navigate = useNavigate();
  const completedSteps = moduleProgress?.completedSteps || [];
  const totalSteps = module.steps.length;
  const progressPercentage = Math.round((completedSteps.length / totalSteps) * 100);

  const handleStepClick = (step) => {
    navigate(`/module/${module.id}/step/${step.id}`);
    if (onStepSelect) onStepSelect(step);
  };

  const getStepStatus = (step, index) => {
    if (completedSteps.includes(step.id)) return 'completed';
    if (step.id === currentStepId) return 'current';
    // Check if previous steps are completed
    const previousCompleted = index === 0 || 
      module.steps.slice(0, index).every(s => completedSteps.includes(s.id));
    return previousCompleted ? 'available' : 'locked';
  };

  const getStepProgress = (step) => {
    if (completedSteps.includes(step.id)) return 100;
    if (step.id === currentStepId) return 50; // In progress
    return 0;
  };

  if (isCollapsed) {
    return (
      <div className="module-sidebar-mini">
        <button 
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title="Expand sidebar"
        >
          <span>☰</span>
        </button>
        <div className="sidebar-mini-progress">
          <div 
            className="sidebar-mini-progress-fill"
            style={{ height: `${progressPercentage}%` }}
          />
        </div>
        <span className="sidebar-mini-label">{progressPercentage}%</span>
      </div>
    );
  }

  return (
    <aside className="module-sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">{module.title}</h3>
        <button 
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title="Collapse sidebar"
        >
          ✕
        </button>
      </div>

      {/* Overall Progress */}
      <div className="sidebar-progress-section">
        <div className="sidebar-progress-header">
          <span>Overall Progress</span>
          <span className="sidebar-progress-percentage">{progressPercentage}%</span>
        </div>
        <div className="sidebar-progress-bar">
          <div 
            className="sidebar-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="sidebar-progress-stats">
          <span>{completedSteps.length} of {totalSteps} steps completed</span>
        </div>
      </div>

      {/* Estimated Time Remaining */}
      <div className="sidebar-time-estimate">
        <span className="sidebar-time-icon">⏱️</span>
        <span>Est. {module.estimatedTime}</span>
      </div>

      {/* Steps List */}
      <div className="sidebar-steps-section">
        <h4 className="sidebar-section-title">Module Steps</h4>
        <ul className="sidebar-steps-list">
          {module.steps.map((step, index) => {
            const status = getStepStatus(step, index);
            const stepProgress = getStepProgress(step);
            const isCurrent = step.id === currentStepId;

            return (
              <li 
                key={step.id}
                className={`sidebar-step-item sidebar-step-${status} ${isCurrent ? 'sidebar-step-active' : ''}`}
                onClick={() => status !== 'locked' && handleStepClick(step)}
              >
                <div className="sidebar-step-indicator">
                  {status === 'completed' ? (
                    <span className="step-check">✓</span>
                  ) : status === 'locked' ? (
                    <span className="step-lock">🔒</span>
                  ) : (
                    <span className="step-number">{index + 1}</span>
                  )}
                </div>
                <div className="sidebar-step-content">
                  <span className="sidebar-step-title">{step.title}</span>
                  <div className="sidebar-step-progress-bar">
                    <div 
                      className="sidebar-step-progress-fill"
                      style={{ width: `${stepProgress}%` }}
                    />
                  </div>
                </div>
                {step.safetyWarnings?.length > 0 && (
                  <span className="sidebar-step-warning" title="Contains safety warnings">⚠️</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Knowledge Check Preview */}
      {module.knowledgeChecks?.length > 0 && (
        <div className="sidebar-quiz-section">
          <div className="sidebar-quiz-item">
            <span className="sidebar-quiz-icon">📝</span>
            <div className="sidebar-quiz-content">
              <span className="sidebar-quiz-title">Knowledge Check</span>
              <span className="sidebar-quiz-info">{module.knowledgeChecks.length} questions</span>
            </div>
            {moduleProgress?.status === 'completed' && (
              <span className="sidebar-quiz-score">{moduleProgress.knowledgeCheckScore}</span>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="sidebar-shortcuts">
        <h4 className="sidebar-section-title">Keyboard Shortcuts</h4>
        <div className="sidebar-shortcut-list">
          <div className="sidebar-shortcut-item">
            <kbd>←</kbd> <span>Previous step</span>
          </div>
          <div className="sidebar-shortcut-item">
            <kbd>→</kbd> <span>Next step</span>
          </div>
          <div className="sidebar-shortcut-item">
            <kbd>Space</kbd> <span>Play/Pause video</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default ModuleSidebar;
