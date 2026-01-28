function SafetyWarning({ warning }) {
  return (
    <div className={`safety-warning ${warning.severity}`}>
      <span className="safety-icon">⚠️</span>
      <strong>{warning.severity === 'danger' ? 'DANGER: ' : 'WARNING: '}</strong>
      {warning.text}
    </div>
  );
}

export default SafetyWarning;
