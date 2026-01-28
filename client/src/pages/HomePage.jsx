import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { getModules, getModule } from '../services/api';
import ModuleCard from '../components/training/ModuleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

function HomePage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumeInfo, setResumeInfo] = useState(null);
  const { trainee, progress, currentPosition } = useTraining();
  const navigate = useNavigate();

  useEffect(() => {
    if (!trainee) {
      navigate('/');
      return;
    }

    loadModules();
  }, [trainee, navigate]);

  // Load resume info when we have a saved position
  useEffect(() => {
    const loadResumeInfo = async () => {
      if (currentPosition?.moduleId) {
        try {
          const response = await getModule(currentPosition.moduleId);
          const module = response.data;
          const step = module.steps.find(s => s.id === currentPosition.stepId);
          setResumeInfo({
            moduleTitle: module.title,
            stepTitle: step?.title || 'Unknown Step',
            stepIndex: currentPosition.stepIndex,
            totalSteps: currentPosition.totalSteps,
            moduleId: currentPosition.moduleId,
            stepId: currentPosition.stepId,
          });
        } catch (error) {
          console.error('Failed to load resume info:', error);
          setResumeInfo(null);
        }
      }
    };

    loadResumeInfo();
  }, [currentPosition]);

  const loadModules = async () => {
    try {
      const response = await getModules();
      setModules(response.data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = () => {
    if (resumeInfo) {
      navigate(`/module/${resumeInfo.moduleId}/step/${resumeInfo.stepId}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  const completedCount = progress?.completedModules?.length || 0;
  const totalModules = modules.length;
  const completionPercentage = (completedCount / totalModules) * 100;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Electric Golf Cart Assembly Training
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
          Complete all modules to become certified in golf cart assembly
        </p>
      </div>

      {/* Resume Training Banner */}
      {resumeInfo && (
        <div className="resume-banner">
          <div className="resume-banner-content">
            <div className="resume-banner-icon">▶️</div>
            <div className="resume-banner-info">
              <span className="resume-banner-label">Continue where you left off</span>
              <span className="resume-banner-title">{resumeInfo.moduleTitle}</span>
              <span className="resume-banner-step">
                Step {resumeInfo.stepIndex + 1} of {resumeInfo.totalSteps}: {resumeInfo.stepTitle}
              </span>
            </div>
          </div>
          <Button variant="primary" onClick={handleResume}>
            Resume Training →
          </Button>
        </div>
      )}

      {/* Overall Progress */}
      <div style={{ 
        backgroundColor: 'var(--surface-color)', 
        padding: '2rem', 
        borderRadius: '0.75rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Your Progress</h2>
        <div className="progress-bar" style={{ height: '12px' }}>
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
          {completedCount} of {totalModules} modules completed ({completionPercentage.toFixed(0)}%)
        </p>
      </div>

      {/* Module Grid */}
      <h2 style={{ marginBottom: '1.5rem' }}>Training Modules</h2>
      <div className="module-grid">
        {modules.map((module) => (
          <ModuleCard 
            key={module.id} 
            module={module} 
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
