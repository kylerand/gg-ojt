import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/common/Card';
import TraineeManagement from '../components/admin/TraineeManagement';
import QAManagement from '../components/admin/QAManagement';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import ModuleManagement from '../components/admin/ModuleManagement';

const ADMIN_STATE_KEY = 'gg-admin-state';

function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get initial tab from URL params or localStorage
  const getInitialTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['dashboard', 'modules', 'trainees', 'qa', 'settings'].includes(urlTab)) {
      return urlTab;
    }
    const savedState = localStorage.getItem(ADMIN_STATE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        return state.activeTab || 'dashboard';
      } catch (e) {
        return 'dashboard';
      }
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'modules', label: 'Modules', icon: '📚' },
    { id: 'trainees', label: 'Trainees', icon: '👥' },
    { id: 'qa', label: 'Q&A', icon: '💬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Save state and update URL when tab changes
  useEffect(() => {
    // Update URL without navigation
    setSearchParams({ tab: activeTab }, { replace: true });
    
    // Save to localStorage
    const state = { activeTab, timestamp: Date.now() };
    localStorage.setItem(ADMIN_STATE_KEY, JSON.stringify(state));
  }, [activeTab, setSearchParams]);

  // Handle browser back/forward
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab && ['dashboard', 'modules', 'trainees', 'qa', 'settings'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'modules':
        return <ModuleManagement />;
      case 'trainees':
        return <TraineeManagement />;
      case 'qa':
        return <QAManagement />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>Admin Dashboard</h1>
          <p>Manage trainees, respond to questions, and monitor training progress</p>
        </div>
        <button 
          className="admin-back-btn"
          onClick={() => navigate('/home')}
        >
          ← Back to Training
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="admin-tab-icon">{tab.icon}</span>
            <span className="admin-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState({
    requireVideoCompletion: true,
    requireSafetyAcknowledgment: true,
    passingScore: 80,
    allowSkipSteps: false,
  });

  const handleClearAllData = () => {
    if (!confirm('Are you sure you want to clear ALL local data? This will remove all Q&A questions, notes, and bookmarks. This cannot be undone.')) {
      return;
    }
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('qa-') || key?.startsWith('notes-') || key?.startsWith('bookmarks-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    alert('All local data cleared successfully');
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      questions: [],
      notes: [],
      bookmarks: []
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('qa-')) {
        data.questions.push({
          moduleId: key.replace('qa-', ''),
          questions: JSON.parse(localStorage.getItem(key))
        });
      } else if (key?.startsWith('notes-')) {
        data.notes.push({
          traineeId: key.replace('notes-', ''),
          notes: JSON.parse(localStorage.getItem(key))
        });
      } else if (key?.startsWith('bookmarks-')) {
        data.bookmarks.push({
          traineeId: key.replace('bookmarks-', ''),
          bookmarks: JSON.parse(localStorage.getItem(key))
        });
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-data-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Training Requirements</h3>
        <div className="settings-list">
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.requireVideoCompletion}
              onChange={(e) => setSettings({...settings, requireVideoCompletion: e.target.checked})}
            />
            <span>Require video completion before proceeding</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.requireSafetyAcknowledgment}
              onChange={(e) => setSettings({...settings, requireSafetyAcknowledgment: e.target.checked})}
            />
            <span>Require safety acknowledgment</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={settings.allowSkipSteps}
              onChange={(e) => setSettings({...settings, allowSkipSteps: e.target.checked})}
            />
            <span>Allow skipping steps (not recommended)</span>
          </label>
          <div className="setting-item">
            <label>
              Passing Score (%)
              <input
                type="number"
                min="0"
                max="100"
                value={settings.passingScore}
                onChange={(e) => setSettings({...settings, passingScore: parseInt(e.target.value)})}
                className="setting-number-input"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Management</h3>
        <div className="settings-actions">
          <button 
            className="settings-btn primary"
            onClick={handleExportData}
          >
            📥 Export All Data
          </button>
          <button 
            className="settings-btn danger"
            onClick={handleClearAllData}
          >
            🗑️ Clear All Local Data
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>System Information</h3>
        <div className="system-info">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Environment:</strong> Development</p>
          <p><strong>Last Updated:</strong> January 28, 2026</p>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
