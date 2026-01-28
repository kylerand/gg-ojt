import Button from '../common/Button';

function QuizResults({ score, total, onRetry, onContinue }) {
  const percentage = (score / total) * 100;
  const passed = percentage >= 80;

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        {passed ? '🎉 Module Complete!' : '📚 Keep Learning'}
      </h2>
      
      <div style={{ 
        fontSize: '3rem', 
        fontWeight: 'bold',
        color: passed ? 'var(--secondary-color)' : 'var(--danger-color)',
        margin: '2rem 0'
      }}>
        {score} / {total}
      </div>
      
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
        You scored {percentage.toFixed(0)}%
      </p>

      {passed ? (
        <>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Great job! You've successfully completed this module.
          </p>
          <Button variant="primary" size="large" onClick={onContinue}>
            Continue to Next Module
          </Button>
        </>
      ) : (
        <>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            You need at least 80% to pass. Review the material and try again.
          </p>
          <Button variant="primary" size="large" onClick={onRetry}>
            Review and Retry
          </Button>
        </>
      )}
    </div>
  );
}

export default QuizResults;
