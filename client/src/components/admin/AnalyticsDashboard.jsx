import { useState, useEffect } from 'react';
import { getAdminTrainees, getModules } from '../../services/api';

function AnalyticsDashboard() {
  const [trainees, setTrainees] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

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

  const getAverageQuizScores = () => {
    const scores = {};
    modules.forEach(m => {
      const moduleScores = [];
      trainees.forEach(trainee => {
        const progress = trainee.moduleProgress?.[m.id];
        if (progress?.knowledgeCheckScore) {
          // Parse score like "5/6 (83%)"
          const match = progress.knowledgeCheckScore.match(/(\d+)\/(\d+)/);
          if (match) {
            moduleScores.push((parseInt(match[1]) / parseInt(match[2])) * 100);
          }
        }
      });
      scores[m.id] = moduleScores.length > 0 
        ? Math.round(moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length)
        : null;
    });
    return scores;
  };

  const getQAStats = () => {
    let total = 0;
    let pending = 0;
    let answered = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('qa-')) {
        const questions = JSON.parse(localStorage.getItem(key));
        total += questions.length;
        pending += questions.filter(q => q.status === 'pending').length;
        answered += questions.filter(q => q.status === 'answered').length;
      }
    }

    return { total, pending, answered };
  };

  const getActiveTraineesThisWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return trainees.filter(t => {
      const lastUpdate = new Date(t.lastUpdated || t.startedAt);
      return lastUpdate > weekAgo;
    }).length;
  };

  const getCompletionRate = () => {
    if (trainees.length === 0) return 0;
    const fullyCompleted = trainees.filter(t => {
      const completed = Object.values(t.moduleProgress || {}).filter(m => m.status === 'completed').length;
      return completed === modules.length;
    }).length;
    return Math.round((fullyCompleted / trainees.length) * 100);
  };

  if (loading) {
    return <div className="loading-state">Loading analytics...</div>;
  }

  const moduleStats = getModuleCompletionStats();
  const quizScores = getAverageQuizScores();
  const qaStats = getQAStats();

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="analytics-time-select"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
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
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <span className="metric-value">{getActiveTraineesThisWeek()}</span>
            <span className="metric-label">Active This Week</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🎓</div>
          <div className="metric-content">
            <span className="metric-value">{getCompletionRate()}%</span>
            <span className="metric-label">Completion Rate</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💬</div>
          <div className="metric-content">
            <span className="metric-value">{qaStats.pending}</span>
            <span className="metric-label">Pending Questions</span>
          </div>
        </div>
      </div>

      {/* Module Progress Chart */}
      <div className="analytics-section">
        <h3>Module Completion Overview</h3>
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
                {quizScores[m.id] !== null && (
                  <div className="module-chart-score">
                    Avg: {quizScores[m.id]}%
                  </div>
                )}
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

      {/* Q&A Summary */}
      <div className="analytics-section">
        <h3>Q&A Activity</h3>
        <div className="qa-analytics-grid">
          <div className="qa-analytics-card">
            <span className="qa-analytics-number">{qaStats.total}</span>
            <span className="qa-analytics-label">Total Questions</span>
          </div>
          <div className="qa-analytics-card pending">
            <span className="qa-analytics-number">{qaStats.pending}</span>
            <span className="qa-analytics-label">Pending Response</span>
          </div>
          <div className="qa-analytics-card answered">
            <span className="qa-analytics-number">{qaStats.answered}</span>
            <span className="qa-analytics-label">Answered</span>
          </div>
          <div className="qa-analytics-card">
            <span className="qa-analytics-number">
              {qaStats.total > 0 ? Math.round((qaStats.answered / qaStats.total) * 100) : 0}%
            </span>
            <span className="qa-analytics-label">Response Rate</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="analytics-section">
        <h3>Recent Activity</h3>
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
                    Working on {trainee.currentModule || 'training'}
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
