import { useState, useEffect } from 'react';
import Button from '../common/Button';
import KnowledgeCheckEditor from './KnowledgeCheckEditor';
import {
  getLearningPaths,
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  getModules,
} from '../../services/api';

function LearningPathManagement() {
  const [learningPaths, setLearningPaths] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPath, setEditingPath] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lpRes, modRes] = await Promise.all([getLearningPaths(), getModules()]);
      setLearningPaths(lpRes.data || []);
      setModules(modRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (isCreating) {
        await createLearningPath(formData);
      } else {
        await updateLearningPath(formData.id, formData);
      }
      await fetchData();
      setEditingPath(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save learning path:', error);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this learning path? This cannot be undone.')) {
      return;
    }
    try {
      await deleteLearningPath(id);
      await fetchData();
      setEditingPath(null);
    } catch (error) {
      console.error('Failed to delete learning path:', error);
      alert('Failed to delete learning path');
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await getLearningPath(id);
      setEditingPath(res.data);
    } catch (error) {
      console.error('Failed to fetch learning path:', error);
    }
  };

  const handleCreate = () => {
    setEditingPath(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingPath(null);
    setIsCreating(false);
  };

  if (loading) return <div className="loading-state">Loading learning paths...</div>;

  if (isCreating || editingPath) {
    return (
      <LearningPathEditor
        learningPath={editingPath}
        allModules={modules}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={editingPath ? () => handleDelete(editingPath.id) : null}
      />
    );
  }

  return (
    <div className="module-management">
      <div className="module-management-header">
        <div>
          <h2>Learning Paths</h2>
          <p className="text-secondary">
            {learningPaths.length} learning path{learningPaths.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          + Create New Learning Path
        </Button>
      </div>

      <div className="modules-admin-list">
        {learningPaths.length === 0 ? (
          <div className="empty-state">No learning paths yet. Create your first learning path!</div>
        ) : (
          learningPaths.map((lp, index) => (
            <div key={lp.id} className="module-admin-item">
              <div className="module-admin-order">{index + 1}</div>
              <div className="module-admin-thumbnail">
                {lp.thumbnailUrl ? (
                  <img src={lp.thumbnailUrl} alt={lp.title} />
                ) : (
                  <div className="thumbnail-placeholder">🗺️</div>
                )}
              </div>
              <div className="module-admin-info">
                <h4>{lp.title}</h4>
                <p className="module-admin-id">ID: {lp.id}</p>
                <div className="module-admin-meta">
                  <span>📚 {lp.moduleCount || lp.moduleIds?.length || 0} modules</span>
                  <span>❓ {lp.knowledgeCheckCount || lp.knowledgeChecks?.length || 0} final questions</span>
                  <span>⏱️ {lp.estimatedTime}</span>
                </div>
              </div>
              <div className="module-admin-actions">
                <Button variant="outline" size="small" onClick={() => handleEdit(lp.id)}>
                  ✏️ Edit
                </Button>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => window.open(`/learning-path/${lp.id}`, '_blank')}
                >
                  👁️ Preview
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Inline editor for a learning path
// ────────────────────────────────────────────────
function LearningPathEditor({ learningPath, allModules, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    id: learningPath?.id || '',
    title: learningPath?.title || '',
    description: learningPath?.description || '',
    estimatedTime: learningPath?.estimatedTime || '60 minutes',
    thumbnailUrl: learningPath?.thumbnailUrl || '',
    moduleIds: learningPath?.moduleIds || [],
    knowledgeChecks: learningPath?.knowledgeChecks || [],
    isActive: learningPath?.isActive !== false,
    sortOrder: learningPath?.sortOrder || 0,
  });
  const [activeTab, setActiveTab] = useState('details');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isNew = !learningPath;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleModule = (moduleId) => {
    setFormData((prev) => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter((id) => id !== moduleId)
        : [...prev.moduleIds, moduleId],
    }));
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: `lp-check-${Date.now()}`,
      question: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    setFormData((prev) => ({
      ...prev,
      knowledgeChecks: [...prev.knowledgeChecks, newQuestion],
    }));
    setEditingQuestionIndex(formData.knowledgeChecks.length);
  };

  const handleSaveQuestion = (index, questionData) => {
    const updated = [...formData.knowledgeChecks];
    updated[index] = questionData;
    setFormData((prev) => ({ ...prev, knowledgeChecks: updated }));
    setEditingQuestionIndex(null);
  };

  const handleDeleteQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      knowledgeChecks: prev.knowledgeChecks.filter((_, i) => i !== index),
    }));
    setEditingQuestionIndex(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.id.trim()) {
      alert('Please enter an ID');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      alert(`Failed to save: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (editingQuestionIndex !== null) {
    const question = formData.knowledgeChecks[editingQuestionIndex];
    return (
      <KnowledgeCheckEditor
        question={question}
        onSave={(q) => handleSaveQuestion(editingQuestionIndex, q)}
        onCancel={() => setEditingQuestionIndex(null)}
        onDelete={() => handleDeleteQuestion(editingQuestionIndex)}
      />
    );
  }

  return (
    <div className="module-editor">
      <div className="module-editor-header">
        <Button variant="outline" onClick={onCancel}>
          ← Back to Learning Paths
        </Button>
        <h2>{isNew ? 'Create New Learning Path' : `Edit: ${formData.title}`}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onDelete && (
            <Button variant="danger" size="small" onClick={onDelete}>
              🗑️ Delete
            </Button>
          )}
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : '💾 Save'}
          </Button>
        </div>
      </div>

      <div className="editor-tabs">
        {['details', 'modules', 'finalTest'].map((tab) => (
          <button
            key={tab}
            className={`editor-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'details' && '📋 Details'}
            {tab === 'modules' && `📚 Modules (${formData.moduleIds.length})`}
            {tab === 'finalTest' && `❓ Final Test (${formData.knowledgeChecks.length})`}
          </button>
        ))}
      </div>

      <div className="editor-content">
        {activeTab === 'details' && (
          <div className="editor-section">
            <div className="form-group">
              <label className="form-label">Learning Path ID *</label>
              <input
                type="text"
                className="form-input"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                placeholder="e.g. electrical-systems"
                disabled={!isNew}
              />
              {isNew && (
                <p className="form-hint">Use lowercase letters, numbers, and hyphens only.</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Electrical Systems"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what trainees will learn in this learning path..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Time</label>
              <input
                type="text"
                className="form-input"
                value={formData.estimatedTime}
                onChange={(e) => handleChange('estimatedTime', e.target.value)}
                placeholder="e.g. 2 hours"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thumbnail URL</label>
              <input
                type="text"
                className="form-input"
                value={formData.thumbnailUrl}
                onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sort Order</label>
              <input
                type="number"
                className="form-input"
                style={{ width: '120px' }}
                value={formData.sortOrder}
                onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="editor-section">
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Select the modules that are part of this learning path. Trainees must complete all
              selected modules before taking the final test.
            </p>
            {allModules.length === 0 ? (
              <p>No modules available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allModules.map((mod) => {
                  const isSelected = formData.moduleIds.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: isSelected ? '#d1fae5' : 'var(--bg-color)',
                        borderRadius: '0.5rem',
                        border: `1px solid ${isSelected ? 'var(--secondary-color)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleModule(mod.id)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold' }}>{mod.title}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {mod.id} &nbsp;•&nbsp; {mod.stepCount} steps &nbsp;•&nbsp; {mod.estimatedTime}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            {formData.moduleIds.length > 0 && (
              <p style={{ marginTop: '1rem', fontWeight: '600' }}>
                ✅ {formData.moduleIds.length} module{formData.moduleIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {activeTab === 'finalTest' && (
          <div className="editor-section">
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Add final test questions that trainees must pass after completing all modules in
              this learning path. If no questions are added, no final test is required.
            </p>
            <Button variant="primary" onClick={handleAddQuestion} style={{ marginBottom: '1rem' }}>
              + Add Question
            </Button>
            {formData.knowledgeChecks.length === 0 ? (
              <div className="empty-state">No final test questions yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {formData.knowledgeChecks.map((q, index) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-color)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      Q{index + 1}
                    </span>
                    <p style={{ flex: 1 }}>{q.question || '(No question text)'}</p>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setEditingQuestionIndex(index)}
                    >
                      ✏️ Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningPathManagement;
