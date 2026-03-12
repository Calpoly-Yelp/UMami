import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import logo from "../assets/logo.png";
import bgImage from "../assets/signup-bg.jpeg";
export default function SignIn() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const handleSignIn = (e) => {
      e.preventDefault();
      navigate("/onboarding");
   };

   return (
      <div
         className="auth"
         style={{ backgroundImage: `url(${bgImage})` }}
      >
         <div className="auth__overlay" />

         <div
            className="auth__card"
            role="dialog"
            aria-label="Sign in"
         >
            <div className="auth__brand">
               <img
                  src={logo}
                  alt="Umami logo"
                  className="auth__logo"
               />
            </div>

            <h1 className="auth__title">
               Sign into your account
            </h1>
            <p className="auth__subtitle">
               Enter your email and password to sign in
            </p>

            <form
               className="auth__form"
               onSubmit={handleSignIn}
            >
               <input
                  className="auth__input"
                  type="email"
                  placeholder="email@domain.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email"
               />

               <input
                  className="auth__input"
                  type="password"
                  placeholder="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                     setPassword(e.target.value)
                  }
                  required
                  aria-label="Password"
               />

               <button
                  className="auth__primary"
                  type="submit"
               >
                  Sign in
               </button>

               <div className="auth__divider">
                  <span>Don't have an account?</span>
               </div>

               <Link
                  to="/signup-form"
                  className="auth__secondary"
               >
                  Sign Up
               </Link>

               <p className="auth__legal">
                  By continuing, you agree to our{" "}
                  <strong>Terms of Service</strong> and{" "}
                  <strong>Privacy Policy</strong>
               </p>
            </form>
         </div>
      </div>
   );
}
