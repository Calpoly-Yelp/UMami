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
import Review from "./pages/Review";
import Header from "./components/Header";
import AccountSettings from "./pages/AccountSettings";
import ReviewPage from "./pages/ReviewPage";
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
               <Route path="/review" element={<Review />} />
               <Route
                  path="/settings"
                  element={<AccountSettings />}
               />
               <Route
                  path="/reviews"
                  element={<ReviewPage />}
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
