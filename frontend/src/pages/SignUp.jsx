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
                  data: {
                     name,
                  },
               },
            });

         if (signUpError) {
            throw signUpError;
         }

         const user = data.user;

         if (!user) {
            throw new Error(
               "User account was not created.",
            );
         }

         const response = await fetch(
            "http://localhost:4000/api/users",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  id: user.id,
                  name,
                  email,
                  avatar_url: "",
                  is_verified: false,
               }),
            },
         );

         const result = await response.json();

         if (!response.ok) {
            throw new Error(
               result.error || "Failed to save user.",
            );
         }

         if (data.session) {
            navigate("/onboarding");
         } else {
            navigate("/signin");
         }
      } catch (err) {
         console.error("Sign up failed:", err);
         setError(err.message || "Sign up failed");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="signupForm">
         <div className="signupForm__left">
            <div className="signupForm__brand">
               <img
                  src={logo}
                  alt="Umami logo"
                  className="signupForm__logo"
               />
            </div>

            <h1 className="signupForm__title">
               Get started now
            </h1>

            <div
               className="signupForm__icon"
               aria-hidden="true"
            >
               <svg
                  viewBox="0 0 24 24"
                  width="64"
                  height="64"
               >
                  <path
                     fill="currentColor"
                     d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4m0 2c-4.42 0-8 2-8 4.5V21h16v-2.5c0-2.5-3.58-4.5-8-4.5"
                  />
               </svg>
            </div>

            <form
               className="signupForm__form"
               onSubmit={handleSubmit}
            >
               <label
                  className="signupForm__label"
                  htmlFor="name"
               >
                  Name
               </label>
               <input
                  className="signupForm__input"
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
               />

               <label
                  className="signupForm__label"
                  htmlFor="email"
               >
                  Email address
               </label>
               <input
                  className="signupForm__input"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
               />

               <label
                  className="signupForm__label"
                  htmlFor="password"
               >
                  Password
               </label>
               <input
                  className="signupForm__input"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter a password"
                  autoComplete="new-password"
                  required
               />

               <label className="signupForm__checkRow">
                  <input type="checkbox" required />
                  <span>
                     I agree to the{" "}
                     <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                     >
                        terms &amp; policy
                     </a>
                  </span>
               </label>

               {error && (
                  <p className="signupForm__error">
                     {error}
                  </p>
               )}

               <button
                  className="signupForm__primary"
                  type="submit"
                  disabled={loading}
               >
                  {loading ? "Signing up..." : "Sign up"}
               </button>

               <div className="signupForm__footer">
                  <span>Have an account?</span>
                  <button
                     className="signupForm__linkBtn"
                     type="button"
                     onClick={() => navigate("/signin")}
                  >
                     Sign In
                  </button>
               </div>
            </form>
         </div>

         <div className="signupForm__right">
            <img
               className="signupForm__img"
               src={heroImg}
               alt="Food preparation"
            />
         </div>
      </div>
   );
}
