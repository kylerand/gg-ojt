/**
 * KeyTakeaways - Displays a summary box of key points from the step
 * Can be manually specified or auto-generated from content
 */

function KeyTakeaways({ takeaways = [], title = "Key Takeaways" }) {
  if (!takeaways || takeaways.length === 0) return null;

  return (
    <div className="key-takeaways">
      <div className="takeaways-header">
        <span className="takeaways-icon">🎯</span>
        <h4 className="takeaways-title">{title}</h4>
      </div>
      <ul className="takeaways-list">
        {takeaways.map((item, index) => (
          <li key={index} className="takeaway-item">
            <span className="takeaway-check">✓</span>
            <span className="takeaway-text">{item}</span>
          </li>
        ))}
      </ul>

      <style>{`
        .key-takeaways {
          background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          color: white;
        }

        .takeaways-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
        }

        .takeaways-icon {
          font-size: 1.5rem;
        }

        .takeaways-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
        }

        .takeaways-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .takeaway-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .takeaway-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(201, 162, 39, 0.9);
          border-radius: 50%;
          font-size: 14px;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .takeaway-text {
          line-height: 1.6;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .key-takeaways {
            padding: 1.25rem;
          }

          .takeaway-text {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

export default KeyTakeaways;
