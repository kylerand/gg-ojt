import { useState, useEffect } from 'react';
import { getAdminTrainees, getModules } from '../../services/api';

function AnalyticsDashboard() {
  const [trainees, setTrainees] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('trainees'); // 'trainees' or 'modules'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [traineesRes, modulesRes] = await Promise.all([
        getAdminTrainees(),
        getModules()
      ]);
      setTrainees(traineesRes.data);
      setModules(modulesRes.data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use backend-calculated completion percentage if available
  const getTraineeCompletionPct = (trainee) => {
    if (trainee.completionPercentage !== undefined) {
      return trainee.completionPercentage;
    }
    // Fallback to local calculation
    const totalModules = trainee.totalModules || modules.length || 1;
    const completed = Object.values(trainee.moduleProgress || {}).filter(m => m.status === 'completed').length;
    return Math.round((completed / totalModules) * 100);
  };

  const getTraineeStatus = (trainee) => {
    const pct = getTraineeCompletionPct(trainee);
    if (pct === 100) return 'completed';
    if (pct > 0) return 'in-progress';
    return 'not-started';
  };

  const getModuleCompletionStats = () => {
    const stats = {};
    modules.forEach(m => {
      stats[m.id] = { completed: 0, inProgress: 0, notStarted: 0 };
    });

    trainees.forEach(trainee => {
      modules.forEach(m => {
        const progress = trainee.moduleProgress?.[m.id];
        if (progress?.status === 'completed') {
          stats[m.id].completed++;
        } else if (progress?.status === 'in_progress') {
          stats[m.id].inProgress++;
        } else {
          stats[m.id].notStarted++;
        }
      });
    });

    return stats;
  };

  const getCompletionByStatus = () => {
    return {
      completed: trainees.filter(t => getTraineeStatus(t) === 'completed').length,
      inProgress: trainees.filter(t => getTraineeStatus(t) === 'in-progress').length,
      notStarted: trainees.filter(t => getTraineeStatus(t) === 'not-started').length
    };
  };

  const getActiveTraineesThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return trainees.filter(t => {
      const lastUpdate = new Date(t.lastUpdated || t.startedAt);
      return lastUpdate > weekAgo;
    }).length;
  };

  const getTraineesByRole = () => {
    const byRole = {};
    trainees.forEach(t => {
      const role = t.jobRole || 'Unassigned';
      if (!byRole[role]) {
        byRole[role] = { total: 0, completed: 0, inProgress: 0, notStarted: 0 };
      }
      byRole[role].total++;
      const status = getTraineeStatus(t);
      if (status === 'completed') byRole[role].completed++;
      else if (status === 'in-progress') byRole[role].inProgress++;
      else byRole[role].notStarted++;
    });
    return byRole;
  };

  if (loading) {
    return <div className="loading-state">Loading analytics...</div>;
  }

  const moduleStats = getModuleCompletionStats();
  const statusCounts = getCompletionByStatus();
  const roleStats = getTraineesByRole();

  // Sort trainees by completion percentage
  const traineesSortedByProgress = [...trainees].sort(
    (a, b) => getTraineeCompletionPct(b) - getTraineeCompletionPct(a)
  );

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <div className="analytics-view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'trainees' ? 'active' : ''}`}
            onClick={() => setViewMode('trainees')}
          >
            👤 Trainee Progress
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'modules' ? 'active' : ''}`}
            onClick={() => setViewMode('modules')}
          >
            📚 Module Completion
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <span className="metric-value">{trainees.length}</span>
            <span className="metric-label">Total Trainees</span>
          </div>
        </div>
        <div className="metric-card completed">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <span className="metric-value">{statusCounts.completed}</span>
            <span className="metric-label">Fully Certified</span>
          </div>
        </div>
        <div className="metric-card in-progress">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <span className="metric-value">{statusCounts.inProgress}</span>
            <span className="metric-label">In Training</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <span className="metric-value">{statusCounts.notStarted}</span>
            <span className="metric-label">Not Started</span>
          </div>
        </div>
      </div>

      {viewMode === 'trainees' ? (
        <>
          {/* Individual Trainee Progress */}
          <div className="analytics-section">
            <h3>Individual Trainee Progress</h3>
            <p className="section-subtitle">Track each trainee's completion status and progress</p>
            <div className="trainee-progress-list">
              {traineesSortedByProgress.map(trainee => {
                const pct = getTraineeCompletionPct(trainee);
                const status = getTraineeStatus(trainee);
                const completedModules = Object.values(trainee.moduleProgress || {}).filter(m => m.status === 'completed').length;
                
                return (
                  <div key={trainee.traineeId} className={`trainee-progress-row status-${status}`}>
                    <div className="trainee-progress-info">
                      <div className="trainee-progress-avatar">
                        {(trainee.traineeName || 'U')[0].toUpperCase()}
                      </div>
                      <div className="trainee-progress-details">
                        <span className="trainee-progress-name">{trainee.traineeName}</span>
                        <span className="trainee-progress-meta">
                          {trainee.jobRole && (
                            <span className="trainee-progress-role">{trainee.jobRole}</span>
                          )}
                          <span className="trainee-progress-modules">
                            {completedModules}/{modules.length} modules
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="trainee-progress-bar-container">
                      <div className="trainee-progress-bar">
                        <div 
                          className={`trainee-progress-fill status-${status}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`trainee-progress-pct status-${status}`}>{pct}%</span>
                    </div>
                    <div className={`trainee-status-badge ${status}`}>
                      {status === 'completed' ? '✓ Certified' : 
                       status === 'in-progress' ? 'In Progress' : 'Not Started'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress by Role */}
          <div className="analytics-section">
            <h3>Progress by Job Role</h3>
            <p className="section-subtitle">See how different teams are progressing through training</p>
            <div className="role-progress-grid">
              {Object.entries(roleStats).map(([role, stats]) => (
                <div key={role} className="role-progress-card">
                  <h4>{role}</h4>
                  <div className="role-progress-stats">
                    <div className="role-stat">
                      <span className="role-stat-value">{stats.total}</span>
                      <span className="role-stat-label">Total</span>
                    </div>
                    <div className="role-stat completed">
                      <span className="role-stat-value">{stats.completed}</span>
                      <span className="role-stat-label">Certified</span>
                    </div>
                    <div className="role-stat in-progress">
                      <span className="role-stat-value">{stats.inProgress}</span>
                      <span className="role-stat-label">In Progress</span>
                    </div>
                    <div className="role-stat not-started">
                      <span className="role-stat-value">{stats.notStarted}</span>
                      <span className="role-stat-label">Not Started</span>
                    </div>
                  </div>
                  <div className="role-progress-bar">
                    <div 
                      className="role-bar-fill completed"
                      style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                    />
                    <div 
                      className="role-bar-fill in-progress"
                      style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Module Completion View */
        <div className="analytics-section">
          <h3>Module Completion Overview</h3>
          <p className="section-subtitle">See how many trainees have completed each module</p>
          <div className="module-chart">
            {modules.map(m => {
              const stats = moduleStats[m.id] || { completed: 0, inProgress: 0, notStarted: 0 };
              const total = trainees.length || 1;
              const completedPct = (stats.completed / total) * 100;
              const inProgressPct = (stats.inProgress / total) * 100;
              
              return (
                <div key={m.id} className="module-chart-row">
                  <div className="module-chart-label">
                    <span className="module-chart-title">{m.title}</span>
                    <span className="module-chart-stats">
                      {stats.completed}/{total} completed
                    </span>
                  </div>
                  <div className="module-chart-bar">
                    <div 
                      className="module-chart-fill completed"
                      style={{ width: `${completedPct}%` }}
                    />
                    <div 
                      className="module-chart-fill in-progress"
                      style={{ width: `${inProgressPct}%`, left: `${completedPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="module-chart-legend">
            <span className="legend-item">
              <span className="legend-color completed"></span> Completed
            </span>
            <span className="legend-item">
              <span className="legend-color in-progress"></span> In Progress
            </span>
            <span className="legend-item">
              <span className="legend-color not-started"></span> Not Started
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity - Always shown */}
      <div className="analytics-section">
        <h3>Recent Activity</h3>
        <p className="section-subtitle">{getActiveTraineesThisWeek()} trainees active this week</p>
        <div className="recent-activity-list">
          {trainees
            .sort((a, b) => new Date(b.lastUpdated || b.startedAt) - new Date(a.lastUpdated || a.startedAt))
            .slice(0, 5)
            .map(trainee => (
              <div key={trainee.traineeId} className="activity-item">
                <div className="activity-avatar">
                  {(trainee.traineeName || 'U')[0].toUpperCase()}
                </div>
                <div className="activity-content">
                  <span className="activity-name">{trainee.traineeName}</span>
                  <span className="activity-action">
                    {getTraineeCompletionPct(trainee)}% complete • {trainee.currentModule || 'training'}
                  </span>
                </div>
                <div className="activity-time">
                  {new Date(trainee.lastUpdated || trainee.startedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
