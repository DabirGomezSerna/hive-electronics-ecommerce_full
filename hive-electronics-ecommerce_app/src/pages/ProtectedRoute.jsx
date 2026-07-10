import { Navigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../services/userServices";

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  allowedRoles,
}) {
  if (!isAuthenticated()) {
    return <Navigate to={redirectTo} />;
  }

  if (allowedRoles) {
    const user = getCurrentUser();
    if (!allowedRoles.includes(user.role)) {
      return (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <h2>Access denied</h2>
          <p>You don't have permission to view this page, please log in.</p>
        </div>
      );
    }
  }
  return children;
}