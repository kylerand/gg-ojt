function Card({ title, description, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || description) && (
        <div className="card-header">
          {title && <h2 className="card-title">{title}</h2>}
          {description && <p className="card-description">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
