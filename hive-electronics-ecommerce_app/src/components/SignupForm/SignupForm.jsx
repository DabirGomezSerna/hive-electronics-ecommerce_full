import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/userServices";
import Button from "../common/Button/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Input from "../common/Input/Input";
import "./SignupForm.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm() {
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const { displayName, email, password, confirmPassword } = formData;

    if (!displayName || !email || !password || !confirmPassword) {
      return "All fields are required";
    }
    if (!EMAIL_REGEX.test(email)) {
      return "Enter a valid email address";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const result = await register(
      formData.displayName,
      formData.email,
      formData.password,
    );

    if (result.success) {
      navigate("/login");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create account</h2>
        <form
          className="signup-form"
          onSubmit={onSubmit}
          data-testid="signup-form"
        >
          <div className="form-group">
            <Input
              id="displayName"
              name="displayName"
              label="Display name"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Display name"
              required
              data-testid="displayName-input"
            />
          </div>
          <div className="form-group">
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              data-testid="email-input"
            />
          </div>
          <div className="form-group">
            <Input
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              data-testid="password-input"
            />
          </div>
          <div className="form-group">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              data-testid="confirmPassword-input"
            />
          </div>

          {error && (
            <ErrorMessage data-testid="signup-error">{error}</ErrorMessage>
          )}

          <Button
            disabled={loading}
            type="submit"
            variant="primary"
            data-testid="signup-submit"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <div className="signup-footer">
          <Button
            className="signup-footer-btn"
            variant="secondary"
            size="md"
            onClick={() => navigate("/login")}
          >
            Already have an account? Log in
          </Button>
        </div>
      </div>
    </div>
  );
}
