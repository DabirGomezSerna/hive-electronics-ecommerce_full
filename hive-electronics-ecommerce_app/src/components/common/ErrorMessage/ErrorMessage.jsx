import "./ErrorMessage.css";

export default function ErrorMessage({ message, children, ...rest }) {
  return (
    <div className="error-message" role="alert" {...rest}>
      {message && <p className="error-message-text">{message}</p>}
      {children}
    </div>
  );
}
