import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { getModules } from '../../services/api';

function LearningPathEditor({ path, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    thumbnailUrl: '',
    moduleIds: [],
    sortOrder: 0,
    isActive: true,
  });
  const [allModules, setAllModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isNew = !path;

  // Populate form when editing an existing path
  useEffect(() => {
    if (path) {
      setFormData({
        id: path.id || '',
        title: path.title || '',
        description: path.description || '',
        thumbnailUrl: path.thumbnailUrl || '',
        moduleIds: path.moduleIds || [],
        sortOrder: path.sortOrder ?? 0,
        isActive: path.isActive !== false,
      });
    }
  }, [path]);

  // Load all available modules for the picker
  useEffect(() => {
    getModules()
      .then((res) => setAllModules(res.data || []))
      .catch((err) => console.error('Failed to load modules:', err))
      .finally(() => setModulesLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Toggle a module in/out of the path's moduleIds list
  const handleToggleModule = (moduleId) => {
    setFormData((prev) => {
      const ids = prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter((id) => id !== moduleId)
        : [...prev.moduleIds, moduleId];
      return { ...prev, moduleIds: ids };
    });
  };

  // Move a module up in the ordered list
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const ids = [...prev.moduleIds];
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      return { ...prev, moduleIds: ids };
    });
  };

  // Move a module down in the ordered list
  const handleMoveDown = (index) => {
    setFormData((prev) => {
      if (index >= prev.moduleIds.length - 1) return prev;
      const ids = [...prev.moduleIds];
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
      return { ...prev, moduleIds: ids };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.id.trim()) newErrors.id = 'ID is required';
    else if (!/^[a-z0-9-]+$/.test(formData.id.trim()))
      newErrors.id = 'ID must be lowercase letters, numbers, and hyphens only';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        id: formData.id.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        sortOrder: Number(formData.sortOrder) || 0,
      });
    } catch (error) {
      console.error('Failed to save learning path:', error);
      setErrors({ submit: error.response?.data?.message || error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete(path.id);
  };

  // Build a lookup map of modules for display
  const moduleMap = new Map(allModules.map((m) => [m.id, m]));

  return (
    <div className="learning-path-editor">
      <div className="learning-path-editor-header">
        <div>
          <h2>{isNew ? 'Create Learning Path' : `Edit: ${path.title}`}</h2>
          <p className="text-secondary">
            {isNew ? 'Set up a new learning path' : `ID: ${path.id}`}
          </p>
        </div>
        <div className="learning-path-editor-actions">
          {!isNew && onDelete && (
            <Button variant="danger" size="small" onClick={handleDelete}>
              🗑️ Delete
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : '💾 Save'}
          </Button>
        </div>
      </div>

      {errors.submit && (
        <div className="error-banner">{errors.submit}</div>
      )}

      <form className="learning-path-editor-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label className="form-label">
              Path ID <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.id ? 'error' : ''}`}
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              placeholder="e.g. assembly-technician"
              disabled={!isNew}
            />
            {errors.id && <span className="form-error">{errors.id}</span>}
            {isNew && (
              <span className="form-hint">
                Unique identifier. Lowercase letters, numbers, and hyphens only.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.title ? 'error' : ''}`}
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Assembly Technician"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this learning path covers…"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thumbnail URL</label>
            <input
              className="form-input"
              type="text"
              value={formData.thumbnailUrl}
              onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
              placeholder="/images/paths/my-path.png"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sort Order</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={(e) => handleChange('sortOrder', e.target.value)}
              style={{ width: '120px' }}
            />
            <span className="form-hint">
              Lower numbers appear first. Use 0, 1, 2, …
            </span>
          </div>

          <div className="form-group">
            <label className="setting-item">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
              />
              <span>Active (visible to trainees)</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Modules in this Path</h3>
          <p className="text-secondary">
            Select and order the modules included in this learning path.
          </p>

          {/* Currently selected modules (ordered) */}
          {formData.moduleIds.length > 0 && (
            <div className="lp-module-order">
              <h4>Selected Modules (in order)</h4>
              <div className="lp-module-order-list">
                {formData.moduleIds.map((moduleId, index) => {
                  const mod = moduleMap.get(moduleId);
                  return (
                    <div key={moduleId} className="lp-module-order-item">
                      <span className="lp-module-order-num">{index + 1}</span>
                      <span className="lp-module-order-title">
                        {mod ? mod.title : moduleId}
                      </span>
                      <div className="lp-module-order-btns">
                        <button
                          type="button"
                          className="lp-order-btn"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="lp-order-btn"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === formData.moduleIds.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="lp-order-btn remove"
                          onClick={() => handleToggleModule(moduleId)}
                          title="Remove from path"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All available modules */}
          <div className="lp-module-picker">
            <h4>Available Modules</h4>
            {modulesLoading ? (
              <p className="text-secondary">Loading modules…</p>
            ) : allModules.length === 0 ? (
              <p className="text-secondary">No modules found.</p>
            ) : (
              <div className="lp-module-picker-list">
                {allModules.map((mod) => {
                  const selected = formData.moduleIds.includes(mod.id);
                  return (
                    <label key={mod.id} className={`lp-module-picker-item ${selected ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleToggleModule(mod.id)}
                      />
                      <span className="lp-module-picker-title">{mod.title}</span>
                      <span className="lp-module-picker-id">{mod.id}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default LearningPathEditor;
