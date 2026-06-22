import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);

      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{
      padding: "40px",
      maxWidth: "400px",
      margin: "auto"
    }}>
      <h1>Forgot Password</h1>

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px"
        }}
      />

      <button
        onClick={handleReset}
        style={{
          width: "100%",
          padding: "10px",
          background: "#2e7d32",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Send Reset Link
      </button>
    </div>
  );
}

export default ForgotPassword;