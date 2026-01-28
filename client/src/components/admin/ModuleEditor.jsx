import { useState, useEffect, useCallback, useRef } from 'react';
import Button from '../common/Button';
import StepEditor from './StepEditor';
import KnowledgeCheckEditor from './KnowledgeCheckEditor';

const DRAFT_STORAGE_KEY = 'admin-module-editor-draft';
const AUTO_SAVE_DELAY = 2000; // Auto-save draft after 2 seconds of inactivity

function ModuleEditor({ module, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    estimatedTime: '30 minutes',
    thumbnailUrl: '',
    steps: [],
    knowledgeChecks: [],
  });
  const [activeTab, setActiveTab] = useState('details');
  const [editingStepIndex, setEditingStepIndex] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const initialLoadRef = useRef(true);

  // Check for and restore draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only restore if it's for the same module (or both are new modules)
        const draftModuleId = draft.formData?.id || '';
        const currentModuleId = module?.id || '';
        
        if (draftModuleId === currentModuleId || (!module && !draftModuleId)) {
          // Ask user if they want to restore the draft
          const draftAge = Date.now() - (draft.timestamp || 0);
          const draftAgeMinutes = Math.round(draftAge / 60000);
          
          if (draftAgeMinutes < 60 * 24) { // Less than 24 hours old
            const restore = confirm(
              `You have unsaved changes from ${draftAgeMinutes < 60 
                ? `${draftAgeMinutes} minutes` 
                : `${Math.round(draftAgeMinutes / 60)} hours`} ago. Would you like to restore them?`
            );
            
            if (restore) {
              setFormData(draft.formData);
              setActiveTab(draft.activeTab || 'details');
              setEditingStepIndex(draft.editingStepIndex);
              setEditingQuestionIndex(draft.editingQuestionIndex);
              setDraftRestored(true);
              setHasUnsavedChanges(true);
              initialLoadRef.current = false;
              return;
            } else {
              // User declined, clear the draft
              localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
          } else {
            // Draft is too old, clear it
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
    
    // Normal initialization from module prop
    if (module) {
      setFormData({
        id: module.id || '',
        title: module.title || '',
        description: module.description || '',
        estimatedTime: module.estimatedTime || '30 minutes',
        thumbnailUrl: module.thumbnailUrl || '',
        steps: module.steps || [],
        knowledgeChecks: module.knowledgeChecks || [],
      });
    }
    initialLoadRef.current = false;
  }, [module]);

  // Auto-save draft when form changes
  const saveDraft = useCallback(() => {
    const draft = {
      formData,
      activeTab,
      editingStepIndex,
      editingQuestionIndex,
      timestamp: Date.now(),
      moduleId: module?.id || null,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    console.log('Draft auto-saved');
  }, [formData, activeTab, editingStepIndex, editingQuestionIndex, module]);

  // Set up auto-save on form changes
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    setHasUnsavedChanges(true);
    
    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, AUTO_SAVE_DELAY);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, activeTab, editingStepIndex, editingQuestionIndex, saveDraft]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Clear draft on successful save or cancel
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasUnsavedChanges(false);
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('type', 'thumbnail');

    try {
      const response = await fetch('http://localhost:3001/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      const data = await response.json();
      if (data.url) {
        handleChange('thumbnailUrl', data.url);
      }
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      alert('Failed to upload thumbnail');
    }
  };

  // Step management
  const handleAddStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: 'New Step',
      content: '',
      videoUrl: '',
      safetyWarnings: [],
      tools: [],
      materials: [],
      requiresVideoCompletion: false,
      requiresConfirmation: true,
    };
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setEditingStepIndex(formData.steps.length);
  };

  const handleUpdateStep = (index, updatedStep) => {
    const newSteps = [...formData.steps];
    newSteps[index] = updatedStep;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const handleDeleteStep = (index) => {
    if (confirm('Are you sure you want to delete this step?')) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, steps: newSteps }));
      setEditingStepIndex(null);
    }
  };

  const handleMoveStep = (index, direction) => {
    const newSteps = [...formData.steps];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newSteps.length) return;
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  // Knowledge check management
  const handleAddQuestion = () => {
    const newQuestion = {
      id: `q-${Date.now()}`,
      question: 'New Question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: '',
    };
    setFormData(prev => ({
      ...prev,
      knowledgeChecks: [...prev.knowledgeChecks, newQuestion],
    }));
    setEditingQuestionIndex(formData.knowledgeChecks.length);
  };

  const handleUpdateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...formData.knowledgeChecks];
    newQuestions[index] = updatedQuestion;
    setFormData(prev => ({ ...prev, knowledgeChecks: newQuestions }));
  };

  const handleDeleteQuestion = (index) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const newQuestions = formData.knowledgeChecks.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, knowledgeChecks: newQuestions }));
      setEditingQuestionIndex(null);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a module title');
      return;
    }
    if (!formData.id.trim()) {
      alert('Please enter a module ID');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      clearDraft(); // Clear draft on successful save
    } catch (error) {
      console.error('Failed to save module:', error);
      alert('Failed to save module');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    clearDraft();
    onCancel();
  };

  return (
    <div className="module-editor">
      <div className="module-editor-header">
        <h2>
          {module ? 'Edit Module' : 'Create New Module'}
          {hasUnsavedChanges && <span className="unsaved-indicator"> •</span>}
          {draftRestored && <span className="draft-restored-badge">Draft Restored</span>}
        </h2>
        <div className="module-editor-actions">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Module'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="module-editor-tabs">
        <button
          className={`editor-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          📋 Details
        </button>
        <button
          className={`editor-tab ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
          📝 Steps ({formData.steps.length})
        </button>
        <button
          className={`editor-tab ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          ❓ Knowledge Checks ({formData.knowledgeChecks.length})
        </button>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="module-editor-content">
          <div className="editor-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label className="form-label">Module ID *</label>
              <input
                type="text"
                className="form-input"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="e.g., 08-new-module"
                disabled={!!module}
              />
              <small className="form-help">Unique identifier (cannot be changed after creation)</small>
            </div>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter module title"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter module description"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estimated Time</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.estimatedTime}
                  onChange={(e) => handleChange('estimatedTime', e.target.value)}
                  placeholder="e.g., 45 minutes"
                />
              </div>
            </div>
          </div>

          <div className="editor-section">
            <h3>Thumbnail Image</h3>
            <div className="thumbnail-upload">
              {formData.thumbnailUrl && (
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Module thumbnail" 
                  className="thumbnail-preview"
                />
              )}
              <div className="thumbnail-controls">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  id="thumbnail-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="thumbnail-upload" className="btn btn-outline">
                  📷 Upload Image
                </label>
                <span className="form-help">Or enter URL:</span>
                <input
                  type="text"
                  className="form-input"
                  value={formData.thumbnailUrl}
                  onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
                  placeholder="/images/modules/thumbnail.png"
                />
              </div>
            </div>
          </div>

          {module && onDelete && (
            <div className="editor-section danger-zone">
              <h3>⚠️ Danger Zone</h3>
              <p>Deleting a module is permanent and cannot be undone.</p>
              <Button variant="danger" onClick={() => onDelete(module.id)}>
                Delete Module
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Steps Tab */}
      {activeTab === 'steps' && (
        <div className="module-editor-content">
          <div className="steps-list-header">
            <h3>Training Steps</h3>
            <Button variant="primary" onClick={handleAddStep}>
              + Add Step
            </Button>
          </div>

          {formData.steps.length === 0 ? (
            <div className="empty-state">
              <p>No steps yet. Add your first training step to get started.</p>
            </div>
          ) : (
            <div className="steps-editor-list">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="step-list-item">
                  {editingStepIndex === index ? (
                    <StepEditor
                      step={step}
                      onSave={(updatedStep) => {
                        handleUpdateStep(index, updatedStep);
                        setEditingStepIndex(null);
                      }}
                      onCancel={() => setEditingStepIndex(null)}
                      onDelete={() => handleDeleteStep(index)}
                    />
                  ) : (
                    <div className="step-list-item-preview">
                      <div className="step-order">
                        <button 
                          onClick={() => handleMoveStep(index, -1)}
                          disabled={index === 0}
                          className="move-btn"
                        >
                          ▲
                        </button>
                        <span className="step-number">{index + 1}</span>
                        <button 
                          onClick={() => handleMoveStep(index, 1)}
                          disabled={index === formData.steps.length - 1}
                          className="move-btn"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="step-preview-content">
                        <h4>{step.title}</h4>
                        <div className="step-preview-meta">
                          {step.videoUrl && <span className="meta-badge">📹 Video</span>}
                          {step.safetyWarnings?.length > 0 && (
                            <span className="meta-badge warning">⚠️ {step.safetyWarnings.length} warnings</span>
                          )}
                          {step.tools?.length > 0 && (
                            <span className="meta-badge">🔧 {step.tools.length} tools</span>
                          )}
                        </div>
                      </div>
                      <div className="step-preview-actions">
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => setEditingStepIndex(index)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="small"
                          onClick={() => handleDeleteStep(index)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="module-editor-content">
          <div className="steps-list-header">
            <h3>Knowledge Check Questions</h3>
            <Button variant="primary" onClick={handleAddQuestion}>
              + Add Question
            </Button>
          </div>

          {formData.knowledgeChecks.length === 0 ? (
            <div className="empty-state">
              <p>No questions yet. Add knowledge check questions to test trainee understanding.</p>
            </div>
          ) : (
            <div className="questions-editor-list">
              {formData.knowledgeChecks.map((question, index) => (
                <div key={question.id} className="question-list-item">
                  {editingQuestionIndex === index ? (
                    <KnowledgeCheckEditor
                      question={question}
                      onSave={(updatedQuestion) => {
                        handleUpdateQuestion(index, updatedQuestion);
                        setEditingQuestionIndex(null);
                      }}
                      onCancel={() => setEditingQuestionIndex(null)}
                      onDelete={() => handleDeleteQuestion(index)}
                    />
                  ) : (
                    <div className="question-preview">
                      <div className="question-number">Q{index + 1}</div>
                      <div className="question-preview-content">
                        <p>{question.question}</p>
                        <small>Correct: Option {String.fromCharCode(65 + question.correctAnswer)}</small>
                      </div>
                      <div className="question-preview-actions">
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => setEditingQuestionIndex(index)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="danger" 
                          size="small"
                          onClick={() => handleDeleteQuestion(index)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModuleEditor;
