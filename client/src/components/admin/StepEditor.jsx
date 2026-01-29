import { useState } from 'react';
import Button from '../common/Button';
import VideoUploader from './VideoUploader';

function StepEditor({ step, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    id: step.id || `step-${Date.now()}`,
    title: step.title || '',
    content: step.content || '',
    videoUrl: step.videoUrl || '',
    safetyWarnings: step.safetyWarnings || [],
    tools: step.tools || [],
    materials: step.materials || [],
    requiresVideoCompletion: step.requiresVideoCompletion || false,
    requiresConfirmation: step.requiresConfirmation !== false,
  });

  const [newWarning, setNewWarning] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newMaterial, setNewMaterial] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Array item management
  const addArrayItem = (field, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }));
      setter('');
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Please enter a step title');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="step-editor">
      <div className="step-editor-header">
        <h4>Edit Step</h4>
        <div className="step-editor-actions">
          <Button variant="outline" size="small" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="small" onClick={handleSave}>Save Step</Button>
        </div>
      </div>

      <div className="step-editor-form">
        <div className="form-group">
          <label className="form-label">Step Title *</label>
          <input
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter step title"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea
            className="form-input"
            rows={4}
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            placeholder="Enter step instructions and content..."
          />
        </div>

        {/* Video Upload */}
        <div className="form-group">
          <label className="form-label">Training Video</label>
          <VideoUploader
            currentVideoUrl={formData.videoUrl}
            onUploadComplete={(url) => handleChange('videoUrl', url)}
            onRemove={() => handleChange('videoUrl', '')}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={formData.requiresVideoCompletion}
                onChange={(e) => handleChange('requiresVideoCompletion', e.target.checked)}
              />
              {' '}Require video completion
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={formData.requiresConfirmation}
                onChange={(e) => handleChange('requiresConfirmation', e.target.checked)}
              />
              {' '}Require step confirmation
            </label>
          </div>
        </div>

        {/* Safety Warnings */}
        <div className="form-group">
          <label className="form-label">⚠️ Safety Warnings</label>
          <div className="array-items">
            {formData.safetyWarnings.map((warning, index) => {
              // Handle both object format {severity, text} and plain string format
              const warningText = typeof warning === 'object' ? warning.text : warning;
              const severity = typeof warning === 'object' ? warning.severity : 'warning';
              return (
                <div key={index} className={`array-item warning ${severity}`}>
                  <span>{warningText}</span>
                  <button onClick={() => removeArrayItem('safetyWarnings', index)}>×</button>
                </div>
              );
            })}
          </div>
          <div className="array-input-row">
            <input
              type="text"
              className="form-input"
              value={newWarning}
              onChange={(e) => setNewWarning(e.target.value)}
              placeholder="Add a safety warning..."
              onKeyPress={(e) => e.key === 'Enter' && addArrayItem('safetyWarnings', newWarning, setNewWarning)}
            />
            <Button 
              variant="outline" 
              size="small"
              onClick={() => addArrayItem('safetyWarnings', newWarning, setNewWarning)}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Tools */}
        <div className="form-group">
          <label className="form-label">🔧 Required Tools</label>
          <div className="array-items">
            {formData.tools.map((tool, index) => (
              <div key={index} className="array-item">
                <span>{tool}</span>
                <button onClick={() => removeArrayItem('tools', index)}>×</button>
              </div>
            ))}
          </div>
          <div className="array-input-row">
            <input
              type="text"
              className="form-input"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              placeholder="Add a tool..."
              onKeyPress={(e) => e.key === 'Enter' && addArrayItem('tools', newTool, setNewTool)}
            />
            <Button 
              variant="outline" 
              size="small"
              onClick={() => addArrayItem('tools', newTool, setNewTool)}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Materials */}
        <div className="form-group">
          <label className="form-label">📦 Required Materials</label>
          <div className="array-items">
            {formData.materials.map((material, index) => (
              <div key={index} className="array-item">
                <span>{material}</span>
                <button onClick={() => removeArrayItem('materials', index)}>×</button>
              </div>
            ))}
          </div>
          <div className="array-input-row">
            <input
              type="text"
              className="form-input"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              placeholder="Add a material..."
              onKeyPress={(e) => e.key === 'Enter' && addArrayItem('materials', newMaterial, setNewMaterial)}
            />
            <Button 
              variant="outline" 
              size="small"
              onClick={() => addArrayItem('materials', newMaterial, setNewMaterial)}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepEditor;
