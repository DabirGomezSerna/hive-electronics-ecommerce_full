import { getErrorMessage } from "react-error-boundary";
import Button from "../Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import "./ErrorFallback.css";

// Rendered by react-error-boundary's ErrorBoundary (FallbackComponent prop)
// when a render error is caught. `error` is typed `unknown` — not
// necessarily an Error instance — so we go through getErrorMessage rather
// than assuming error.message exists.
export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-fallback">
      <ErrorMessage>
        <h2>Something went wrong</h2>
        <p className="muted">
          We couldn't display this part of the page. You can try again or go
          back to the main page.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="error-fallback-detail">{getErrorMessage(error)}</p>
        )}
        <div className="error-fallback-actions">
          <Button onClick={resetErrorBoundary}>Try again</Button>
          <Button variant="secondary" onClick={() => window.location.assign("/")}>
            Go to main page
          </Button>
        </div>
      </ErrorMessage>
    </div>
  );
}
