import { useEffect } from "react";
import {
   BrowserRouter,
   Routes,
   Route,
   useLocation,
} from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import PhotoGallery from "./pages/PhotoGallery";
import Onboarding from "./pages/Onboarding";
import UserPage from "./pages/User";
import Restaurant from "./pages/Restaurants";
import RestaurantInfo from "./pages/RestaurantInfo";
import Review from "./pages/Review";
import RestaurantMenu from "./pages/RestaurantMenu";
import Header from "./components/Header";
import AccountSettings from "./pages/AccountSettings";
function AppLayout() {
   const location = useLocation();
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
      // Initialize dummy user session for the specific user we want to persist
      const targetId =
         "b677be85-81db-4245-91ca-acb713bd5564";
      const fetchUser = async () => {
         const storedUser = localStorage.getItem("user");
         const parsedUser = storedUser
            ? JSON.parse(storedUser)
            : null;

         if (!parsedUser || !parsedUser.id) {
            const response = await fetch(
               `http://localhost:4000/api/users/${targetId}`,
            );
            const userData = await response.json();
            localStorage.setItem(
               "user",
               JSON.stringify(userData),
            );
         }
      };
      fetchUser();
   }, []);

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
                  element={<Onboarding />}
               />
               <Route
                  path="/gallery"
                  element={<PhotoGallery />}
               />
               <Route path="/user" element={<UserPage />} />
               <Route
                  path="/restaurants"
                  element={<Restaurant />}
               />
               <Route
                  path="/restaurants/:id"
                  element={<RestaurantInfo />}
               />
               <Route
                  path="/restaurants/:id/menu"
                  element={<RestaurantMenu />}
               />
               <Route path="/review" element={<Review />} />

               <Route
                  path="/settings"
                  element={<AccountSettings />}
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