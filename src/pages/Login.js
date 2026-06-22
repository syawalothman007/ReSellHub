import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    try {
      const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    if (!userCredential.user.emailVerified) {
      alert("Please verify your email before logging in.");

      await auth.signOut();

      return;
    }

    navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "15px",
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "350px",
          background: "white",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#2e7d32" }}>
          Login to ReSellHub
        </h2>
        <p style={{ textAlign: "center", color: "#777" }}>
          Welcome back 👋
        </p>
        {/* ERROR MESSAGE */}
        {error && (
          <p style={{ color: "red", textAlign: "center" }}>{error}</p>
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={!email || !password}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            background: "white",
            color: "#333",
            border: "1px solid #ccc",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Continue with Google
        </button>
        <p style={{ marginTop: "15px" }}>
          <Link
            to="/forgot-password"
            style={{
              color: "#2e7d32",
              textDecoration: "none"
            }}
          >
            Forgot Password?
          </Link>
        </p>

        {/* REGISTER LINK */}
        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Don’t have an account?{" "}
          <Link to="/register" style={{ color: "#2e7d32" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;