import React, {
   useEffect,
   useMemo,
   useRef,
   useState,
} from "react";
import "./AccountSettings.css";
import addProfilePicture from "../assets/addProfilePicture.png";

const sections = [
   { id: "profile", label: "My Profile" },
   { id: "password", label: "My Password" },
   { id: "preferences", label: "My Preferences" },
];

export default function AccountSettings() {
   const [active, setActive] = useState("profile");

   const [form, setForm] = useState({
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      role: "", // student | faculty | visitor
      budget: "", // under10 | 10to20 | 20to25 | 25plus
      dietary: {
         vegetarian: false,
         vegan: false,
         glutenFree: false,
         dairyFree: false,
         none: false,
      },
      matters: {
         quality: false,
         price: false,
         wait: false,
         healthy: false,
         study: false,
      },
      updates: {
         menu: false,
         bestTimes: false,
         friendActivity: false,
         none: false,
      },
   });

   const sectionEls = useRef({});

   const handleScrollTo = (id) => {
      const el = sectionEls.current[id];
      if (!el) return;

      const container = document.querySelector(
         ".content-container",
      );

      // if content-container isn't there, just do normal scroll
      if (!container) {
         el.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
         return;
      }

      // header height so the title doesn't get hidden
      const header = document.querySelector("header");
      const headerOffset = header
         ? header.getBoundingClientRect().height
         : 0;

      // extra space under the header
      const extraOffset = 16;
      const offset = headerOffset + extraOffset;

      const containerRect =
         container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // element position inside the scroll container
      const targetTop =
         elRect.top -
         containerRect.top +
         container.scrollTop -
         offset;

      container.scrollTo({
         top: targetTop,
         behavior: "smooth",
      });
   };

   // keeps sidebar highlight in sync while you scroll
   useEffect(() => {
      const container = document.querySelector(
         ".content-container",
      );
      if (!container) return;

      const header = document.querySelector("header");
      const headerHeight = header ? header.offsetHeight : 0;
      const offset = headerHeight + 24;

      const handleScroll = () => {
         const scrollTop = container.scrollTop;
         let current = "profile";

         sections.forEach((section) => {
            const el = sectionEls.current[section.id];
            if (!el) return;

            const sectionTop = el.offsetTop - offset;

            if (scrollTop >= sectionTop) {
               current = section.id;
            }
         });

         setActive(current);
      };

      container.addEventListener("scroll", handleScroll);
      handleScroll(); // run once when it loads

      return () =>
         container.removeEventListener(
            "scroll",
            handleScroll,
         );
   }, []);

   const onInput = (key) => (e) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

   const setRole = (value) => {
      setForm((p) => ({
         ...p,
         role: p.role === value ? "" : value,
      }));
   };

   const setBudget = (value) => {
      setForm((p) => ({
         ...p,
         budget: p.budget === value ? "" : value,
      }));
   };

   const toggleDietary = (key) => {
      setForm((p) => {
         const next = {
            ...p.dietary,
            [key]: !p.dietary[key],
         };

         // if "none" is checked, turn off the others
         if (key === "none" && next.none) {
            next.vegetarian = false;
            next.vegan = false;
            next.glutenFree = false;
            next.dairyFree = false;
         }

         // if any option is checked, turn off "none"
         if (key !== "none" && next[key]) {
            next.none = false;
         }

         return { ...p, dietary: next };
      });
   };

   const toggleUpdates = (key) => {
      setForm((p) => {
         const next = {
            ...p.updates,
            [key]: !p.updates[key],
         };

         // if "none" is checked, turn off the others
         if (key === "none" && next.none) {
            next.menu = false;
            next.bestTimes = false;
            next.friendActivity = false;
         }

         // if any option is checked, turn off "none"
         if (key !== "none" && next[key]) {
            next.none = false;
         }

         return { ...p, updates: next };
      });
   };

   const mattersKeys = useMemo(
      () => [
         { key: "quality", label: "Food quality" },
         { key: "price", label: "Price" },
         { key: "wait", label: "Short wait time" },
         { key: "healthy", label: "Healthy" },
         { key: "study", label: "Study-friendly" },
      ],
      [],
   );

   const toggleMatters = (key) => {
      setForm((p) => {
         const currentlySelected = Object.values(
            p.matters,
         ).filter(Boolean).length;
         const isOn = p.matters[key];

         // only allow up to 2
         if (!isOn && currentlySelected >= 2) return p;

         return {
            ...p,
            matters: { ...p.matters, [key]: !isOn },
         };
      });
   };

   return (
      <div className="as-page">
         {/* main layout */}
         <main className="as-main">
            <aside className="as-sidebar">
               <h2 className="as-sidebar-title">
                  Account Settings
               </h2>

               <nav className="as-nav">
                  {sections.map((s) => (
                     <button
                        key={s.id}
                        type="button"
                        className={`as-nav-item ${active === s.id ? "is-active" : ""}`}
                        onClick={() => handleScrollTo(s.id)}
                        aria-current={
                           active === s.id
                              ? "page"
                              : undefined
                        }
                     >
                        {s.label}
                     </button>
                  ))}
               </nav>
            </aside>

            <section className="as-content">
               {/* my profile */}
               <div
                  id="profile"
                  ref={(el) =>
                     (sectionEls.current.profile = el)
                  }
                  className="as-section"
               >
                  <h1 className="as-h1">My Profile</h1>

                  <div className="as-sub-title">
                     Your Profile Picture
                  </div>

                  <div className="as-profile-row">
                     <div className="as-profile-pic">
                        <img
                           src={addProfilePicture}
                           alt="Add profile"
                           className="as-profile-image"
                        />
                     </div>
                  </div>

                  <div className="as-field">
                     <label className="as-label">
                        Name
                     </label>
                     <div className="as-input-wrap">
                        <span
                           className="as-input-icon"
                           aria-hidden="true"
                        >
                           {/* user icon */}
                           <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                           >
                              <path
                                 d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.25c-4.2 0-7.5 2.1-7.5 4.5V21h15v-2.25c0-2.4-3.3-4.5-7.5-4.5Z"
                                 fill="currentColor"
                              />
                           </svg>
                        </span>

                        <input
                           className="as-input"
                           placeholder="Name"
                           value={form.name}
                           onChange={onInput("name")}
                        />
                     </div>
                  </div>

                  <div className="as-field">
                     <label className="as-label">
                        Email
                     </label>
                     <div className="as-input-wrap">
                        <span
                           className="as-input-icon"
                           aria-hidden="true"
                        >
                           {/* mail icon */}
                           <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                           >
                              <path
                                 d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 4-8 5L4 9V7l8 5 8-5Z"
                                 fill="currentColor"
                              />
                           </svg>
                        </span>

                        <input
                           className="as-input"
                           placeholder="Email"
                           value={form.email}
                           onChange={onInput("email")}
                        />
                     </div>
                  </div>

                  <button
                     className="as-btn as-btn-wide"
                     type="button"
                  >
                     Make This a Verified Cal Poly Account
                  </button>
               </div>

               {/* my password */}
               <div
                  id="password"
                  ref={(el) =>
                     (sectionEls.current.password = el)
                  }
                  className="as-section"
               >
                  <h2 className="as-h2">My Password</h2>

                  <div className="as-field">
                     <label className="as-label">
                        Current Password
                     </label>
                     <div className="as-input-wrap">
                        <span
                           className="as-input-icon"
                           aria-hidden="true"
                        >
                           {/* lock icon */}
                           <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                           >
                              <path
                                 d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 0V7a2 2 0 0 1 4 0v2h-4Z"
                                 fill="currentColor"
                              />
                           </svg>
                        </span>

                        <input
                           className="as-input"
                           type="password"
                           placeholder="Enter your current password"
                           value={form.currentPassword}
                           onChange={onInput(
                              "currentPassword",
                           )}
                        />
                     </div>
                  </div>

                  <div className="as-field">
                     <label className="as-label">
                        New Password
                     </label>
                     <div className="as-input-wrap">
                        <span
                           className="as-input-icon"
                           aria-hidden="true"
                        >
                           <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                           >
                              <path
                                 d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 0V7a2 2 0 0 1 4 0v2h-4Z"
                                 fill="currentColor"
                              />
                           </svg>
                        </span>

                        <input
                           className="as-input"
                           type="password"
                           placeholder="Enter your new password"
                           value={form.newPassword}
                           onChange={onInput("newPassword")}
                        />
                     </div>
                  </div>

                  <div className="as-field">
                     <label className="as-label">
                        Confirm New Password
                     </label>
                     <div className="as-input-wrap">
                        <span
                           className="as-input-icon"
                           aria-hidden="true"
                        >
                           <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                           >
                              <path
                                 d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-6 0V7a2 2 0 0 1 4 0v2h-4Z"
                                 fill="currentColor"
                              />
                           </svg>
                        </span>

                        <input
                           className="as-input"
                           type="password"
                           placeholder="Reenter your new password to verify"
                           value={form.confirmPassword}
                           onChange={onInput(
                              "confirmPassword",
                           )}
                        />
                     </div>
                  </div>

                  <button
                     className="as-btn as-btn-wide as-save"
                     type="button"
                  >
                     Save New Password
                  </button>
               </div>

               {/* my preferences */}
               <div
                  id="preferences"
                  ref={(el) =>
                     (sectionEls.current.preferences = el)
                  }
                  className="as-section"
               >
                  <h2 className="as-h2">My Preferences</h2>

                  <div className="as-block">
                     <h3 className="as-h3">
                        What best describes you?
                     </h3>

                     <div className="as-checks">
                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.role === "student"
                              }
                              onChange={() =>
                                 setRole("student")
                              }
                           />
                           <span>Cal Poly student</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.role === "faculty"
                              }
                              onChange={() =>
                                 setRole("faculty")
                              }
                           />
                           <span>Faculty/Staff</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.role === "visitor"
                              }
                              onChange={() =>
                                 setRole("visitor")
                              }
                           />
                           <span>Visitor/Local</span>
                        </label>
                     </div>
                  </div>

                  <div className="as-block">
                     <h3 className="as-h3">
                        What is your typical budget per
                        meal?
                     </h3>

                     <div className="as-checks">
                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.budget === "under10"
                              }
                              onChange={() =>
                                 setBudget("under10")
                              }
                           />
                           <span>Under $10</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.budget === "10to20"
                              }
                              onChange={() =>
                                 setBudget("10to20")
                              }
                           />
                           <span>$10–$20</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.budget === "20to25"
                              }
                              onChange={() =>
                                 setBudget("20to25")
                              }
                           />
                           <span>$20–$25</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.budget === "25plus"
                              }
                              onChange={() =>
                                 setBudget("25plus")
                              }
                           />
                           <span>$25+</span>
                        </label>
                     </div>
                  </div>

                  <div className="as-block">
                     <h3 className="as-h3">
                        Do you have any dietary preferences
                        or restrictions?
                     </h3>
                     <div className="as-hint">
                        Select all that apply:
                     </div>

                     <div className="as-checks">
                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.dietary.vegetarian
                              }
                              onChange={() =>
                                 toggleDietary("vegetarian")
                              }
                           />
                           <span>Vegetarian</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={form.dietary.vegan}
                              onChange={() =>
                                 toggleDietary("vegan")
                              }
                           />
                           <span>Vegan</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.dietary.glutenFree
                              }
                              onChange={() =>
                                 toggleDietary("glutenFree")
                              }
                           />
                           <span>Gluten-free</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.dietary.dairyFree
                              }
                              onChange={() =>
                                 toggleDietary("dairyFree")
                              }
                           />
                           <span>Dairy-free</span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={form.dietary.none}
                              onChange={() =>
                                 toggleDietary("none")
                              }
                           />
                           <span>No restrictions</span>
                        </label>
                     </div>
                  </div>

                  <div className="as-block">
                     <h3 className="as-h3">
                        What matters to you most when
                        choosing restaurants?
                     </h3>
                     <div className="as-hint">
                        Choose up to 2
                     </div>

                     <div className="as-checks">
                        {mattersKeys.map((m) => (
                           <label
                              key={m.key}
                              className="as-check"
                           >
                              <input
                                 type="checkbox"
                                 checked={
                                    form.matters[m.key]
                                 }
                                 onChange={() =>
                                    toggleMatters(m.key)
                                 }
                              />
                              <span>{m.label}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  <div className="as-block">
                     <h3 className="as-h3">
                        What updates would you like to
                        receive?
                     </h3>
                     <div className="as-hint">
                        Select all that apply:
                     </div>

                     <div className="as-checks">
                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={form.updates.menu}
                              onChange={() =>
                                 toggleUpdates("menu")
                              }
                           />
                           <span>
                              Restaurant menu updates
                           </span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.updates.bestTimes
                              }
                              onChange={() =>
                                 toggleUpdates("bestTimes")
                              }
                           />
                           <span>
                              Best times to order (avoid
                              long waits)
                           </span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={
                                 form.updates.friendActivity
                              }
                              onChange={() =>
                                 toggleUpdates(
                                    "friendActivity",
                                 )
                              }
                           />
                           <span>
                              Friend activity (reviews, new
                              friend requests)
                           </span>
                        </label>

                        <label className="as-check">
                           <input
                              type="checkbox"
                              checked={form.updates.none}
                              onChange={() =>
                                 toggleUpdates("none")
                              }
                           />
                           <span>No notifications</span>
                        </label>
                     </div>
                  </div>

                  <button
                     className="as-btn as-btn-wide as-save"
                     type="button"
                  >
                     Save Changes
                  </button>
               </div>
            </section>
         </main>
      </div>
   );
}
