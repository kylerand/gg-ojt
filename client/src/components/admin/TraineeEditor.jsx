import { useState, useEffect } from 'react';
import Button from '../common/Button';
import api from '../../services/api';

// Predefined job roles for golf cart assembly
const JOB_ROLES = [
  'Assembly Technician',
  'Lead Assembly Technician',
  'Quality Inspector',
  'Electrical Specialist',
  'Frame & Chassis Specialist',
  'Paint & Body Technician',
  'Supervisor',
  'Trainer',
  'Maintenance Technician',
  'Warehouse Associate',
];

// Available certifications
const AVAILABLE_CERTIFICATIONS = [
  { id: 'forklift', name: 'Forklift Operator', icon: '🚜' },
  { id: 'electrical', name: 'Electrical Safety', icon: '⚡' },
  { id: 'first-aid', name: 'First Aid/CPR', icon: '🏥' },
  { id: 'hazmat', name: 'Hazardous Materials', icon: '☢️' },
  { id: 'lockout-tagout', name: 'Lockout/Tagout (LOTO)', icon: '🔒' },
  { id: 'confined-space', name: 'Confined Space Entry', icon: '🚧' },
  { id: 'fall-protection', name: 'Fall Protection', icon: '🪢' },
  { id: 'welding', name: 'Welding Certification', icon: '🔥' },
  { id: 'quality-systems', name: 'Quality Management Systems', icon: '✅' },
  { id: 'lean-manufacturing', name: 'Lean Manufacturing', icon: '📊' },
];

function TraineeEditor({ trainee, modules, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    traineeName: '',
    email: '',
    phone: '',
    department: '',
    supervisor: '',
    hireDate: '',
    cartType: 'electric-standard',
    jobRole: '',
    certifications: [],
    emergencyContact: '',
    notes: '',
  });
  const [moduleProgress, setModuleProgress] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [newCertification, setNewCertification] = useState({ id: '', name: '', earnedDate: '', expiresDate: '' });

  useEffect(() => {
    if (trainee) {
      setProfileData({
        traineeName: trainee.traineeName || '',
        email: trainee.email || '',
        phone: trainee.phone || '',
        department: trainee.department || '',
        supervisor: trainee.supervisor || '',
        hireDate: trainee.hireDate || '',
        cartType: trainee.cartType || 'electric-standard',
        jobRole: trainee.jobRole || '',
        certifications: trainee.certifications || [],
        emergencyContact: trainee.emergencyContact || '',
        notes: trainee.notes || '',
      });
      setModuleProgress(trainee.moduleProgress || {});
    }
  }, [trainee]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await api.put(`/admin/trainees/${trainee.traineeId}`, profileData);
      
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      onSave?.();
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 4) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await api.post(`/admin/trainees/${trainee.traineeId}/reset-password`, { newPassword });
      
      setSaveMessage({ type: 'success', text: 'Password reset successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModuleProgressChange = (moduleId, field, value) => {
    setModuleProgress(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      }
    }));
  };

  const handleSetModuleStatus = async (moduleId, status) => {
    const module = modules.find(m => m.id === moduleId);
    const allSteps = module?.steps?.map(s => s.id) || [];
    
    const updatedProgress = {
      status,
      startedAt: moduleProgress[moduleId]?.startedAt || new Date().toISOString(),
      completedAt: status === 'completed' ? new Date().toISOString() : null,
      completedSteps: status === 'completed' ? allSteps : (status === 'not_started' ? [] : moduleProgress[moduleId]?.completedSteps || []),
      knowledgeCheckScore: moduleProgress[moduleId]?.knowledgeCheckScore || null,
      supervisorSignoff: moduleProgress[moduleId]?.supervisorSignoff || false,
    };

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await api.put(`/admin/trainees/${trainee.traineeId}/modules/${moduleId}`, updatedProgress);
      
      setModuleProgress(prev => ({
        ...prev,
        [moduleId]: updatedProgress,
      }));
      
      setSaveMessage({ type: 'success', text: `Module ${moduleId} updated!` });
      onSave?.();
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetStepComplete = async (moduleId, stepId, completed) => {
    const currentSteps = moduleProgress[moduleId]?.completedSteps || [];
    let newSteps;
    
    if (completed) {
      newSteps = [...new Set([...currentSteps, stepId])];
    } else {
      newSteps = currentSteps.filter(s => s !== stepId);
    }

    const updatedProgress = {
      ...moduleProgress[moduleId],
      status: newSteps.length > 0 ? 'in_progress' : 'not_started',
      startedAt: moduleProgress[moduleId]?.startedAt || new Date().toISOString(),
      completedSteps: newSteps,
    };

    setIsSaving(true);
    try {
      await api.put(`/admin/trainees/${trainee.traineeId}/modules/${moduleId}`, updatedProgress);
      
      setModuleProgress(prev => ({
        ...prev,
        [moduleId]: updatedProgress,
      }));
      onSave?.();
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetModule = async (moduleId) => {
    if (!confirm(`Reset all progress for module ${moduleId}?`)) return;

    setIsSaving(true);
    try {
      await api.delete(`/admin/trainees/${trainee.traineeId}/modules/${moduleId}`);
      
      setModuleProgress(prev => {
        const updated = { ...prev };
        delete updated[moduleId];
        return updated;
      });
      
      setSaveMessage({ type: 'success', text: `Module ${moduleId} reset!` });
      onSave?.();
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetQuizScore = async (moduleId, score) => {
    const updatedProgress = {
      ...moduleProgress[moduleId],
      knowledgeCheckScore: score,
    };

    setIsSaving(true);
    try {
      await api.put(`/admin/trainees/${trainee.traineeId}/modules/${moduleId}`, updatedProgress);
      
      setModuleProgress(prev => ({
        ...prev,
        [moduleId]: updatedProgress,
      }));
      onSave?.();
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!trainee) return null;

  return (
    <div className="trainee-editor-overlay">
      <div className="trainee-editor">
        <div className="trainee-editor-header">
          <div className="trainee-editor-title">
            <div className="trainee-editor-avatar">
              {(trainee.traineeName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2>{trainee.traineeName || 'Unknown'}</h2>
              <p className="trainee-editor-id">ID: {trainee.traineeId}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}

        <div className="trainee-editor-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            🔐 Password
          </button>
          <button 
            className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📊 Progress
          </button>
        </div>

        <div className="trainee-editor-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h4 className="section-title">Basic Information</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.traineeName}
                    onChange={(e) => handleProfileChange('traineeName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="employee@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.emergencyContact}
                    onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                    placeholder="Name - Phone"
                  />
                </div>
              </div>

              <h4 className="section-title">Employment Details</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Job Role</label>
                  <select
                    className="form-input"
                    value={profileData.jobRole}
                    onChange={(e) => handleProfileChange('jobRole', e.target.value)}
                  >
                    <option value="">Select a role...</option>
                    {JOB_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.department}
                    onChange={(e) => handleProfileChange('department', e.target.value)}
                    placeholder="e.g., Assembly, Quality Control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supervisor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.supervisor}
                    onChange={(e) => handleProfileChange('supervisor', e.target.value)}
                    placeholder="Supervisor name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hire Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={profileData.hireDate}
                    onChange={(e) => handleProfileChange('hireDate', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cart Type Assignment</label>
                  <select
                    className="form-input"
                    value={profileData.cartType}
                    onChange={(e) => handleProfileChange('cartType', e.target.value)}
                  >
                    <option value="electric-standard">Electric Standard</option>
                    <option value="electric-premium">Electric Premium</option>
                    <option value="gas-standard">Gas Standard</option>
                  </select>
                </div>
              </div>

              <h4 className="section-title">🏆 Certifications</h4>
              <div className="certifications-section">
                <div className="current-certifications">
                  {profileData.certifications.length === 0 ? (
                    <p className="no-certs">No certifications recorded</p>
                  ) : (
                    <div className="cert-list">
                      {profileData.certifications.map((cert, index) => {
                        const certInfo = AVAILABLE_CERTIFICATIONS.find(c => c.id === cert.id) || {};
                        const isExpired = cert.expiresDate && new Date(cert.expiresDate) < new Date();
                        const isExpiringSoon = cert.expiresDate && !isExpired && 
                          new Date(cert.expiresDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        
                        return (
                          <div key={index} className={`cert-item ${isExpired ? 'expired' : ''} ${isExpiringSoon ? 'expiring-soon' : ''}`}>
                            <span className="cert-icon">{certInfo.icon || '📜'}</span>
                            <div className="cert-details">
                              <span className="cert-name">{cert.name || certInfo.name}</span>
                              <div className="cert-dates">
                                {cert.earnedDate && (
                                  <span className="cert-earned">Earned: {new Date(cert.earnedDate).toLocaleDateString()}</span>
                                )}
                                {cert.expiresDate && (
                                  <span className={`cert-expires ${isExpired ? 'expired' : ''}`}>
                                    {isExpired ? 'Expired: ' : 'Expires: '}
                                    {new Date(cert.expiresDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              className="remove-cert-btn"
                              onClick={() => {
                                const newCerts = profileData.certifications.filter((_, i) => i !== index);
                                handleProfileChange('certifications', newCerts);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="add-certification">
                  <h5>Add Certification</h5>
                  <div className="add-cert-form">
                    <select
                      className="form-input"
                      value={newCertification.id}
                      onChange={(e) => {
                        const selected = AVAILABLE_CERTIFICATIONS.find(c => c.id === e.target.value);
                        setNewCertification(prev => ({
                          ...prev,
                          id: e.target.value,
                          name: selected?.name || '',
                        }));
                      }}
                    >
                      <option value="">Select certification...</option>
                      {AVAILABLE_CERTIFICATIONS.filter(
                        c => !profileData.certifications.some(pc => pc.id === c.id)
                      ).map(cert => (
                        <option key={cert.id} value={cert.id}>{cert.icon} {cert.name}</option>
                      ))}
                      <option value="custom">📝 Custom Certification</option>
                    </select>
                    
                    {newCertification.id === 'custom' && (
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Certification name"
                        value={newCertification.name}
                        onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                      />
                    )}
                    
                    <div className="cert-date-inputs">
                      <div className="form-group">
                        <label className="form-label-small">Earned Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={newCertification.earnedDate}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, earnedDate: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label-small">Expires Date (optional)</label>
                        <input
                          type="date"
                          className="form-input"
                          value={newCertification.expiresDate}
                          onChange={(e) => setNewCertification(prev => ({ ...prev, expiresDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => {
                        if (newCertification.id && (newCertification.id !== 'custom' || newCertification.name)) {
                          const certToAdd = {
                            id: newCertification.id === 'custom' ? `custom-${Date.now()}` : newCertification.id,
                            name: newCertification.name,
                            earnedDate: newCertification.earnedDate,
                            expiresDate: newCertification.expiresDate,
                          };
                          handleProfileChange('certifications', [...profileData.certifications, certToAdd]);
                          setNewCertification({ id: '', name: '', earnedDate: '', expiresDate: '' });
                        }
                      }}
                      disabled={!newCertification.id || (newCertification.id === 'custom' && !newCertification.name)}
                    >
                      + Add Certification
                    </Button>
                  </div>
                </div>
              </div>

              <h4 className="section-title">Admin Notes</h4>
              <div className="form-group full-width">
                <textarea
                  className="form-input notes-textarea"
                  value={profileData.notes}
                  onChange={(e) => handleProfileChange('notes', e.target.value)}
                  placeholder="Private notes about this employee (only visible to admins)..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <Button variant="primary" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>

              <div className="profile-info-section">
                <h4>Account Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Started Training</span>
                    <span className="info-value">{new Date(trainee.startedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Activity</span>
                    <span className="info-value">{new Date(trainee.lastActivity).toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trainee ID</span>
                    <span className="info-value">{trainee.traineeId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="tab-content">
              <div className="password-reset-section">
                <div className="warning-box">
                  <strong>⚠️ Password Reset</strong>
                  <p>Setting a new password will immediately allow the trainee to log in with the new credentials. They will not be notified automatically.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="form-actions">
                  <Button variant="primary" onClick={handleResetPassword} disabled={isSaving || !newPassword}>
                    {isSaving ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>

                {trainee.passwordResetAt && (
                  <div className="password-history">
                    <p>Last password reset: {new Date(trainee.passwordResetAt).toLocaleString()}</p>
                    {trainee.passwordResetByAdmin && <p className="admin-reset-note">Reset by administrator</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="tab-content progress-tab">
              <div className="progress-overview">
                <h4>Training Progress Overview</h4>
                <div className="progress-bar-large">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.round((Object.values(moduleProgress).filter(m => m.status === 'completed').length / modules.length) * 100)}%` 
                    }}
                  />
                </div>
                <p>{Object.values(moduleProgress).filter(m => m.status === 'completed').length} of {modules.length} modules completed</p>
              </div>

              <div className="module-progress-list">
                {modules.map((module) => {
                  const progress = moduleProgress[module.id] || {};
                  const completedSteps = progress.completedSteps || [];
                  const totalSteps = module.steps?.length || 0;
                  
                  return (
                    <div key={module.id} className="module-progress-item">
                      <div className="module-progress-header">
                        <div className="module-progress-info">
                          <h5>{module.title}</h5>
                          <span className={`status-badge ${progress.status || 'not_started'}`}>
                            {progress.status === 'completed' ? '✓ Completed' : 
                             progress.status === 'in_progress' ? '⏳ In Progress' : 
                             '○ Not Started'}
                          </span>
                        </div>
                        <div className="module-progress-actions">
                          <select
                            className="status-select"
                            value={progress.status || 'not_started'}
                            onChange={(e) => handleSetModuleStatus(module.id, e.target.value)}
                            disabled={isSaving}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <Button 
                            variant="outline" 
                            size="small"
                            onClick={() => handleResetModule(module.id)}
                            disabled={isSaving}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>

                      <div className="module-progress-details">
                        <div className="steps-progress">
                          <div className="steps-header">
                            <span>Steps ({completedSteps.length}/{totalSteps})</span>
                          </div>
                          <div className="steps-grid">
                            {module.steps?.map((step, idx) => (
                              <label key={step.id} className="step-checkbox">
                                <input
                                  type="checkbox"
                                  checked={completedSteps.includes(step.id)}
                                  onChange={(e) => handleSetStepComplete(module.id, step.id, e.target.checked)}
                                  disabled={isSaving}
                                />
                                <span className="step-number">{idx + 1}</span>
                                <span className="step-title">{step.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="quiz-score-section">
                          <label className="form-label">Quiz Score</label>
                          <div className="quiz-score-input">
                            <input
                              type="text"
                              className="form-input"
                              value={progress.knowledgeCheckScore || ''}
                              onChange={(e) => handleModuleProgressChange(module.id, 'knowledgeCheckScore', e.target.value)}
                              placeholder="e.g., 4/5"
                            />
                            <Button 
                              variant="outline" 
                              size="small"
                              onClick={() => handleSetQuizScore(module.id, moduleProgress[module.id]?.knowledgeCheckScore)}
                              disabled={isSaving}
                            >
                              Set
                            </Button>
                          </div>
                        </div>

                        <div className="signoff-section">
                          <label className="signoff-checkbox">
                            <input
                              type="checkbox"
                              checked={progress.supervisorSignoff || false}
                              onChange={(e) => {
                                const updatedProgress = {
                                  ...progress,
                                  supervisorSignoff: e.target.checked,
                                  signoffAt: e.target.checked ? new Date().toISOString() : null,
                                };
                                api.put(`/admin/trainees/${trainee.traineeId}/modules/${module.id}`, updatedProgress)
                                  .then(() => {
                                    setModuleProgress(prev => ({
                                      ...prev,
                                      [module.id]: updatedProgress,
                                    }));
                                    onSave?.();
                                  });
                              }}
                            />
                            <span>Supervisor Sign-off</span>
                          </label>
                          {progress.supervisorSignoff && progress.signoffAt && (
                            <span className="signoff-date">
                              Signed off: {new Date(progress.signoffAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TraineeEditor;
