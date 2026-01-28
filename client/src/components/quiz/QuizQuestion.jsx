import { useState } from 'react';
import Button from '../common/Button';

function QuizQuestion({ question, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct, selectedAnswer);
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>{question.question}</h3>
      
      <div>
        {question.options.map((option, index) => (
          <div
            key={index}
            className={`quiz-option ${
              selectedAnswer === index ? 'selected' : ''
            } ${
              submitted && index === question.correctAnswer ? 'correct' : ''
            } ${
              submitted && selectedAnswer === index && !isCorrect ? 'incorrect' : ''
            }`}
            onClick={() => !submitted && setSelectedAnswer(index)}
          >
            {option}
          </div>
        ))}
      </div>

      {submitted && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: isCorrect ? '#d1fae5' : '#fee2e2',
          borderRadius: '0.5rem'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          <p>{question.explanation}</p>
          {!isCorrect && (
            <Button variant="primary" onClick={handleTryAgain} style={{ marginTop: '1rem' }}>
              Try Again
            </Button>
          )}
        </div>
      )}

      {!submitted && (
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          style={{ marginTop: '1rem' }}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );
}

export default QuizQuestion;
