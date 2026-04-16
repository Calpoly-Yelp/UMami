import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";
import bgImage from "../assets/signup-bg.jpeg";

export default function SignIn() {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const handleSignIn = async (e) => {
      e.preventDefault();
      try {
         const response = await fetch(
            "http://localhost:4000/api/users/b677be85-81db-4245-91ca-acb713bd5564",
         );
         if (response.ok) {
            const userData = await response.json();
            localStorage.setItem(
               "user",
               JSON.stringify(userData),
            );
            navigate("/restaurants");
         }
      } catch (error) {
         console.error("Login failed", error);
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

               <button
                  className="auth__primary"
                  type="submit"
               >
                  Sign in
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