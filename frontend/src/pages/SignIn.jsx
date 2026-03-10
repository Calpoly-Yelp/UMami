import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import logo from "../assets/logo.png";

export default function SignIn() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();

    navigate("/onboarding");
  };

  return (
    <div className="auth">
      <div className="auth__logoTop">
        <img src={logo} alt="Umami logo" />
      </div>

      <div className="auth__card">
        <h1 className="auth__title">Sign into your account</h1>

        <form className="auth__form" onSubmit={handleSignIn}>
          
          <div className="auth__field">
            <span className="auth__icon">✉️</span>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth__field">
            <span className="auth__icon">🔒</span>
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth__primary" type="submit">
            Sign In
          </button>

          <div className="auth__divider">
            <span>Don’t have an account?</span>
          </div>

          <Link to="/signup-form" className="auth__secondary">
            Sign Up
          </Link>
        </form>
      </div>
    </div>
  );
}