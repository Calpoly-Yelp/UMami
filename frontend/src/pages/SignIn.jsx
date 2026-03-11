import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./auth.css";
import logo from "../assets/logo.png";


export default function SignIn() {
 const navigate = useNavigate();


 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");


 const handleSignIn = async (e) => {
   e.preventDefault();
   navigate("/onboarding");
 };


 return (
<div className="auth">


     <div className="auth__card" role="dialog" aria-label="Sign in">
      <div className="auth__brand">
 <img src={logo} alt="Umami logo" className="auth__logo" />
</div>


       <h1 className="auth__title">Sign into your account</h1>
       <p className="auth__subtitle">
         Enter your email and password to sign in
       </p>


       <form className="auth__form" onSubmit={handleSignIn} noValidate>
         <label className="auth__field">
           <span className="auth__icon" aria-hidden>✉️</span>
           <input
             className="auth__input"
             type="email"
             placeholder="Email"
             autoComplete="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             aria-label="Email"
           />
         </label>


         <label className="auth__field">
           <span className="auth__icon" aria-hidden>🔒</span>
           <input
             className="auth__input"
             type="password"
             placeholder="Password"
             autoComplete="current-password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             aria-label="Password"
           />
         </label>


         <button className="auth__primary" type="submit">
           Sign In
         </button>


         <div className="auth__divider">
           <span>Don't have an account?</span>
         </div>


         <Link to="/signup" className="auth__secondary">
 Sign Up
</Link>


         <p className="auth__legal">
           By continuing, you agree to our <strong>Terms of Service</strong> and{" "}
           <strong>Privacy Policy</strong>
         </p>
       </form>
     </div>
   </div>
 );
}
