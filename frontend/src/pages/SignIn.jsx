import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import bgImage from "../assets/signup-bg.jpeg";
import { supabase } from "../lib/supabase";

export default function SignIn() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleSignIn = async (e) => {
      e.preventDefault();
      setError("");

      try {
         setLoading(true);

         const { data, error } =
            await supabase.auth.signInWithPassword({
               email,
               password,
            });

         if (error) {
            throw error;
         }

         if (!data.user) {
            throw new Error(
               "No user returned from sign in.",
            );
         }

         navigate("/restaurants");
      } catch (err) {
         console.error("Login failed", err);
         setError(err.message || "Login failed");
      } finally {
         setLoading(false);
      }
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
            <div className="auth__brand">umami</div>

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
               />

               {error && (
                  <p className="auth__error">{error}</p>
               )}

               <button
                  className="auth__primary"
                  type="submit"
                  disabled={loading}
               >
                  {loading ? "Signing in..." : "Sign In"}
               </button>

               <div className="auth__divider">
                  <span>Don't have an account?</span>
               </div>

               <button
                  className="auth__secondary"
                  type="button"
                  onClick={() => navigate("/signup")}
               >
                  Sign Up
               </button>

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
