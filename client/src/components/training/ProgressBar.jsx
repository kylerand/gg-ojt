function ProgressBar({ current, total }) {
  const percentage = (current / total) * 100;

  return (
    <div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Step {current} of {total}
      </p>
    </div>
  );
}

export default ProgressBar;
