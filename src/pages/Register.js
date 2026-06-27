import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { showToast } from "../utils/toast";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import "./Register.css";

function Register() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await sendEmailVerification(userCredential.user);

      setLoading(false);

      showToast(
        "Account created! Please verify your email before logging in.",
        "success"
      );

      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        <div className="register-logo">
          🌱
        </div>

        <h2>Create Account</h2>

        <p className="register-subtitle">
          Join ReSellHub and start giving products a second life.
        </p>

        {error && (
          <div className="register-error">
            {error}
          </div>
        )}

        <div className="form-group">

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

        </div>

        <div className="form-group">

          <label>Password</label>

          <div className="password-wrapper">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁"}
            </button>

          </div>

        </div>

        <div className="form-group">

          <label>Confirm Password</label>

          <div className="password-wrapper">

            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              {showConfirmPassword
                ? "🙈"
                : "👁"}
            </button>

          </div>

        </div>
                <button
          className="register-btn"
          onClick={handleRegister}
          disabled={
            !email ||
            !password ||
            !confirmPassword ||
            loading
          }
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

        <div className="register-divider">
          <span>OR</span>
        </div>

        <div className="register-section">
          <p>Already have an account?</p>

          <Link to="/login">
            Login
          </Link>
        </div>

      </div>

    </div>
  );
}

export default Register;