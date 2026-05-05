import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";

export default function SignIn() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleSignIn = async (e) => {
      e.preventDefault();

      try {
         setLoading(true);
         setError("");

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

         console.log("Supabase user:", data.user);

         const response = await fetch(
            `http://localhost:4000/api/users/${data.user.id}`,
         );

         const body = await response
            .json()
            .catch(() => ({}));

         if (!response.ok) {
            console.error("Backend error:", body);
            throw new Error(
               body.error ||
                  `Failed to fetch user profile (${response.status})`,
            );
         }

         console.log("Fetched user data:", body);

         localStorage.setItem("user", JSON.stringify(body));

         console.log("Saved to localStorage");

         navigate("/restaurants");
      } catch (err) {
         console.error("Login failed:", err);
         setError(err.message || "Login failed");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="auth">
         <div className="auth__wrap">
            <img
               src={logo}
               alt="Umami logo"
               className="auth__logo"
            />

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
                  <div className="auth__field">
                     <span
                        className="auth__icon"
                        aria-hidden="true"
                     >
                        <svg
                           viewBox="0 0 24 24"
                           width="20"
                           height="20"
                        >
                           <path
                              fill="currentColor"
                              d="M20 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 2v.01L12 13L4 8.01V8h16ZM4 16V10.3l7.4 4.62a1 1 0 0 0 1.2 0L20 10.3V16H4Z"
                           />
                        </svg>
                     </span>

                     <input
                        className="auth__input"
                        type="email"
                        placeholder="email@domain.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) =>
                           setEmail(e.target.value)
                        }
                        required
                     />
                  </div>

                  <div className="auth__field">
                     <span
                        className="auth__icon"
                        aria-hidden="true"
                     >
                        <svg
                           viewBox="0 0 24 24"
                           width="20"
                           height="20"
                        >
                           <path
                              fill="currentColor"
                              d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V6Zm7 12H7v-8h10v8Z"
                           />
                        </svg>
                     </span>

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
                  </div>

                  {error && (
                     <p className="auth__error">{error}</p>
                  )}

                  <button
                     className="btn btn-primary auth__primary"
                     type="submit"
                     disabled={loading}
                  >
                     {loading ? "Signing In..." : "Sign In"}
                  </button>

                  <div className="auth__divider">
                     <span>Don't have an account?</span>
                  </div>

                  <button
                     className="btn btn-secondary auth__secondary"
                     type="button"
                     onClick={() => navigate("/signup")}
                  >
                     Sign Up
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}
