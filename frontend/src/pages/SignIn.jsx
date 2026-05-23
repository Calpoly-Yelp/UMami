import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";

/**
 * Renders the sign-in page and handles user authentication, profile retrieval, and post-login navigation.
 *
 * Displays email and password inputs (with a visibility toggle), shows inline errors and loading state,
 * authenticates with Supabase, fetches the user's profile from the backend, persists it to localStorage,
 * and navigates to "/restaurants" on success.
 *
 * @returns {JSX.Element} The sign-in React element.
 */
export default function SignIn() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   // Controls whether the password is shown as plain text or hidden
   const [showPassword, setShowPassword] = useState(false);

   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleSignIn = async (e) => {
      e.preventDefault();

      try {
         setLoading(true);
         setError("");

         // Attempt to sign in with Supabase auth
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

         // Fetch the user's profile from our backend using their Supabase ID
         const response = await fetch(
            `https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net/api/users/${data.user.id}`,
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

         // Persist user data locally so other pages can access it without re-fetching
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
                  {/* Email field */}
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

                  {/* Password field with visibility toggle */}
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

                     {/* type switches between "password" and "text" based on showPassword */}
                     <input
                        className="auth__input auth__input--pw"
                        type={
                           showPassword
                              ? "text"
                              : "password"
                        }
                        placeholder="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) =>
                           setPassword(e.target.value)
                        }
                        required
                     />

                     {/* Toggle button — shows eye icon when hidden, eye-off when visible */}
                     <button
                        type="button"
                        className="auth__pw-toggle"
                        onClick={() =>
                           setShowPassword((v) => !v)
                        }
                        aria-label={
                           showPassword
                              ? "Hide password"
                              : "Show password"
                        }
                     >
                        {showPassword ? (
                           /* Eye icon — click to hide password */
                           <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                           >
                              <path
                                 fill="currentColor"
                                 d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                              />
                           </svg>
                        ) : (
                           /* Eye-off icon — click to show password */
                           <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                           >
                              <path
                                 fill="currentColor"
                                 d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l2.17 2.17C11.21 6.62 11.6 7 12 7ZM2 4.27l2.28 2.28.46.46A11.8 11.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27ZM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2Zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01Z"
                              />
                           </svg>
                        )}
                     </button>
                  </div>

                  {/* Inline error message from sign-in attempt */}
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
