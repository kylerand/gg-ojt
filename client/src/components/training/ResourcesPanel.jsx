import { useState } from 'react';

function ResourcesPanel({ step }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine all resources from the step
  const hasTools = step.tools?.length > 0;
  const hasMaterials = step.materials?.length > 0;
  const hasResources = hasTools || hasMaterials;

  if (!hasResources) return null;

  return (
    <div className={`resources-panel ${isExpanded ? 'resources-panel-expanded' : ''}`}>
      <div 
        className="resources-panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="resources-panel-title">
          <span className="resources-icon">📚</span>
          <h4>Resources & Materials</h4>
          <span className="resources-badge">
            {(step.tools?.length || 0) + (step.materials?.length || 0)} items
          </span>
        </div>
        <button className="resources-toggle">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="resources-panel-content">
          {hasTools && (
            <div className="resources-section">
              <h5 className="resources-section-title">
                <span>🔧</span> Tools Required
              </h5>
              <ul className="resources-list">
                {step.tools.map((tool, index) => (
                  <li key={index} className="resource-item">
                    <span className="resource-checkbox">☐</span>
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasMaterials && (
            <div className="resources-section">
              <h5 className="resources-section-title">
                <span>📦</span> Materials
              </h5>
              <ul className="resources-list">
                {step.materials.map((material, index) => (
                  <li key={index} className="resource-item">
                    <span className="resource-checkbox">☐</span>
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="resources-tip">
            💡 Gather all items before starting this step
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourcesPanel;
