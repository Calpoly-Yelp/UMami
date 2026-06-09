import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";
import heroImg from "../assets/signup2.jpg";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";

export default function SignUp() {
   const navigate = useNavigate();
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   // Controls whether the password is shown as plain text or hidden
   const [showPassword, setShowPassword] = useState(false);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");

      // Stop early if any required fields are invalid
      if (!e.target.checkValidity()) return;

      // Extract form values from the uncontrolled inputs
      const formData = new FormData(e.target);
      const name = formData.get("name");
      const email = formData.get("email");
      const password = formData.get("password");

      try {
         setLoading(true);

         // Attempt to create a new Supabase auth account
         const { data, error: signUpError } =
            await supabase.auth.signUp({
               email,
               password,
               options: {
                  data: { name },
                  emailRedirectTo: `${window.location.origin}/auth/callback`,
               },
            });

         if (signUpError) throw signUpError;

         const user = data.user;

         if (!user) {
            throw new Error(
               "User account was not created.",
            );
         }

         if (data.session) {
            navigate("/auth/callback");
         } else {
            navigate("/verify-email");
         }
      } catch (err) {
         console.error("Sign up failed:", err);
         setError(err.message || "Sign up failed");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="signup">
         {/* ── Left panel: form ── */}
         <div className="signup__left">
            <div className="signup__content">
               <img
                  src={logo}
                  alt="Umami logo"
                  className="signup__logo"
               />

               <h1 className="signup__title">
                  Get started now
               </h1>

               <form
                  className="signup__form"
                  onSubmit={handleSubmit}
               >
                  {/* Name field */}
                  <label
                     className="signup__label"
                     htmlFor="name"
                  >
                     Name
                  </label>
                  <div className="signup__inputWrap">
                     <span
                        className="signup__icon"
                        aria-hidden="true"
                     >
                        <svg
                           viewBox="0 0 24 24"
                           width="20"
                           height="20"
                        >
                           <path
                              fill="currentColor"
                              d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm0 2c-4.42 0-8 1.79-8 4v1h16v-1c0-2.21-3.58-4-8-4Z"
                           />
                        </svg>
                     </span>
                     <input
                        className="signup__input"
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Name"
                        autoComplete="name"
                        required
                     />
                  </div>

                  <div className="signup__labelRow">
                     <label
                        className="signup__label"
                        htmlFor="email"
                     >
                        Email Address
                     </label>

                     <div className="signup__tooltipWrap">
                        <span className="signup__tooltipIcon">
                           i
                        </span>

                        <div className="signup__tooltip">
                           Use your @calpoly.edu email to
                           earn a verified badge on your
                           profile.
                        </div>
                     </div>
                  </div>

                  <div className="signup__inputWrap">
                     <span
                        className="signup__icon"
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
                        className="signup__input"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        required
                     />
                  </div>

                  {/* Password field with visibility toggle */}
                  <label
                     className="signup__label"
                     htmlFor="password"
                  >
                     Password
                  </label>
                  <div className="signup__inputWrap">
                     <span
                        className="signup__icon"
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
                        className="signup__input signup__input--pw"
                        id="password"
                        name="password"
                        type={
                           showPassword
                              ? "text"
                              : "password"
                        }
                        placeholder="Password"
                        autoComplete="new-password"
                        required
                     />

                     {/* Toggle button — eye-off icon when visible, eye icon when hidden */}
                     <button
                        type="button"
                        className="signup__pw-toggle"
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
                           /* Eye icon — password is currently visible, click to hide */
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
                           /* Eye-off icon — password is currently hidden, click to show */
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

                  {/* Terms and conditions checkbox — required before submitting */}
                  <label className="signup__checkRow">
                     <input
                        type="checkbox"
                        name="terms"
                        required
                     />
                     <span>
                        I agree to the Terms and Conditions
                     </span>
                  </label>

                  {/* Inline error message from sign-up attempt */}
                  {error && (
                     <p className="signup__error">
                        {error}
                     </p>
                  )}

                  <button
                     className="btn btn-primary signup__button"
                     type="submit"
                     disabled={loading}
                  >
                     {loading ? "Signing Up..." : "Sign Up"}
                  </button>

                  {/* Footer with link to sign in for existing users */}
                  <div className="signup__footer">
                     <span className="signup__footerLine" />
                     <span className="signup__footerText">
                        Have an account already?{" "}
                        <button
                           className="signup__link"
                           type="button"
                           onClick={() =>
                              navigate("/signin")
                           }
                        >
                           Sign in
                        </button>
                     </span>
                     <span className="signup__footerLine" />
                  </div>
               </form>
            </div>
         </div>

         {/* ── Right panel: hero image ── */}
         <div className="signup__right">
            <img
               src={heroImg}
               alt="Food preparation"
               className="signup__image"
            />
         </div>
      </div>
   );
}
