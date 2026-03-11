import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import logo from "../assets/logo.png";

export default function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();


    navigate("/onboarding");
  };

  return (
    <div className="auth">
      <div className="auth__card" role="dialog" aria-label="Create account">
        <div className="auth__brand">
          <img src={logo} alt="Umami logo" className="auth__logo" />
        </div>

        <h1 className="auth__title">Get started now</h1>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <label className="auth__field">
            <span className="auth__icon" aria-hidden>
              👤
            </span>
            <input
              className="auth__input"
              type="text"
              placeholder="Name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-label="Name"
            />
          </label>

          <label className="auth__field">
            <span className="auth__icon" aria-hidden>
              ✉️
            </span>
            <input
              className="auth__input"
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email"
            />
          </label>

          <label className="auth__field">
            <span className="auth__icon" aria-hidden>
              🔒
            </span>
            <input
              className="auth__input"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
          </label>

          <button className="auth__primary" type="submit">
            Create Account
          </button>

          <div className="auth__divider">
            <span>
              Have an account already?{" "}
              <Link to="/signin" className="auth__inlineLink">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}