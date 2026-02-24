import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTraining } from '../context/TrainingContext';
import { useAuth } from '../context/AuthContext';
import { getModules, getModule, getLearningPaths } from '../services/api';
import LearningPathCard from '../components/training/LearningPathCard';
import ModuleCard from '../components/training/ModuleCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';

function HomePage() {
  const [modules, setModules] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumeInfo, setResumeInfo] = useState(null);
  const { trainee, progress, currentPosition, isInitialized, loadProgress } = useTraining();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load progress if we're authenticated but don't have trainee yet
  useEffect(() => {
    if (isAuthenticated && user && !trainee && isInitialized) {
      loadProgress(user.employeeId);
    }
  }, [isAuthenticated, user, trainee, isInitialized, loadProgress]);

  useEffect(() => {
    // Wait for auth to be ready
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Only load modules once we have trainee data or auth is confirmed
    if (trainee || user) {
      loadData();
    }
  }, [trainee, user, isAuthenticated, navigate]);

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

  const loadData = async () => {
    try {
      const [modulesRes, pathsRes] = await Promise.all([
        getModules(),
        getLearningPaths().catch(() => ({ data: [] })),
      ]);
      setModules(modulesRes.data);
      setLearningPaths(pathsRes.data);
    } catch (error) {
      console.error('Failed to load training data:', error);
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

  // Compute set of module IDs that belong to at least one learning path
  const pathModuleIds = new Set(
    learningPaths.flatMap(p => p.modules?.map(m => m.id) ?? [])
  );

  // Modules not yet assigned to any path
  const unassignedModules = modules.filter(m => !pathModuleIds.has(m.id));

  // Use step-based completion from backend if available
  const completionPercentage = progress?.completionPercentage ?? 
    ((progress?.completedModules?.length || 0) / (modules.length || 1)) * 100;
  
  const totalModules = progress?.totalModules || modules.length;
  const completedModulesCount = progress?.completedModulesCount ?? progress?.completedModules?.length ?? 0;
  const totalSteps = progress?.totalSteps;
  const completedStepsCount = progress?.completedStepsCount;

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
        <p style={{ marginTop: '0.75rem', fontWeight: '600' }}>
          {completionPercentage.toFixed(0)}% Complete
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {totalSteps !== undefined 
            ? `${completedStepsCount}/${totalSteps} steps • ${completedModulesCount}/${totalModules} modules`
            : `${completedModulesCount} of ${totalModules} modules completed`
          }
        </p>
      </div>

      {/* Learning Paths */}
      {learningPaths.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Learning Paths</h2>
          <div className="learning-paths-list">
            {learningPaths.map(path => (
              <LearningPathCard
                key={path.id}
                path={path}
                progress={progress}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unassigned / standalone modules */}
      {unassignedModules.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {learningPaths.length > 0 ? 'Additional Modules' : 'Training Modules'}
          </h2>
          <div className="module-grid">
            {unassignedModules.map((module) => (
              <ModuleCard 
                key={module.id} 
                module={module} 
                progress={progress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
