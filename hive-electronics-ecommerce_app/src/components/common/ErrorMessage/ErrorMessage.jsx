import "./ErrorMessage.css";

export default function ErrorMessage({ children, ...rest }) {
  return (
    <div className="error-message" role="alert" {...rest}>
      {children}
    </div>
  );
}
