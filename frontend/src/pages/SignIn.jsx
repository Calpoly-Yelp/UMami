import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import bgImage from "../assets/signup-bg.jpeg";
import { supabase } from "../lib/supabase";

export default function SignIn() {
   const navigate = useNavigate();

   // form state
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   // UI state
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   // ===============================
   // HANDLE SIGN IN
   // ===============================
   const handleSignIn = async (e) => {
      e.preventDefault();

      try {
         setLoading(true);
         setError("");

         // -----------------------------------
         // 1. Authenticate with Supabase Auth
         // -----------------------------------
         const { data, error } =
            await supabase.auth.signInWithPassword({
               email,
               password,
            });

         if (error) {
            // Supabase auth failed (wrong password, etc.)
            throw error;
         }

         if (!data.user) {
            throw new Error(
               "No user returned from sign in.",
            );
         }

         console.log("Supabase user:", data.user);

         // -----------------------------------
         // 2. Fetch user profile from backend
         // -----------------------------------
         const response = await fetch(
            `http://localhost:4000/api/users/${data.user.id}`,
         );

         // try to parse response body safely
         const body = await response
            .json()
            .catch(() => ({}));

         // If backend returned error (like 500)
         if (!response.ok) {
            console.error("Backend error:", body);
            throw new Error(
               body.error ||
                  `Failed to fetch user profile (${response.status})`,
            );
         }

         // -----------------------------------
         // 3. Save user data locally
         // -----------------------------------
         console.log("Fetched user data:", body);

         localStorage.setItem("user", JSON.stringify(body));

         console.log("Saved to localStorage");

         // -----------------------------------
         // 4. Redirect to main app
         // -----------------------------------
         navigate("/restaurants");
      } catch (err) {
         console.error("Login failed:", err);

         // Show error message on UI
         setError(err.message || "Login failed");
      } finally {
         setLoading(false);
      }
   };

   // ===============================
   // UI
   // ===============================
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

            <form
               className="auth__form"
               onSubmit={handleSignIn}
            >
               {/* Email input */}
               <input
                  className="auth__input"
                  type="email"
                  placeholder="email@domain.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
               />

               {/* Password input */}
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

               {/* Show error if exists */}
               {error && (
                  <p className="auth__error">{error}</p>
               )}

               {/* Submit button */}
               <button
                  className="auth__primary"
                  type="submit"
                  disabled={loading}
               >
                  {loading ? "Signing in..." : "Sign In"}
               </button>

               {/* Signup redirect */}
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
            </form>
         </div>
      </div>
   );
}
