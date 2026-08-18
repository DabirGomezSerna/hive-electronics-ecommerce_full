import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import "./index.css";
import App from "../src/components/App/App";
import ErrorFallback from "./components/common/ErrorFallback";
import reportWebVitals from "./reportWebVitals";
import logger from "./services/logger";

// Safety net for anything the try/catch and error boundaries elsewhere miss —
// not the primary fix for either failure mode.
window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection", { error: event.reason });
});

window.addEventListener("error", (event) => {
  logger.error("Uncaught error", { error: event.error || event.message });
});

const root = ReactDOM.createRoot(document.getElementById("root"), {
  onCaughtError: (error, info) =>
    logger.warn("React caught error", { componentStack: info?.componentStack, error }),
  onUncaughtError: (error, info) =>
    logger.error("React uncaught error", { componentStack: info?.componentStack, error }),
  onRecoverableError: (error) => logger.warn("React recoverable error", { error }),
});
root.render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) =>
        logger.error("Unhandled render error", {
          scope: "root",
          componentStack: info?.componentStack,
          error,
        })
      }
    >
      <App></App>
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
