import React from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import bgImage from "../assets/signup-bg.jpeg";

export default function SignUp() {
  const navigate = useNavigate();

const handleSubmit = (e) => {
  e.preventDefault();
  navigate("/signup-form");
};

  return (
    <div className="auth" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="auth__overlay" />

      <div className="auth__card">
        <div className="auth__brand">umami</div>

        <h1 className="auth__title">Create an account</h1>
        <p className="auth__subtitle">
          Enter your email to sign up for this app
        </p>

        <form className="auth__form" onSubmit={handleSubmit}>
          <label className="auth__label" htmlFor="email">
            Email
          </label>

          <input
            className="auth__input"
            id="email"
            name="email"
            type="email"
            placeholder="email@domain.com"
            autoComplete="email"
            required
          />

          <button className="auth__primary" type="submit">
            Sign up with email
          </button>

          <div className="auth__divider">
            <span>Already have an account?</span>
          </div>

          <button
            className="auth__secondary"
            type="button"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>

          <p className="auth__legal">
            By continuing, you agree to our{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
