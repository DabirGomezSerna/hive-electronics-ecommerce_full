import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router-dom";
import logger from "../../../services/logger";
import ErrorFallback from "./ErrorFallback";

// App renders BrowserRouter itself, so it can't read the current location to
// use as a reset key — this adapter reads it from inside the router instead.
// resetKeys={[pathname]} clears the fallback automatically when the user
// navigates away, without any manual reset bookkeeping.
export default function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={[pathname]}
      onError={(error, info) =>
        logger.error("Unhandled render error", {
          scope: "route",
          componentStack: info?.componentStack,
          error,
        })
      }
    >
      {children}
    </ErrorBoundary>
  );
}
