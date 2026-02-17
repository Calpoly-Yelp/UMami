import React from "react";
import "./auth.css";
import bgImage from "../assets/signup-bg.jpeg"; 

export default function SignIn() {
  return (
    <div className="auth" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="auth__overlay" />

      <div className="auth__card" role="dialog" aria-label="Sign in">
        <div className="auth__brand">umami</div>

        <h1 className="auth__title">Sign into your account</h1>
        <p className="auth__subtitle">
          Enter your email and password to sign in
        </p>

        <form className="auth__form">
          <input
            className="auth__input"
            type="email"
            placeholder="email@domain.com"
            autoComplete="email"
          />

          <input
            className="auth__input"
            type="password"
            placeholder="password"
            autoComplete="current-password"
          />

          <button className="auth__primary" type="submit">
            Sign in
          </button>

          <p className="auth__legal">
            By continuing, you agree to our <strong>Terms of Service</strong> and{" "}
            <strong>Privacy Policy</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
