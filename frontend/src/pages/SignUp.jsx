import React from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";
import heroImg from "../assets/signup2.jpg";
import logo from "../assets/logo.png";

export default function SignUp() {
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!e.target.checkValidity()) return;

      const formData = new FormData(e.target);

      const newUser = {
         id: crypto.randomUUID(),
         name: formData.get("name"),
         email: formData.get("email"),
         avatar_url: "",
         is_verified: false,
      };

      try {
         await fetch("http://localhost:4000/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
         });

         localStorage.setItem("user", JSON.stringify(newUser));
         navigate("/onboarding");
      } catch (error) {
         console.error("Sign up failed", error);
      }
   };

   return (
      <div className="signupForm">
         <div className="signupForm__left">
            <div className="signupForm__content">
               <img
                  src={logo}
                  alt="Umami logo"
                  className="signupForm__logo"
               />

               <h1 className="signupForm__title">Get started now</h1>

               <form
                  className="signupForm__form"
                  onSubmit={handleSubmit}
               >
                  <label className="signupForm__label" htmlFor="name">
                     Name
                  </label>
                  <div className="signupForm__inputWrap">
                     <span
                        className="signupForm__inputIcon"
                        aria-hidden="true"
                     >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                           <path
                              fill="currentColor"
                              d="M12 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.015-8 4.5V21h16v-2.5c0-2.485-3.582-4.5-8-4.5Z"
                           />
                        </svg>
                     </span>
                     <input
                        className="signupForm__input"
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Name"
                        autoComplete="name"
                        required
                     />
                  </div>

                  <label className="signupForm__label" htmlFor="email">
                     Email
                  </label>
                  <div className="signupForm__inputWrap">
                     <span
                        className="signupForm__inputIcon"
                        aria-hidden="true"
                     >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                           <path
                              fill="currentColor"
                              d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5Z"
                           />
                        </svg>
                     </span>
                     <input
                        className="signupForm__input"
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        required
                     />
                  </div>

                  <label className="signupForm__label" htmlFor="password">
                     Password
                  </label>
                  <div className="signupForm__inputWrap">
                     <span
                        className="signupForm__inputIcon"
                        aria-hidden="true"
                     >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                           <path
                              fill="currentColor"
                              d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 0V6a2 2 0 1 1 4 0v2h-4Z"
                           />
                        </svg>
                     </span>
                     <input
                        className="signupForm__input"
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        required
                     />
                  </div>

                  <button
                     className="signupForm__primary"
                     type="submit"
                  >
                     Create Account
                  </button>

                  <div className="signupForm__footer">
                     <span className="signupForm__footerLine" />
                     <span className="signupForm__footerText">
                        Have an account already?{" "}
                        <button
                           className="signupForm__linkBtn"
                           type="button"
                           onClick={() => navigate("/signin")}
                        >
                           Sign in
                        </button>
                     </span>
                     <span className="signupForm__footerLine" />
                  </div>
               </form>
            </div>
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