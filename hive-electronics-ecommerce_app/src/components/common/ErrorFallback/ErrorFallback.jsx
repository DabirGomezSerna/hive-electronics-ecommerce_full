import { getErrorMessage } from "react-error-boundary";
import Button from "../Button";
import ErrorMessage from "../ErrorMessage/ErrorMessage";
import "./ErrorFallback.css";

// A failed React.lazy() import is cached on that lazy() instance forever —
// resetErrorBoundary() only clears the boundary's local state and re-renders
// the same lazy component, which immediately re-throws the same cached
// rejection. Only a full reload re-fetches the chunk and can actually
// recover. webpack (react-scripts) names this error "ChunkLoadError"; the
// message-based checks cover native dynamic-import failures too.
const isChunkLoadError = (error) =>
  error?.name === "ChunkLoadError" ||
  /loading chunk .* failed|failed to fetch dynamically imported module/i.test(
    getErrorMessage(error) || ""
  );

// Rendered by react-error-boundary's ErrorBoundary (FallbackComponent prop)
// when a render error is caught. `error` is typed `unknown` — not
// necessarily an Error instance — so we go through getErrorMessage rather
// than assuming error.message exists.
export default function ErrorFallback({ error, resetErrorBoundary }) {
  const handleRetry = () => {
    if (isChunkLoadError(error)) {
      window.location.reload();
    } else {
      resetErrorBoundary();
    }
  };

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
          <Button onClick={handleRetry}>Try again</Button>
          <Button variant="secondary" onClick={() => window.location.assign("/")}>
            Go to main page
          </Button>
        </div>
      </ErrorMessage>
    </div>
  );
}
