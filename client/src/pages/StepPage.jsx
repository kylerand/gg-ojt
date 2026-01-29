import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModule, updateStepProgress, completeModule as completeModuleAPI } from '../services/api';
import { useTraining } from '../context/TrainingContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import VideoPlayer from '../components/training/VideoPlayer';
import SafetyWarning from '../components/training/SafetyWarning';
import StepNavigation from '../components/training/StepNavigation';
import QuizQuestion from '../components/quiz/QuizQuestion';
import QuizResults from '../components/quiz/QuizResults';
import ProgressBar from '../components/training/ProgressBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ModuleSidebar from '../components/training/ModuleSidebar';
import NotesPanel from '../components/training/NotesPanel';
import QASection from '../components/training/QASection';
import BookmarkButton from '../components/training/BookmarkButton';
import ResourcesPanel from '../components/training/ResourcesPanel';

function StepPage() {
  const { moduleId, stepId } = useParams();
  const [module, setModule] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [stepConfirmed, setStepConfirmed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { trainee, progress, updateProgress, savePosition, isInitialized, loadProgress } = useTraining();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Load progress if we're authenticated but don't have trainee yet
  useEffect(() => {
    if (isAuthenticated && user && !trainee && isInitialized) {
      loadProgress(user.employeeId);
    }
  }, [isAuthenticated, user, trainee, isInitialized, loadProgress]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    // Only load module once we have trainee data or auth is confirmed
    if (trainee || user) {
      loadModule();
    }
  }, [moduleId, trainee, user, isAuthenticated, navigate]);

  useEffect(() => {
    if (module) {
      const stepIndex = module.steps.findIndex(s => s.id === stepId);
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex);
        resetStepState();
        
        // Save current position for resume functionality
        savePosition(moduleId, stepId, stepIndex, module.steps.length);
      }
    }
  }, [stepId, module]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Re-sync with URL when user navigates with browser buttons
      const pathParts = window.location.pathname.split('/');
      const urlStepId = pathParts[pathParts.length - 1];
      if (module && urlStepId !== stepId) {
        const stepIndex = module.steps.findIndex(s => s.id === urlStepId);
        if (stepIndex >= 0) {
          setCurrentStepIndex(stepIndex);
          resetStepState();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [module, stepId]);

  const loadModule = async (retryCount = 0) => {
    setLoadError(null);
    try {
      const response = await getModule(moduleId);
      setModule(response.data);
    } catch (error) {
      console.error('Failed to load module:', error);
      if (retryCount < 2) {
        // Retry up to 2 times with exponential backoff
        setTimeout(() => loadModule(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setLoadError('Failed to load module. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetStepState = () => {
    setVideoCompleted(false);
    setSafetyAcknowledged(false);
    setStepConfirmed(false);
  };

  if (loading) return <LoadingSpinner />;
  
  if (loadError) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <Card>
          <h2>⚠️ Connection Issue</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {loadError}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Button variant="primary" onClick={() => { setLoading(true); loadModule(); }}>
              🔄 Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/home')}>
              ← Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!module) return <div>Module not found</div>;

  const currentStep = module.steps[currentStepIndex];
  if (!currentStep) return <div>Step not found</div>;

  const isLastStep = currentStepIndex === module.steps.length - 1;
  const hasSafetyWarnings = currentStep.safetyWarnings && currentStep.safetyWarnings.length > 0;
  const requiresVideo = currentStep.requiresVideoCompletion;
  const requiresConfirmation = currentStep.requiresConfirmation;

  const canProceed = 
    (!requiresVideo || videoCompleted) &&
    (!hasSafetyWarnings || safetyAcknowledged) &&
    (!requiresConfirmation || stepConfirmed);

  const handleVideoEnded = () => {
    setVideoCompleted(true);
  };

  const handleNextStep = async () => {
    // Mark step as completed
    try {
      const response = await updateStepProgress(trainee.id, {
        moduleId,
        stepId: currentStep.id,
        completed: true,
        stepData: {
          confirmed: stepConfirmed,
          videoCompleted: videoCompleted,
          safetyAcknowledged: safetyAcknowledged,
        },
      });
      updateProgress(response.data);

      // If last step, show quiz
      if (isLastStep) {
        setShowQuiz(true);
      } else {
        // Navigate to next step
        const nextStep = module.steps[currentStepIndex + 1];
        navigate(`/module/${moduleId}/step/${nextStep.id}`);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = module.steps[currentStepIndex - 1];
      navigate(`/module/${moduleId}/step/${prevStep.id}`);
    }
  };

  const handleQuizAnswer = (isCorrect, answerIndex) => {
    const newAnswers = [...quizAnswers];
    newAnswers[quizAnswers.length] = isCorrect ? 1 : 0;
    setQuizAnswers(newAnswers);
  };

  const handleQuizComplete = async () => {
    const score = quizAnswers.reduce((sum, a) => sum + a, 0);
    const total = module.knowledgeChecks.length;
    const percentage = (score / total) * 100;

    if (percentage >= 80) {
      // Complete module
      try {
        const response = await completeModuleAPI(trainee.id, {
          moduleId,
          knowledgeCheckScore: `${score}/${total} (${percentage.toFixed(0)}%)`,
        });
        updateProgress(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Failed to complete module:', error);
      }
    } else {
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setQuizAnswers([]);
    setShowResults(false);
    setShowQuiz(false);
    navigate(`/module/${moduleId}/step/${module.steps[0].id}`);
  };

  const handleContinue = () => {
    navigate('/home');
  };

  // Quiz view
  if (showQuiz) {
    if (showResults) {
      const score = quizAnswers.reduce((sum, a) => sum + a, 0);
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card>
            <QuizResults
              score={score}
              total={module.knowledgeChecks.length}
              onRetry={handleRetry}
              onContinue={handleContinue}
            />
          </Card>
        </div>
      );
    }

    const currentQuestionIndex = quizAnswers.length;
    const currentQuestion = module.knowledgeChecks[currentQuestionIndex];

    if (!currentQuestion) {
      // All questions answered
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card>
            <h2>Knowledge Check Complete</h2>
            <p>You've answered all questions. Click below to see your results.</p>
            <Button variant="primary" size="large" onClick={handleQuizComplete}>
              View Results
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <h2 style={{ marginBottom: '1rem' }}>Knowledge Check</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Question {currentQuestionIndex + 1} of {module.knowledgeChecks.length}
          </p>
          <QuizQuestion
            question={currentQuestion}
            onAnswer={handleQuizAnswer}
          />
        </Card>
      </div>
    );
  }

  // Step view
  const moduleProgress = progress?.moduleProgress?.[moduleId];

  return (
    <div className={`step-page-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <ModuleSidebar
        module={module}
        currentStepId={currentStep.id}
        moduleProgress={moduleProgress}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="step-page-main">
        <Button
          variant="outline"
          onClick={() => navigate(`/module/${moduleId}`)}
          style={{ marginBottom: '1rem' }}
        >
          ← Back to Module Overview
        </Button>

        <Card>
          <div style={{ marginBottom: '2rem' }}>
            <ProgressBar current={currentStepIndex + 1} total={module.steps.length} />
          </div>

          {/* Step Header with Actions */}
          <div className="step-header-actions">
            <BookmarkButton
              moduleId={moduleId}
              stepId={currentStep.id}
              stepTitle={currentStep.title}
              traineeId={trainee.id}
            />
          </div>

          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            {currentStep.title}
          </h1>

          {/* Video */}
          {currentStep.videoUrl && (
            <VideoPlayer
              url={currentStep.videoUrl}
              onEnded={handleVideoEnded}
            />
          )}

          {requiresVideo && !videoCompleted && (
            <p style={{ color: 'var(--warning-color)', marginTop: '1rem' }}>
              ⏯️ Please watch the video to continue
            </p>
          )}

          {/* Instructions */}
          <div style={{ marginTop: '2rem' }}>
            <h3>Instructions</h3>
            <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', marginTop: '1rem' }}>
              {currentStep.instructions}
            </p>
          </div>

          {/* Resources Panel (replaces inline tools/materials) */}
          <ResourcesPanel step={currentStep} />

        {/* Safety Warnings */}
        {hasSafetyWarnings && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Safety Information</h3>
            {currentStep.safetyWarnings.map((warning, index) => (
              <SafetyWarning key={index} warning={warning} />
            ))}
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={safetyAcknowledged}
                  onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 'bold' }}>
                  I have read and understood all safety warnings
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Common Mistakes */}
        {currentStep.commonMistakes?.length > 0 && (
          <div style={{ 
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            borderRadius: '0.5rem',
            borderLeft: '4px solid var(--warning-color)'
          }}>
            <h4>⚡ Common Mistakes to Avoid</h4>
            <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              {currentStep.commonMistakes.map((mistake, index) => (
                <li key={index}>{mistake}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Why It Matters */}
        {currentStep.whyItMatters && (
          <details style={{ 
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.5rem'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              💡 Why This Matters
            </summary>
            <p style={{ marginTop: '1rem', lineHeight: '1.8' }}>
              {currentStep.whyItMatters}
            </p>
          </details>
        )}

        {/* Step Confirmation */}
        {requiresConfirmation && (
          <div style={{ 
            marginTop: '2rem',
            padding: '1.5rem',
            border: '2px solid var(--primary-color)',
            borderRadius: '0.5rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={stepConfirmed}
                onChange={(e) => setStepConfirmed(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ fontWeight: 'bold' }}>
                I have completed this step as instructed
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <StepNavigation
          onPrevious={handlePreviousStep}
          onNext={handleNextStep}
          canGoPrevious={currentStepIndex > 0}
          canGoNext={canProceed}
          isLastStep={isLastStep}
          nextLabel={isLastStep ? 'Complete & Take Quiz' : 'Next Step'}
        />
      </Card>

      {/* Notes Panel */}
      <NotesPanel
        moduleId={moduleId}
        stepId={currentStep.id}
        traineeId={trainee.id}
      />

      {/* Q&A Section */}
      <QASection
        moduleId={moduleId}
        stepId={currentStep.id}
        stepTitle={currentStep.title}
        traineeId={trainee.id}
        traineeName={trainee.name}
      />
      </div>
    </div>
  );
}

export default StepPage;
