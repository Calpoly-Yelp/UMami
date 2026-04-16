import { useEffect, useState } from "react";
import {
   BrowserRouter,
   Routes,
   Route,
   useLocation,
   Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import PhotoGallery from "./pages/PhotoGallery";
import Onboarding from "./pages/Onboarding";
import UserPage from "./pages/User";
import Restaurant from "./pages/Restaurants";
import Review from "./pages/Review";
import Header from "./components/Header";
import AccountSettings from "./pages/AccountSettings";
import ReviewPage from "./pages/ReviewPage";

function ProtectedRoute({ session, children }) {
   if (!session) {
      return <Navigate to="/signin" replace />;
   }
   return children;
}

function AppLayout() {
   const location = useLocation();
   const [session, setSession] = useState(null);
   const [authLoading, setAuthLoading] = useState(true);

   const hideHeaderPaths = [
      "/",
      "/signin",
      "/signup",
      "/signup-form",
      "/onboarding",
   ];

   const showHeader = !hideHeaderPaths.includes(
      location.pathname,
   );

   useEffect(() => {
      const getSession = async () => {
         try {
            const {
               data: { session },
            } = await supabase.auth.getSession();

            setSession(session);
         } catch (error) {
            console.error("Error getting session:", error);
         } finally {
            setAuthLoading(false);
         }
      };

      getSession();

      const {
         data: { subscription },
      } = supabase.auth.onAuthStateChange(
         (_event, session) => {
            setSession(session);
         },
      );

      return () => subscription.unsubscribe();
   }, []);

   if (authLoading) {
      return (
         <div style={{ padding: "2rem", color: "black" }}>
            Loading...
         </div>
      );
   }

   return (
      <div
         className="app-container"
         style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
         }}
      >
         {showHeader && <Header />}
         <div
            className="content-container"
            style={{ flex: 1, overflow: "auto" }}
         >
            <Routes>
               <Route path="/" element={<SignIn />} />
               <Route
                  path="/signin"
                  element={
                     session ? (
                        <Navigate
                           to="/restaurants"
                           replace
                        />
                     ) : (
                        <SignIn />
                     )
                  }
               />
               <Route
                  path="/signup"
                  element={
                     session ? (
                        <Navigate
                           to="/restaurants"
                           replace
                        />
                     ) : (
                        <SignUp />
                     )
                  }
               />
               <Route
                  path="/onboarding"
                  element={
                     <ProtectedRoute session={session}>
                        <Onboarding />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/gallery"
                  element={
                     <ProtectedRoute session={session}>
                        <PhotoGallery />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/user"
                  element={
                     <ProtectedRoute session={session}>
                        <UserPage />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/restaurants"
                  element={
                     <ProtectedRoute session={session}>
                        <Restaurant />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/review"
                  element={
                     <ProtectedRoute session={session}>
                        <Review />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/settings"
                  element={
                     <ProtectedRoute session={session}>
                        <AccountSettings />
                     </ProtectedRoute>
                  }
               />
               <Route
                  path="/reviews"
                  element={
                     <ProtectedRoute session={session}>
                        <ReviewPage />
                     </ProtectedRoute>
                  }
               />
            </Routes>
         </div>
      </div>
   );
}

export default function App() {
   return (
      <BrowserRouter>
         <AppLayout />
      </BrowserRouter>
   );
}
