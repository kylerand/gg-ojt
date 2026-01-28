import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import Button from '../common/Button';

function NotesPanel({ moduleId, stepId, traineeId, onSave }) {
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const noteKey = `${moduleId}-${stepId}`;

  // Load notes from localStorage on mount
  useEffect(() => {
    const storedNotes = localStorage.getItem(`notes-${traineeId}`);
    if (storedNotes) {
      const parsed = JSON.parse(storedNotes);
      setSavedNotes(parsed);
      setNotes(parsed[noteKey] || '');
    }
  }, [traineeId, noteKey]);

  // Auto-save after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== (savedNotes[noteKey] || '')) {
        handleSave();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes]);

  const handleSave = () => {
    setIsSaving(true);
    const updatedNotes = { ...savedNotes, [noteKey]: notes };
    setSavedNotes(updatedNotes);
    localStorage.setItem(`notes-${traineeId}`, JSON.stringify(updatedNotes));
    setLastSaved(new Date());
    setIsSaving(false);
    if (onSave) onSave(notes);
  };

  const handleExportNotes = async () => {
    const notesEntries = Object.entries(savedNotes).filter(([key, value]) => value.trim());
    
    if (notesEntries.length === 0) {
      alert('No notes to export');
      return;
    }

    // Build document sections
    const children = [
      new Paragraph({
        text: 'My Training Notes',
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Exported on ${new Date().toLocaleDateString()}`,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: `Exported on ${new Date().toLocaleDateString()}`,
            italics: true,
            color: '666666',
          }),
        ],
      }),
    ];

    notesEntries.forEach(([key, value], index) => {
      // Add section header (module-step)
      const [modId, stpId] = key.split('-');
      children.push(
        new Paragraph({
          text: `Module ${modId} - Step ${stpId}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      // Add note content - split by lines
      value.split('\n').forEach(line => {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 120 },
          })
        );
      });

      // Add separator between sections (except last)
      if (index < notesEntries.length - 1) {
        children.push(
          new Paragraph({
            text: '',
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
            },
            spacing: { before: 200, after: 200 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `training-notes-${new Date().toISOString().split('T')[0]}.docx`);
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className={`notes-panel ${isExpanded ? 'notes-panel-expanded' : ''}`}>
      <div 
        className="notes-panel-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="notes-panel-title">
          <span className="notes-icon">📝</span>
          <h4>My Notes</h4>
          {notes.trim() && <span className="notes-badge">{wordCount} words</span>}
        </div>
        <button className="notes-toggle">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="notes-panel-content">
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your personal notes for this step... 

Tips:
• Key takeaways
• Questions to ask supervisor
• Things to remember"
            rows={6}
          />
          
          <div className="notes-panel-footer">
            <div className="notes-status">
              {isSaving ? (
                <span className="notes-saving">Saving...</span>
              ) : lastSaved ? (
                <span className="notes-saved">
                  ✓ Saved {lastSaved.toLocaleTimeString()}
                </span>
              ) : null}
            </div>
            <div className="notes-actions">
              <button 
                className="notes-action-btn"
                onClick={handleExportNotes}
                title="Export all notes"
              >
                📥 Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotesPanel;
