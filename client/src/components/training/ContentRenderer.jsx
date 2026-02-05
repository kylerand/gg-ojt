import { useMemo } from 'react';

/**
 * ContentRenderer - Renders step content with rich formatting
 * 
 * Supports:
 * - **bold text**
 * - *italic text*
 * - Bullet lists (lines starting with - or •)
 * - Numbered lists (lines starting with 1. 2. etc)
 * - > Blockquotes
 * - [TIP] Tip callouts
 * - [NOTE] Note callouts
 * - [IMPORTANT] Important callouts
 * - --- Horizontal dividers
 */

function ContentRenderer({ content, showReadingTime = true }) {
  const { renderedContent, readingTime } = useMemo(() => {
    if (!content) return { renderedContent: null, readingTime: 0 };

    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);

    const lines = content.split('\n');
    const elements = [];
    let currentList = null;
    let currentListType = null;
    let keyIndex = 0;

    const processInlineFormatting = (text) => {
      // Process bold and italic
      let processed = text;
      const parts = [];
      let lastIndex = 0;
      
      // Match **bold** and *italic*
      const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        
        // Add formatted text
        if (match[2]) {
          // Bold
          parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
        } else if (match[3]) {
          // Italic
          parts.push(<em key={`i-${match.index}`}>{match[3]}</em>);
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : text;
    };

    const flushList = () => {
      if (currentList && currentList.length > 0) {
        if (currentListType === 'ordered') {
          elements.push(
            <ol key={`ol-${keyIndex++}`} className="content-list ordered">
              {currentList.map((item, i) => (
                <li key={i}>{processInlineFormatting(item)}</li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${keyIndex++}`} className="content-list unordered">
              {currentList.map((item, i) => (
                <li key={i}>{processInlineFormatting(item)}</li>
              ))}
            </ul>
          );
        }
        currentList = null;
        currentListType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Empty line
      if (!trimmedLine) {
        flushList();
        continue;
      }

      // Horizontal divider
      if (trimmedLine === '---' || trimmedLine === '***') {
        flushList();
        elements.push(<hr key={`hr-${keyIndex++}`} className="content-divider" />);
        continue;
      }

      // Callout boxes
      const calloutMatch = trimmedLine.match(/^\[(TIP|NOTE|IMPORTANT|WARNING)\]\s*(.*)$/i);
      if (calloutMatch) {
        flushList();
        const type = calloutMatch[1].toLowerCase();
        const text = calloutMatch[2];
        const icons = { tip: '💡', note: '📝', important: '⚡', warning: '⚠️' };
        const titles = { tip: 'Pro Tip', note: 'Note', important: 'Important', warning: 'Warning' };
        
        elements.push(
          <div key={`callout-${keyIndex++}`} className={`content-callout ${type}`}>
            <div className="callout-header">
              <span className="callout-icon">{icons[type]}</span>
              <span className="callout-title">{titles[type]}</span>
            </div>
            <div className="callout-content">{processInlineFormatting(text)}</div>
          </div>
        );
        continue;
      }

      // Blockquote
      if (trimmedLine.startsWith('>')) {
        flushList();
        const quoteText = trimmedLine.substring(1).trim();
        elements.push(
          <blockquote key={`quote-${keyIndex++}`} className="content-blockquote">
            {processInlineFormatting(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Bullet list
      if (trimmedLine.match(/^[-•]\s+/)) {
        const itemText = trimmedLine.replace(/^[-•]\s+/, '');
        if (currentListType !== 'unordered') {
          flushList();
          currentList = [];
          currentListType = 'unordered';
        }
        currentList.push(itemText);
        continue;
      }

      // Numbered list
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const itemText = trimmedLine.replace(/^\d+\.\s+/, '');
        if (currentListType !== 'ordered') {
          flushList();
          currentList = [];
          currentListType = 'ordered';
        }
        currentList.push(itemText);
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={`p-${keyIndex++}`} className="content-paragraph">
          {processInlineFormatting(trimmedLine)}
        </p>
      );
    }

    flushList();

    return { renderedContent: elements, readingTime: minutes };
  }, [content]);

  if (!content) return null;

  return (
    <div className="content-renderer">
      {showReadingTime && readingTime > 0 && (
        <div className="reading-time">
          <span className="reading-time-icon">📖</span>
          <span>{readingTime} min read</span>
        </div>
      )}
      
      <div className="rendered-content">
        {renderedContent}
      </div>

      <style>{`
        .content-renderer {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--text-primary);
        }

        .reading-time {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f0f9ff;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #0369a1;
          margin-bottom: 1.5rem;
        }

        .reading-time-icon {
          font-size: 1rem;
        }

        .rendered-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .content-paragraph {
          margin: 0;
        }

        .content-list {
          margin: 0;
          padding-left: 1.5rem;
        }

        .content-list.unordered {
          list-style-type: disc;
        }

        .content-list.ordered {
          list-style-type: decimal;
        }

        .content-list li {
          margin-bottom: 0.5rem;
          padding-left: 0.5rem;
        }

        .content-list li::marker {
          color: var(--primary-color);
          font-weight: 600;
        }

        .content-divider {
          border: none;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--border-color), transparent);
          margin: 1.5rem 0;
        }

        .content-blockquote {
          margin: 0;
          padding: 1rem 1.5rem;
          border-left: 4px solid var(--primary-color);
          background: #f8fafc;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #475569;
        }

        .content-callout {
          padding: 1rem 1.25rem;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .content-callout.tip {
          background: #f0fdf4;
          border-color: #22c55e;
        }

        .content-callout.note {
          background: #f0f9ff;
          border-color: #0ea5e9;
        }

        .content-callout.important {
          background: #fefce8;
          border-color: #eab308;
        }

        .content-callout.warning {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .callout-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0.5rem;
        }

        .callout-icon {
          font-size: 1.1rem;
        }

        .callout-title {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .content-callout.tip .callout-title { color: #15803d; }
        .content-callout.note .callout-title { color: #0369a1; }
        .content-callout.important .callout-title { color: #a16207; }
        .content-callout.warning .callout-title { color: #dc2626; }

        .callout-content {
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .content-renderer {
            font-size: 1rem;
          }
          
          .content-list {
            padding-left: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default ContentRenderer;
