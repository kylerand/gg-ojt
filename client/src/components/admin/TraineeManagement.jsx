import { useState, useEffect } from 'react';
import Button from '../common/Button';
import TraineeEditor from './TraineeEditor';
import api, { getAdminTrainees, resetProgress as resetProgressAPI, getModules } from '../../services/api';

// Job role colors for badges
const ROLE_COLORS = {
  'Assembly': { bg: '#dbeafe', text: '#1e40af' },
  'Quality Control': { bg: '#dcfce7', text: '#166534' },
  'Sales': { bg: '#fef3c7', text: '#92400e' },
  'Supervisor': { bg: '#f3e8ff', text: '#7c3aed' },
  'Trainer': { bg: '#ffe4e6', text: '#be123c' },
  'default': { bg: '#f1f5f9', text: '#475569' },
};

function TraineeManagement() {
  const [trainees, setTrainees] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterByRole, setFilterByRole] = useState('all');
  const [filterByStatus, setFilterByStatus] = useState('all');
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [editingTrainee, setEditingTrainee] = useState(null);

  useEffect(() => {
    loadTrainees();
    loadModules();
  }, []);

  const loadTrainees = async () => {
    try {
      const response = await getAdminTrainees();
      setTrainees(response.data);
    } catch (error) {
      console.error('Failed to load trainees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const response = await getModules();
      setModules(response.data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const handleResetProgress = async (traineeId) => {
    if (!confirm(`Are you sure you want to reset all progress for ${traineeId}? This cannot be undone.`)) {
      return;
    }

    try {
      await resetProgressAPI(traineeId);
      loadTrainees();
      setSelectedTrainee(null);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  };

  const getTraineeNotes = (traineeId) => {
    const stored = localStorage.getItem(`notes-${traineeId}`);
    if (!stored) return [];
    const notes = JSON.parse(stored);
    return Object.entries(notes).filter(([_, value]) => value.trim());
  };

  const getCompletionPercentage = (trainee) => {
    // Use actual modules count instead of hardcoded value
    const totalModules = modules.length || 1;
    const moduleProgress = trainee.moduleProgress || {};
    const completed = Object.values(moduleProgress).filter(m => m.status === 'completed').length;
    return Math.round((completed / totalModules) * 100);
  };

  const getTraineeStatus = (trainee) => {
    const pct = getCompletionPercentage(trainee);
    if (pct === 100) return 'completed';
    if (pct > 0) return 'in-progress';
    return 'not-started';
  };

  const getRoleColor = (role) => {
    return ROLE_COLORS[role] || ROLE_COLORS['default'];
  };

  // Get unique job roles for filter dropdown
  const uniqueRoles = [...new Set(trainees.map(t => t.jobRole).filter(Boolean))];

  const filteredTrainees = trainees.filter(t => {
    // Search filter
    const matchesSearch = 
      t.traineeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.traineeId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = filterByRole === 'all' || t.jobRole === filterByRole;
    
    // Status filter
    const status = getTraineeStatus(t);
    const matchesStatus = filterByStatus === 'all' || status === filterByStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedTrainees = [...filteredTrainees].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.traineeName || '').localeCompare(b.traineeName || '');
      case 'progress':
        return getCompletionPercentage(b) - getCompletionPercentage(a);
      case 'recent':
        return new Date(b.lastUpdated || b.startedAt) - new Date(a.lastUpdated || a.startedAt);
      default:
        return 0;
    }
  });

  if (loading) {
    return <div className="loading-state">Loading trainees...</div>;
  }

  return (
    <div className="trainee-management">
      <div className="trainee-management-header">
        <h2>Trainee Management</h2>
        <div className="trainee-stats-summary">
          <div className="stat-box">
            <span className="stat-number">{trainees.length}</span>
            <span className="stat-label">Total Trainees</span>
          </div>
          <div className="stat-box completed">
            <span className="stat-number">
              {trainees.filter(t => getCompletionPercentage(t) === 100).length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-box in-progress">
            <span className="stat-number">
              {trainees.filter(t => {
                const pct = getCompletionPercentage(t);
                return pct > 0 && pct < 100;
              }).length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-box not-started">
            <span className="stat-number">
              {trainees.filter(t => getCompletionPercentage(t) === 0).length}
            </span>
            <span className="stat-label">Not Started</span>
          </div>
        </div>
      </div>

      <div className="trainee-controls">
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="trainee-search-input"
        />
        <select 
          value={filterByRole} 
          onChange={(e) => setFilterByRole(e.target.value)}
          className="trainee-filter-select"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select 
          value={filterByStatus} 
          onChange={(e) => setFilterByStatus(e.target.value)}
          className="trainee-filter-select"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="not-started">Not Started</option>
        </select>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="trainee-sort-select"
        >
          <option value="name">Sort by Name</option>
          <option value="progress">Sort by Progress</option>
          <option value="recent">Sort by Recent Activity</option>
        </select>
      </div>

      {filteredTrainees.length !== trainees.length && (
        <div className="filter-results-info">
          Showing {filteredTrainees.length} of {trainees.length} trainees
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setFilterByRole('all');
              setFilterByStatus('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="trainee-list-container">
        <div className="trainee-list">
          {sortedTrainees.length === 0 ? (
            <div className="empty-state">
              <p>No trainees found</p>
            </div>
          ) : (
            sortedTrainees.map(trainee => {
              const completionPct = getCompletionPercentage(trainee);
              const isSelected = selectedTrainee?.traineeId === trainee.traineeId;
              const status = getTraineeStatus(trainee);
              const roleColor = getRoleColor(trainee.jobRole);
              
              return (
                <div 
                  key={trainee.traineeId}
                  className={`trainee-list-item ${isSelected ? 'selected' : ''} status-${status}`}
                  onClick={() => setSelectedTrainee(trainee)}
                >
                  <div className="trainee-avatar">
                    {(trainee.traineeName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="trainee-info">
                    <div className="trainee-name">{trainee.traineeName}</div>
                    <div className="trainee-meta">
                      <span className="trainee-id">ID: {trainee.traineeId}</span>
                      {trainee.jobRole && (
                        <span 
                          className="trainee-role-tag"
                          style={{ 
                            backgroundColor: roleColor.bg, 
                            color: roleColor.text 
                          }}
                        >
                          {trainee.jobRole}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="trainee-progress-mini">
                    <div className={`progress-circle ${status}`}>
                      <svg viewBox="0 0 36 36">
                        <path
                          className="progress-circle-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="progress-circle-fill"
                          strokeDasharray={`${completionPct}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="progress-percentage">{completionPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Trainee Detail Panel */}
        {selectedTrainee && (
          <div className="trainee-detail-panel">
            <div className="trainee-detail-header">
              <div className="trainee-detail-avatar">
                {(selectedTrainee.traineeName || 'U')[0].toUpperCase()}
              </div>
              <div className="trainee-detail-info">
                <h3>{selectedTrainee.traineeName}</h3>
                <p>ID: {selectedTrainee.traineeId}</p>
                {selectedTrainee.jobRole && (
                  <span 
                    className="trainee-role-tag"
                    style={{ 
                      backgroundColor: getRoleColor(selectedTrainee.jobRole).bg, 
                      color: getRoleColor(selectedTrainee.jobRole).text 
                    }}
                  >
                    {selectedTrainee.jobRole}
                  </span>
                )}
                <p>Cart Type: {selectedTrainee.cartType}</p>
              </div>
              <button 
                className="close-panel-btn"
                onClick={() => setSelectedTrainee(null)}
              >
                ✕
              </button>
            </div>

            <div className="trainee-detail-section">
              <h4>Training Progress</h4>
              <div className="trainee-detail-progress">
                <div className="progress-status-badge" data-status={getTraineeStatus(selectedTrainee)}>
                  {getTraineeStatus(selectedTrainee).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="progress-bar-large">
                  <div 
                    className={`progress-fill status-${getTraineeStatus(selectedTrainee)}`}
                    style={{ width: `${getCompletionPercentage(selectedTrainee)}%` }}
                  />
                </div>
                <span>{getCompletionPercentage(selectedTrainee)}% Complete</span>
              </div>
            </div>

            <div className="trainee-detail-section">
              <h4>Module Status</h4>
              <div className="module-status-list">
                {Object.entries(selectedTrainee.moduleProgress || {}).map(([moduleId, progress]) => (
                  <div key={moduleId} className={`module-status-item ${progress.status}`}>
                    <span className="module-status-icon">
                      {progress.status === 'completed' ? '✓' : 
                       progress.status === 'in_progress' ? '⏳' : '○'}
                    </span>
                    <span className="module-status-name">{moduleId}</span>
                    {progress.knowledgeCheckScore && (
                      <span className="module-status-score">{progress.knowledgeCheckScore}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="trainee-detail-section">
              <h4>Notes ({getTraineeNotes(selectedTrainee.traineeId).length})</h4>
              <div className="trainee-notes-preview">
                {getTraineeNotes(selectedTrainee.traineeId).length === 0 ? (
                  <p className="no-notes">No notes recorded</p>
                ) : (
                  getTraineeNotes(selectedTrainee.traineeId).slice(0, 3).map(([key, note]) => (
                    <div key={key} className="note-preview-item">
                      <span className="note-step">{key}</span>
                      <p>{note.substring(0, 100)}...</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="trainee-detail-section">
              <h4>Timeline</h4>
              <div className="trainee-timeline">
                <div className="timeline-item">
                  <span className="timeline-date">
                    {new Date(selectedTrainee.startedAt).toLocaleDateString()}
                  </span>
                  <span className="timeline-event">Started Training</span>
                </div>
                {selectedTrainee.lastUpdated && (
                  <div className="timeline-item">
                    <span className="timeline-date">
                      {new Date(selectedTrainee.lastUpdated).toLocaleDateString()}
                    </span>
                    <span className="timeline-event">Last Activity</span>
                  </div>
                )}
              </div>
            </div>

            <div className="trainee-detail-actions">
              <Button 
                variant="primary"
                onClick={() => setEditingTrainee(selectedTrainee)}
              >
                ✏️ Edit Trainee
              </Button>
              <Button 
                variant="danger"
                onClick={() => handleResetProgress(selectedTrainee.traineeId)}
              >
                Reset All Progress
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Trainee Editor Modal */}
      {editingTrainee && (
        <TraineeEditor
          trainee={editingTrainee}
          modules={modules}
          onSave={() => {
            loadTrainees();
            // Refresh selected trainee data
            if (selectedTrainee) {
              api.get(`/admin/trainees/${selectedTrainee.traineeId}`)
                .then(res => setSelectedTrainee(res.data))
                .catch(console.error);
            }
          }}
          onClose={() => setEditingTrainee(null)}
        />
      )}
    </div>
  );
}

export default TraineeManagement;
