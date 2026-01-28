function Button({ children, variant = 'primary', size = 'normal', onClick, disabled, ...props }) {
  const className = `btn btn-${variant} ${size === 'large' ? 'btn-large' : ''}`;
  
  return (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
