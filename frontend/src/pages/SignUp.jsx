import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./signupForm.css";
import logo from "../assets/logo.png";
import bgImage from "../assets/signup-bg.jpeg";
export default function SignUp() {
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const handleSubmit = (e) => {
      e.preventDefault();
   };

   return (
      <div
         className="signup"
         style={{ backgroundImage: `url(${bgImage})` }}
      >
         <div className="signup__card">
            <div className="signup__brand">
               <img src={logo} alt="Umami logo" />
            </div>

            <h1>Create an account</h1>
            <form
               onSubmit={handleSubmit}
               className="signup__form"
            >
               <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  required
               />
               <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  type="email"
               />
               <input
                  value={password}
                  onChange={(e) =>
                     setPassword(e.target.value)
                  }
                  placeholder="Password"
                  required
                  type="password"
               />
               <button type="submit">Sign Up</button>
            </form>

            <p>
               Already have an account?{" "}
               <Link to="/signin">Sign In</Link>
            </p>
         </div>
      </div>
   );
}
