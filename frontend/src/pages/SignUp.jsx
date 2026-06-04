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

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");

      if (!e.target.checkValidity()) return;

      const formData = new FormData(e.target);
      const name = formData.get("name");
      const email = formData.get("email");
      const password = formData.get("password");

      try {
         setLoading(true);

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
                     <input
                        className="signup__input"
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        required
                     />
                  </div>

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
