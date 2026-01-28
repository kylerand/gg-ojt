import { useState, useEffect } from 'react';
import Button from '../common/Button';

function QAManagement() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load all Q&A from localStorage (simulating backend)
  useEffect(() => {
    loadAllQuestions();
  }, []);

  const loadAllQuestions = () => {
    const allQuestions = [];
    // Get all module Q&A from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('qa-')) {
        const moduleQuestions = JSON.parse(localStorage.getItem(key));
        const moduleId = key.replace('qa-', '');
        moduleQuestions.forEach(q => {
          allQuestions.push({ ...q, moduleId });
        });
      }
    }
    // Sort by newest first
    allQuestions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setQuestions(allQuestions);
  };

  const handleReply = (questionId, moduleId) => {
    if (!replyText.trim()) return;

    const storageKey = `qa-${moduleId}`;
    const moduleQuestions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const updatedQuestions = moduleQuestions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          status: 'answered',
          answers: [
            ...q.answers,
            {
              text: replyText,
              author: 'Admin',
              role: 'Administrator',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return q;
    });

    localStorage.setItem(storageKey, JSON.stringify(updatedQuestions));
    setReplyingTo(null);
    setReplyText('');
    loadAllQuestions();
  };

  const handleDelete = (questionId, moduleId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const storageKey = `qa-${moduleId}`;
    const moduleQuestions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedQuestions = moduleQuestions.filter(q => q.id !== questionId);
    localStorage.setItem(storageKey, JSON.stringify(updatedQuestions));
    loadAllQuestions();
  };

  const handleMarkResolved = (questionId, moduleId) => {
    const storageKey = `qa-${moduleId}`;
    const moduleQuestions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const updatedQuestions = moduleQuestions.map(q => {
      if (q.id === questionId) {
        return { ...q, status: 'answered' };
      }
      return q;
    });

    localStorage.setItem(storageKey, JSON.stringify(updatedQuestions));
    loadAllQuestions();
  };

  const filteredQuestions = questions.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesSearch = !searchQuery || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.traineeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.stepTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const answeredCount = questions.filter(q => q.status === 'answered').length;

  return (
    <div className="qa-management">
      <div className="qa-management-header">
        <h2>Q&A Management</h2>
        <div className="qa-stats">
          <span className="qa-stat pending">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </span>
          <span className="qa-stat answered">
            <span className="stat-number">{answeredCount}</span>
            <span className="stat-label">Answered</span>
          </span>
        </div>
      </div>

      <div className="qa-management-controls">
        <div className="qa-search">
          <input
            type="text"
            placeholder="Search questions, trainees, or steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="qa-search-input"
          />
        </div>
        <div className="qa-filter-tabs">
          <button 
            className={`qa-filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pending ({pendingCount})
          </button>
          <button 
            className={`qa-filter-tab ${filter === 'answered' ? 'active' : ''}`}
            onClick={() => setFilter('answered')}
          >
            ✓ Answered ({answeredCount})
          </button>
          <button 
            className={`qa-filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({questions.length})
          </button>
        </div>
      </div>

      <div className="qa-questions-admin-list">
        {filteredQuestions.length === 0 ? (
          <div className="qa-empty-state">
            <span className="qa-empty-icon">💬</span>
            <p>No questions found</p>
          </div>
        ) : (
          filteredQuestions.map(q => (
            <div key={q.id} className={`qa-admin-item ${q.status}`}>
              <div className="qa-admin-item-header">
                <div className="qa-admin-meta">
                  <span className="qa-admin-trainee">👤 {q.traineeName}</span>
                  <span className="qa-admin-module">📚 {q.moduleId}</span>
                  <span className="qa-admin-step">📍 {q.stepTitle}</span>
                </div>
                <div className="qa-admin-time">
                  {new Date(q.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="qa-admin-question">
                <p>{q.question}</p>
                <div className="qa-admin-votes">
                  👍 {q.upvotes} upvotes
                </div>
              </div>

              {/* Existing Answers */}
              {q.answers.length > 0 && (
                <div className="qa-admin-answers">
                  {q.answers.map((answer, idx) => (
                    <div key={idx} className="qa-admin-answer">
                      <div className="qa-answer-header">
                        <span className="qa-answer-author">
                          💡 {answer.author} ({answer.role})
                        </span>
                        <span className="qa-answer-time">
                          {new Date(answer.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p>{answer.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === q.id ? (
                <div className="qa-reply-form">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your answer..."
                    rows={3}
                    className="qa-reply-textarea"
                  />
                  <div className="qa-reply-actions">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handleReply(q.id, q.moduleId)}
                      disabled={!replyText.trim()}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="qa-admin-actions">
                  <Button 
                    variant="primary"
                    onClick={() => setReplyingTo(q.id)}
                  >
                    Reply
                  </Button>
                  {q.status === 'pending' && (
                    <Button 
                      variant="outline"
                      onClick={() => handleMarkResolved(q.id, q.moduleId)}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  <Button 
                    variant="danger"
                    onClick={() => handleDelete(q.id, q.moduleId)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default QAManagement;
