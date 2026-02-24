import { useState, useEffect } from 'react';
import Button from '../common/Button';
import LearningPathEditor from './LearningPathEditor';
import {
  getAdminLearningPaths,
  getAdminLearningPath,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
} from '../../services/api';

function LearningPathManagement() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPath, setEditingPath] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const response = await getAdminLearningPaths();
      setPaths(response.data || []);
    } catch (error) {
      console.error('Failed to fetch learning paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePath = async (pathData) => {
    if (isCreating) {
      await createLearningPath(pathData);
    } else {
      await updateLearningPath(pathData.id, pathData);
    }
    await fetchPaths();
    setEditingPath(null);
    setIsCreating(false);
  };

  const handleDeletePath = async (pathId) => {
    if (!confirm('Are you sure you want to delete this learning path? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteLearningPath(pathId);
      await fetchPaths();
      setEditingPath(null);
    } catch (error) {
      console.error('Failed to delete learning path:', error);
      alert('Failed to delete learning path');
    }
  };

  const handleEditPath = async (pathId) => {
    try {
      const response = await getAdminLearningPath(pathId);
      setEditingPath(response.data);
    } catch (error) {
      console.error('Failed to fetch learning path:', error);
    }
  };

  const handleCreatePath = () => {
    setIsCreating(true);
    setEditingPath(null);
  };

  const handleCancelEdit = () => {
    setEditingPath(null);
    setIsCreating(false);
  };

  const filteredPaths = paths.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-state">Loading learning paths…</div>;
  }

  if (isCreating || editingPath) {
    return (
      <LearningPathEditor
        path={editingPath}
        onSave={handleSavePath}
        onCancel={handleCancelEdit}
        onDelete={editingPath ? handleDeletePath : null}
      />
    );
  }

  return (
    <div className="module-management">
      <div className="module-management-header">
        <div>
          <h2>Learning Paths</h2>
          <p className="text-secondary">{paths.length} paths total</p>
        </div>
        <Button variant="primary" onClick={handleCreatePath}>
          + Create New Path
        </Button>
      </div>

      <div className="module-management-controls">
        <input
          type="text"
          className="form-input module-search"
          placeholder="Search learning paths…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="modules-admin-list">
        {filteredPaths.length === 0 ? (
          <div className="empty-state">
            {searchTerm
              ? 'No paths match your search.'
              : 'No learning paths yet. Create your first path!'}
          </div>
        ) : (
          filteredPaths.map((path, index) => (
            <div key={path.id} className="module-admin-item">
              <div className="module-admin-order">{index + 1}</div>
              <div className="module-admin-thumbnail">
                {path.thumbnailUrl ? (
                  <img src={path.thumbnailUrl} alt={path.title} />
                ) : (
                  <div className="thumbnail-placeholder">🛤️</div>
                )}
              </div>
              <div className="module-admin-info">
                <h4>{path.title}</h4>
                <p className="module-admin-id">ID: {path.id}</p>
                <div className="module-admin-meta">
                  <span>📚 {path.moduleIds?.length || 0} modules</span>
                  <span>🔢 Order: {path.sortOrder ?? 0}</span>
                  {path.isActive === false && (
                    <span className="badge-inactive">Inactive</span>
                  )}
                </div>
              </div>
              <div className="module-admin-actions">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleEditPath(path.id)}
                >
                  ✏️ Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LearningPathManagement;
