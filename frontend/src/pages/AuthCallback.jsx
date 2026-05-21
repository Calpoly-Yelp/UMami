import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { supabase } from "../lib/supabase";
import { ensureUserProfile } from "../lib/userProfile";
import "./SignIn.css";

export default function AuthCallback() {
   const navigate = useNavigate();
   const [error, setError] = useState("");

   useEffect(() => {
      let isMounted = true;

      const completeSignIn = async () => {
         try {
            const code = new URLSearchParams(
               window.location.search,
            ).get("code");

            const {
               data: { session },
               error: sessionError,
            } = code
               ? await supabase.auth.exchangeCodeForSession(
                    code,
                 )
               : await supabase.auth.getSession();

            if (sessionError) {
               throw sessionError;
            }

            if (!session?.user) {
               throw new Error(
                  "We could not verify your email session. Please sign in again.",
               );
            }

            const profile = await ensureUserProfile(
               session.user,
            );
            localStorage.setItem(
               "user",
               JSON.stringify(profile),
            );

            if (isMounted) {
               navigate("/onboarding", { replace: true });
            }
         } catch (err) {
            console.error(
               "Email verification failed:",
               err,
            );
            if (isMounted) {
               setError(
                  err.message ||
                     "Email verification failed.",
               );
            }
         }
      };

      completeSignIn();

      return () => {
         isMounted = false;
      };
   }, [navigate]);

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
               role="status"
               aria-label="Verifying email"
            >
               <div className="auth__brand">umami</div>
               <h1 className="auth__title">
                  Verifying your email
               </h1>
               {error ? (
                  <p className="auth__error">{error}</p>
               ) : (
                  <p>Finishing your account setup...</p>
               )}
            </div>
         </div>
      </div>
   );
}
