import Button from '../common/Button';

function StepNavigation({ 
  onPrevious, 
  onNext, 
  canGoNext, 
  canGoPrevious, 
  isLastStep,
  nextLabel = 'Next Step' 
}) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      marginTop: '2rem',
      paddingTop: '2rem',
      borderTop: '1px solid var(--border-color)'
    }}>
      <Button 
        variant="outline" 
        onClick={onPrevious}
        disabled={!canGoPrevious}
      >
        ← Previous
      </Button>
      <Button 
        variant="primary" 
        onClick={onNext}
        disabled={!canGoNext}
      >
        {isLastStep ? 'Complete Module →' : `${nextLabel} →`}
      </Button>
    </div>
  );
}

export default StepNavigation;
