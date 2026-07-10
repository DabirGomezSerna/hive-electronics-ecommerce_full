import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/userServices";
import Button from "../common/Button/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Input from "../common/Input/Input";
import "./LoginForm.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 800));
    const result = await login(email, password);

    if (result.success) {
      navigate("/");
      window.location.reload();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Log in</h2>
        <div className="demo-users">
          <h4>Demo users:</h4>
          <div className="user-demo">
            <strong>John Doe:</strong> john@email.com / john123
          </div>
        </div>
        <form className="login-form" onSubmit={onSubmit} data-testid="login-form">
          <div className="form-group">
            <Input
              id="email"
              label="Enter your email: "
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              data-testid="email-input"
            />
          </div>
          <div className="form-group">
            <Input
              id="password"
              label="Enter your password: "
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              data-testid="password-input"
            />
          </div>

          {error && <ErrorMessage data-testid="login-error">{error}</ErrorMessage>}

          <Button disabled={loading} type="submit" variant="primary" data-testid="login-submit">
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>
        <div className="login-footer">
          <Button className="login-footer-btn" variant="secondary" size="md" onClick={()=>navigate("/")}>Back to home</Button>
        </div>
      </div>
    </div>
  );
}
