import React from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";
import heroImg from "../assets/signup2.jpg";
import logo from "../assets/logo.png";

export default function SignUp() {
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();

      // Ensure form is valid before processing (handling JSDOM/Browser edge cases)
      if (!e.target.checkValidity()) return;

      const formData = new FormData(e.target);

      const newUser = {
         id: crypto.randomUUID(),
         name: formData.get("name"),
         email: formData.get("email"),
         avatar_url: "", // Default empty avatar
         is_verified: false,
      };

      try {
         await fetch("http://localhost:4000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
         });
         localStorage.setItem(
            "user",
            JSON.stringify(newUser),
         );
         navigate("/onboarding");
      } catch (error) {
         console.error("Sign up failed", error);
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

               <button
                  className="signupForm__primary"
                  type="submit"
               >
                  Sign up
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
