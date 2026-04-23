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
import RestaurantInfo from "./pages/RestaurantInfo";
import RestaurantMenu from "./pages/RestaurantMenu";
import Review from "./pages/Review";
import Header from "./components/Header";
import AccountSettings from "./pages/AccountSettings";

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
         <div style={{ padding: "2rem" }}>Loading...</div>
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

               <Route path="/signin" element={<SignIn />} />
               <Route path="/signup" element={<SignUp />} />

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
                        <UserPage session={session} />
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

               {/* NEW ROUTES FROM MAIN */}
               <Route
                  path="/restaurants/:id"
                  element={
                     <ProtectedRoute session={session}>
                        <RestaurantInfo />
                     </ProtectedRoute>
                  }
               />

               <Route
                  path="/restaurants/:id/menu"
                  element={
                     <ProtectedRoute session={session}>
                        <RestaurantMenu />
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
