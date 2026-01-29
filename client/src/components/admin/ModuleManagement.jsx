import { useState, useEffect, useCallback } from 'react';
import Button from '../common/Button';
import ModuleEditor from './ModuleEditor';
import { getModules, getModule, createModule, updateModule, deleteModule } from '../../services/api';

const STORAGE_KEY = 'admin-module-management-state';

function ModuleManagement() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Restore saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { editingModuleId, isCreating: wasCreating, searchTerm: savedSearch } = JSON.parse(savedState);
        setSearchTerm(savedSearch || '');
        
        // If we were creating a new module, resume that
        if (wasCreating) {
          setIsCreating(true);
        }
        
        // If we were editing a module, we'll restore it after modules load
        if (editingModuleId) {
          // Store for later restoration
          window._pendingEditModuleId = editingModuleId;
        }
      } catch (e) {
        console.error('Failed to restore module management state:', e);
      }
    }
    setInitialized(true);
  }, []);

  // Save state when it changes
  const saveState = useCallback((moduleId, creating, search) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      editingModuleId: moduleId,
      isCreating: creating,
      searchTerm: search,
      timestamp: Date.now()
    }));
  }, []);

  // Clear saved state
  const clearSavedState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    delete window._pendingEditModuleId;
  }, []);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await getModules();
      const data = response.data;
      setModules(data);
      
      // Restore editing state if we had a pending module
      if (window._pendingEditModuleId) {
        const moduleToEdit = data.find(m => m.id === window._pendingEditModuleId);
        if (moduleToEdit) {
          // Fetch full module data
          try {
            const fullResponse = await getModule(window._pendingEditModuleId);
            setEditingModule(fullResponse.data);
          } catch (e) {
            console.error('Failed to restore editing module:', e);
          }
        }
        delete window._pendingEditModuleId;
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModule = async (moduleData) => {
    try {
      const isNew = !editingModule;
      
      if (isNew) {
        await createModule(moduleData);
      } else {
        await updateModule(moduleData.id, moduleData);
      }

      await fetchModules();
      setEditingModule(null);
      setIsCreating(false);
      clearSavedState(); // Clear saved state on successful save
    } catch (error) {
      console.error('Failed to save module:', error);
      throw error;
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteModule(moduleId);
      await fetchModules();
      setEditingModule(null);
    } catch (error) {
      console.error('Failed to delete module:', error);
      alert('Failed to delete module');
    }
  };

  const handleEditModule = async (moduleId) => {
    try {
      const response = await getModule(moduleId);
      setEditingModule(response.data);
      saveState(moduleId, false, searchTerm); // Save that we're editing this module
    } catch (error) {
      console.error('Failed to fetch module:', error);
    }
  };

  // Handle creating new module
  const handleCreateModule = () => {
    setIsCreating(true);
    saveState(null, true, searchTerm);
  };

  // Handle cancel editing/creating
  const handleCancelEdit = () => {
    setEditingModule(null);
    setIsCreating(false);
    clearSavedState();
  };

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-state">Loading modules...</div>;
  }

  // Show editor if creating or editing
  if (isCreating || editingModule) {
    return (
      <ModuleEditor
        module={editingModule}
        onSave={handleSaveModule}
        onCancel={handleCancelEdit}
        onDelete={editingModule ? handleDeleteModule : null}
      />
    );
  }

  return (
    <div className="module-management">
      <div className="module-management-header">
        <div>
          <h2>Training Modules</h2>
          <p className="text-secondary">{modules.length} modules total</p>
        </div>
        <Button variant="primary" onClick={handleCreateModule}>
          + Create New Module
        </Button>
      </div>

      <div className="module-management-controls">
        <input
          type="text"
          className="form-input module-search"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="modules-admin-list">
        {filteredModules.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? 'No modules match your search.' : 'No modules yet. Create your first module!'}
          </div>
        ) : (
          filteredModules.map((module, index) => (
            <div key={module.id} className="module-admin-item">
              <div className="module-admin-order">{index + 1}</div>
              <div className="module-admin-thumbnail">
                {module.thumbnailUrl ? (
                  <img src={module.thumbnailUrl} alt={module.title} />
                ) : (
                  <div className="thumbnail-placeholder">📚</div>
                )}
              </div>
              <div className="module-admin-info">
                <h4>{module.title}</h4>
                <p className="module-admin-id">ID: {module.id}</p>
                <div className="module-admin-meta">
                  <span>📝 {module.steps?.length || 0} steps</span>
                  <span>❓ {module.knowledgeChecks?.length || 0} questions</span>
                  <span>⏱️ {module.estimatedTime}</span>
                </div>
              </div>
              <div className="module-admin-actions">
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => handleEditModule(module.id)}
                >
                  ✏️ Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => window.open(`/module/${module.id}`, '_blank')}
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

export default ModuleManagement;
