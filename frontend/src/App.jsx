import {
   BrowserRouter,
   Routes,
   Route,
   useLocation,
} from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import SignUpForm from "./pages/SignUpForm";
import PhotoGallery from "./pages/PhotoGallery";
import HomePage from "./pages/HomePage";
import Onboarding from "./pages/Onboarding";
import UserPage from "./pages/user";
import Restaurant from "./pages/Restaurants";
import Header from "./components/header";

function AppLayout() {
   const location = useLocation();
   const hideHeaderPaths = [
      "/",
      "/signin",
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
            style={{ flex: 1, overflow: "hidden" }}
         >
            <Routes>
               <Route path="/" element={<SignUp />} />
               <Route path="/signin" element={<SignIn />} />
               <Route
                  path="/signup-form"
                  element={<SignUpForm />}
               />
               <Route path="/home" element={<HomePage />} />
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
