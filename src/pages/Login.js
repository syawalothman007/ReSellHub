import { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const auth = getAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        setLoading(false);
        alert("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }

      setLoading(false);
      navigate("/");
    } catch (err) {
      setLoading(false);
      setError("Invalid email or password.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      setLoading(false);

      navigate("/");
    } catch (error) {
      setLoading(false);
      alert(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <img src="/Icon.png" alt="ReSellHub" />
        </div>

        <h2>Welcome Back</h2>

        <p className="login-subtitle">
          Sign in to continue buying and selling sustainably.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <Link
            to="/forgot-password"
            className="forgot-link"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={!email || !password || loading}
        >
          {loading ? "Signing In..." : "Login"}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />

          Continue with Google
        </button>

        <div className="register-section">
          <p>
            Don't have an account?
          </p>

          <Link to="/register">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;