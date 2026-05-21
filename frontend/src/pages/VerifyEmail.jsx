import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./SignIn.css";

export default function VerifyEmail() {
   const navigate = useNavigate();

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
               aria-label="Verify email"
            >
               <div className="auth__brand">umami</div>
               <h1 className="auth__title">
                  Check your email
               </h1>
               <p>
                  We sent you a verification link. Open it
                  to finish creating your account.
               </p>
               <button
                  className="btn btn-primary auth__primary"
                  type="button"
                  onClick={() => navigate("/signin")}
               >
                  Back to Sign In
               </button>
            </div>
         </div>
      </div>
   );
}
