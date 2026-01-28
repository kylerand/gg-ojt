import { useState } from 'react';
import Button from '../common/Button';

function KnowledgeCheckEditor({ question, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    id: question.id || `q-${Date.now()}`,
    question: question.question || '',
    options: question.options || ['', '', '', ''],
    correctAnswer: question.correctAnswer || 0,
    explanation: question.explanation || '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, ''],
      }));
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions,
        correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer,
      }));
    }
  };

  const handleSave = () => {
    if (!formData.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    const filledOptions = formData.options.filter(o => o.trim());
    if (filledOptions.length < 2) {
      alert('Please enter at least 2 answer options');
      return;
    }

    onSave({
      ...formData,
      options: formData.options.filter(o => o.trim()),
    });
  };

  return (
    <div className="question-editor">
      <div className="question-editor-header">
        <h4>Edit Question</h4>
        <div className="question-editor-actions">
          <Button variant="outline" size="small" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" size="small" onClick={handleSave}>Save Question</Button>
        </div>
      </div>

      <div className="question-editor-form">
        <div className="form-group">
          <label className="form-label">Question *</label>
          <textarea
            className="form-input"
            rows={2}
            value={formData.question}
            onChange={(e) => handleChange('question', e.target.value)}
            placeholder="Enter your question..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Answer Options *</label>
          <div className="options-list">
            {formData.options.map((option, index) => (
              <div key={index} className="option-row">
                <label className="option-radio">
                  <input
                    type="radio"
                    name={`correct-${formData.id}`}
                    checked={formData.correctAnswer === index}
                    onChange={() => handleChange('correctAnswer', index)}
                  />
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                />
                {formData.options.length > 2 && (
                  <button 
                    className="remove-option-btn"
                    onClick={() => removeOption(index)}
                    title="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {formData.options.length < 6 && (
            <Button variant="outline" size="small" onClick={addOption}>
              + Add Option
            </Button>
          )}
          <small className="form-help">
            Select the radio button next to the correct answer
          </small>
        </div>

        <div className="form-group">
          <label className="form-label">Explanation (shown after answering)</label>
          <textarea
            className="form-input"
            rows={2}
            value={formData.explanation}
            onChange={(e) => handleChange('explanation', e.target.value)}
            placeholder="Explain why the correct answer is right..."
          />
        </div>
      </div>
    </div>
  );
}

export default KnowledgeCheckEditor;
