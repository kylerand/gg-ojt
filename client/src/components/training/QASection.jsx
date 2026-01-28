import { useState, useEffect } from 'react';
import Button from '../common/Button';

function QASection({ moduleId, stepId, stepTitle, traineeId, traineeName }) {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, mine, answered

  const storageKey = `qa-${moduleId}`;

  // Load questions from localStorage (simulating backend)
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setQuestions(JSON.parse(stored));
    }
  }, [storageKey]);

  const saveQuestions = (updatedQuestions) => {
    setQuestions(updatedQuestions);
    localStorage.setItem(storageKey, JSON.stringify(updatedQuestions));
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setIsSubmitting(true);

    const question = {
      id: Date.now().toString(),
      stepId,
      stepTitle,
      traineeId,
      traineeName,
      question: newQuestion.trim(),
      timestamp: new Date().toISOString(),
      upvotes: 0,
      upvotedBy: [],
      answers: [],
      status: 'pending'
    };

    const updatedQuestions = [question, ...questions];
    saveQuestions(updatedQuestions);
    setNewQuestion('');
    setIsSubmitting(false);
  };

  const handleUpvote = (questionId) => {
    const updatedQuestions = questions.map(q => {
      if (q.id === questionId) {
        const hasUpvoted = q.upvotedBy?.includes(traineeId);
        return {
          ...q,
          upvotes: hasUpvoted ? q.upvotes - 1 : q.upvotes + 1,
          upvotedBy: hasUpvoted 
            ? q.upvotedBy.filter(id => id !== traineeId)
            : [...(q.upvotedBy || []), traineeId]
        };
      }
      return q;
    });
    saveQuestions(updatedQuestions);
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'mine') return q.traineeId === traineeId;
    if (filter === 'answered') return q.answers.length > 0;
    if (filter === 'step') return q.stepId === stepId;
    return true;
  });

  const stepQuestions = questions.filter(q => q.stepId === stepId);
  const myQuestions = questions.filter(q => q.traineeId === traineeId);

  return (
    <div className={`qa-section ${isExpanded ? 'qa-section-expanded' : ''}`}>
      <div 
        className="qa-section-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="qa-section-title">
          <span className="qa-icon">💬</span>
          <h4>Q&A Discussion</h4>
          {questions.length > 0 && (
            <span className="qa-badge">{questions.length}</span>
          )}
        </div>
        <button className="qa-toggle">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="qa-section-content">
          {/* Ask Question Form */}
          <form className="qa-form" onSubmit={handleSubmitQuestion}>
            <textarea
              className="qa-textarea"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask a question about this step... Your supervisor or admin will respond."
              rows={3}
            />
            <div className="qa-form-footer">
              <span className="qa-form-hint">
                Questions are reviewed by supervisors
              </span>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={!newQuestion.trim() || isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Ask Question'}
              </Button>
            </div>
          </form>

          {/* Filter Tabs */}
          <div className="qa-filters">
            <button 
              className={`qa-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({questions.length})
            </button>
            <button 
              className={`qa-filter-btn ${filter === 'step' ? 'active' : ''}`}
              onClick={() => setFilter('step')}
            >
              This Step ({stepQuestions.length})
            </button>
            <button 
              className={`qa-filter-btn ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => setFilter('mine')}
            >
              My Questions ({myQuestions.length})
            </button>
            <button 
              className={`qa-filter-btn ${filter === 'answered' ? 'active' : ''}`}
              onClick={() => setFilter('answered')}
            >
              Answered
            </button>
          </div>

          {/* Questions List */}
          <div className="qa-questions-list">
            {filteredQuestions.length === 0 ? (
              <div className="qa-empty">
                <p>No questions yet. Be the first to ask!</p>
              </div>
            ) : (
              filteredQuestions.map(q => (
                <div key={q.id} className="qa-question-item">
                  <div className="qa-question-votes">
                    <button 
                      className={`qa-upvote-btn ${q.upvotedBy?.includes(traineeId) ? 'upvoted' : ''}`}
                      onClick={() => handleUpvote(q.id)}
                    >
                      ▲
                    </button>
                    <span className="qa-vote-count">{q.upvotes}</span>
                  </div>
                  <div className="qa-question-content">
                    <div className="qa-question-header">
                      <span className="qa-question-step">📍 {q.stepTitle}</span>
                      <span className="qa-question-time">
                        {new Date(q.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="qa-question-text">{q.question}</p>
                    <div className="qa-question-meta">
                      <span className="qa-question-author">
                        Asked by {q.traineeName}
                      </span>
                      <span className={`qa-question-status qa-status-${q.status}`}>
                        {q.status === 'answered' ? '✓ Answered' : '⏳ Pending'}
                      </span>
                    </div>
                    
                    {/* Answers */}
                    {q.answers.length > 0 && (
                      <div className="qa-answers">
                        {q.answers.map((answer, idx) => (
                          <div key={idx} className="qa-answer-item">
                            <span className="qa-answer-icon">💡</span>
                            <div className="qa-answer-content">
                              <p>{answer.text}</p>
                              <span className="qa-answer-author">
                                — {answer.author} ({answer.role})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QASection;
