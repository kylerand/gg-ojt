import { useState, useEffect } from 'react';
import Button from '../common/Button';
import TraineeEditor from './TraineeEditor';
import api, { getAdminTrainees, resetProgress as resetProgressAPI, getModules } from '../../services/api';

function TraineeManagement() {
  const [trainees, setTrainees] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
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
    const completed = Object.values(trainee.moduleProgress).filter(m => m.status === 'completed').length;
    const total = 7; // Total modules
    return Math.round((completed / total) * 100);
  };

  const filteredTrainees = trainees.filter(t => 
    t.traineeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.traineeId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="stat-box">
            <span className="stat-number">
              {trainees.filter(t => getCompletionPercentage(t) === 100).length}
            </span>
            <span className="stat-label">Completed All</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">
              {trainees.filter(t => {
                const lastUpdate = new Date(t.lastUpdated || t.startedAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return lastUpdate > weekAgo;
              }).length}
            </span>
            <span className="stat-label">Active This Week</span>
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
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="trainee-sort-select"
        >
          <option value="name">Sort by Name</option>
          <option value="progress">Sort by Progress</option>
          <option value="recent">Sort by Recent Activity</option>
        </select>
      </div>

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
              
              return (
                <div 
                  key={trainee.traineeId}
                  className={`trainee-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTrainee(trainee)}
                >
                  <div className="trainee-avatar">
                    {(trainee.traineeName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="trainee-info">
                    <div className="trainee-name">{trainee.traineeName}</div>
                    <div className="trainee-id">ID: {trainee.traineeId}</div>
                  </div>
                  <div className="trainee-progress-mini">
                    <div className="progress-circle">
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
                <div className="progress-bar-large">
                  <div 
                    className="progress-fill"
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
