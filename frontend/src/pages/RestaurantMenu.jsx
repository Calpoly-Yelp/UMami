import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import "./RestaurantMenu.css";

const displayValue = (value) =>
   value === null || value === undefined || value === ""
      ? "N/A"
      : value;

const renderDietaryIcons = (tags) => {
   if (!tags || tags.length === 0) return null;

   const icons = [];
   const tagStr = tags.join(" ").toLowerCase();

   // Use a single "VG" or "V" to avoid duplicate visual clutter
   if (
      tagStr.includes("vegan") ||
      tagStr.includes("plant-based")
   ) {
      icons.push(
         <span
            key="vegan"
            className="dietary-icon dietary-vegan"
            data-tooltip="Vegan"
         >
            VG
         </span>,
      );
   } else if (tagStr.includes("vegetarian")) {
      icons.push(
         <span
            key="veg"
            className="dietary-icon dietary-veg"
            data-tooltip="Vegetarian"
         >
            V
         </span>,
      );
   }

   if (
      tagStr.includes("gluten-free") ||
      tagStr.includes("gluten free") ||
      tagStr.includes("avoiding gluten") ||
      tags.some((t) => t.toLowerCase().trim() === "gf")
   ) {
      icons.push(
         <span
            key="gf"
            className="dietary-icon dietary-gf"
            data-tooltip="Gluten-Free"
         >
            GF
         </span>,
      );
   }

   if (icons.length === 0) return null;
   return <div className="dietary-icons-row">{icons}</div>;
};

export default function RestaurantMenu() {
   const navigate = useNavigate();
   const { id } = useParams();
   const [restaurantName, setRestaurantName] =
      useState("Loading...");
   const [restaurantBanner, setRestaurantBanner] =
      useState(null);
   const [menuData, setMenuData] = useState([]);
   const [activeCategory, setActiveCategory] = useState("");
   const [selectedItem, setSelectedItem] = useState(null);
   const [isMenuLoading, setIsMenuLoading] = useState(true);
   const [menuError, setMenuError] = useState("");

   useEffect(() => {
      const fetchRestaurant = async () => {
         try {
            const response = await fetch(
               `${API_BASE_URL}/api/restaurants/${id}`,
            );
            if (response.ok) {
               const data = await response.json();
               setRestaurantName(data.name);
               setRestaurantBanner(
                  data.image_urls?.[0] || null,
               );
            } else {
               setRestaurantName("Unknown Restaurant");
            }
         } catch (error) {
            console.error(
               "Failed to fetch restaurant:",
               error,
            );
            setRestaurantName("Unknown Restaurant");
         }
      };

      fetchRestaurant();
   }, [id]);

   useEffect(() => {
      const fetchMenu = async () => {
         try {
            setIsMenuLoading(true);
            setMenuError("");
            const response = await fetch(
               `${API_BASE_URL}/api/restaurants/${id}/menu`,
            );

            if (!response.ok) {
               throw new Error("Failed to fetch menu");
            }

            const data = await response.json();
            const sections = Array.isArray(data)
               ? data
               : [];

            setMenuData(sections);
            setActiveCategory(sections[0]?.category || "");
         } catch (error) {
            console.error("Failed to fetch menu:", error);
            setMenuError("Menu unavailable.");
            setMenuData([]);
            setActiveCategory("");
         } finally {
            setIsMenuLoading(false);
         }
      };

      fetchMenu();
   }, [id]);

   useEffect(() => {
      if (isMenuLoading || menuData.length === 0) return;

      const handleScroll = (e) => {
         // Ignore scroll events from the sidebar to prevent jitter
         if (
            e?.target?.classList?.contains(
               "menu-categories",
            )
         )
            return;

         const sectionElements = Array.from(
            document.querySelectorAll(".menu-section"),
         );
         let currentCategory = "";

         // Use the vertical center of the viewport as the trigger line
         const triggerLine = window.innerHeight / 2;

         for (const el of sectionElements) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= triggerLine) {
               currentCategory =
                  el.getAttribute("data-category");
            } else {
               break;
            }
         }

         if (
            !currentCategory &&
            sectionElements.length > 0
         ) {
            currentCategory =
               sectionElements[0].getAttribute(
                  "data-category",
               );
         }

         // Dynamically find the scroll container (handles if a specific div is scrolling instead of window)
         const scrollContainer =
            e?.target && e.target !== document
               ? e.target
               : document.documentElement;

         // Check if scrolled to the absolute bottom of the scroll container
         if (
            scrollContainer.scrollHeight -
               scrollContainer.scrollTop <=
               scrollContainer.clientHeight + 10 &&
            scrollContainer.scrollTop > 0
         ) {
            currentCategory =
               sectionElements[
                  sectionElements.length - 1
               ].getAttribute("data-category");
         }

         if (currentCategory)
            setActiveCategory(currentCategory);
      };

      // Use capture phase to catch scroll events from internal scrollable divs
      window.addEventListener("scroll", handleScroll, true);
      handleScroll(); // Initial check on mount

      return () =>
         window.removeEventListener(
            "scroll",
            handleScroll,
            true,
         );
   }, [isMenuLoading, menuData]);

   const scrollToCategory = (category) => {
      setActiveCategory(category);
      const el = document.getElementById(
         category.replace(/\s+/g, "-").toLowerCase(),
      );
      if (el) {
         el.scrollIntoView({
            behavior: "smooth",
            block: "start",
         });
      }
   };

   return (
      <div className="menu-page">
         <section
            className="menu-hero"
            style={{
               backgroundImage: restaurantBanner
                  ? `url(${restaurantBanner})`
                  : "none",
            }}
            aria-label={`${restaurantName} hero`}
         >
            <div className="hero-overlay" />

            <div className="hero-content">
               <button
                  type="button"
                  className="menu-backBtn"
                  onClick={() =>
                     navigate(`/restaurants/${id}`)
                  }
               >
                  Back to {restaurantName}
               </button>
               <h1 className="hero-title">
                  {restaurantName}
               </h1>
               <h2 className="hero-subtitle">
                  Menu & Nutrition
               </h2>
            </div>
         </section>

         <div className="menu-content">
            <aside className="menu-sidebar">
               <h3 className="menu-sidebar-title">
                  Categories
               </h3>
               <ul className="menu-categories">
                  {menuData.length > 0 ? (
                     menuData.map((section) => (
                        <li
                           key={section.category}
                           className={
                              activeCategory ===
                              section.category
                                 ? "is-active"
                                 : ""
                           }
                           onClick={() =>
                              scrollToCategory(
                                 section.category,
                              )
                           }
                        >
                           {section.category}
                        </li>
                     ))
                  ) : (
                     <li
                        className="is-disabled"
                        aria-disabled="true"
                     >
                        No categories
                     </li>
                  )}
               </ul>
            </aside>

            <main className="menu-items">
               {isMenuLoading && (
                  <p className="menu-empty">
                     Loading menu...
                  </p>
               )}

               {!isMenuLoading && menuError && (
                  <p className="menu-empty">{menuError}</p>
               )}

               {!isMenuLoading &&
                  !menuError &&
                  menuData.length === 0 && (
                     <p className="menu-empty">
                        Campus Dining has not posted a menu
                        for this restaurant yet.
                     </p>
                  )}

               {!isMenuLoading &&
                  !menuError &&
                  menuData.map((section) => (
                     <div
                        key={section.category}
                        className="menu-section"
                        id={section.category
                           .replace(/\s+/g, "-")
                           .toLowerCase()}
                        data-category={section.category}
                     >
                        <h3 className="menu-section-title">
                           {section.category}
                        </h3>
                        <table className="menu-table">
                           <thead>
                              <tr>
                                 <th>Menu Item</th>
                                 <th>Portion</th>
                                 <th>Calories</th>
                              </tr>
                           </thead>
                           <tbody>
                              {(section.items || []).map(
                                 (item) => (
                                    <tr
                                       key={
                                          item.id ||
                                          item.name
                                       }
                                       onClick={() =>
                                          setSelectedItem(
                                             item,
                                          )
                                       }
                                    >
                                       <td>
                                          <div
                                             style={{
                                                display:
                                                   "flex",
                                                alignItems:
                                                   "center",
                                                gap: "8px",
                                             }}
                                          >
                                             <span>
                                                {item.name}
                                             </span>
                                             {renderDietaryIcons(
                                                item.dietary_tags,
                                             )}
                                          </div>
                                       </td>
                                       <td>
                                          {displayValue(
                                             item.portion,
                                          )}
                                       </td>
                                       <td>
                                          {displayValue(
                                             item.calories,
                                          )}
                                       </td>
                                    </tr>
                                 ),
                              )}
                           </tbody>
                        </table>
                     </div>
                  ))}

               {!isMenuLoading &&
                  !menuError &&
                  menuData.length > 0 && (
                     <div className="menu-legend">
                        <div className="menu-legend-items">
                           <div className="menu-legend-item">
                              <span className="dietary-icon dietary-vegan">
                                 VG
                              </span>{" "}
                              Vegan
                           </div>
                           <div className="menu-legend-item">
                              <span className="dietary-icon dietary-veg">
                                 V
                              </span>{" "}
                              Vegetarian
                           </div>
                           <div className="menu-legend-item">
                              <span className="dietary-icon dietary-gf">
                                 GF
                              </span>{" "}
                              Gluten-Free
                           </div>
                        </div>
                        <p className="menu-disclaimer">
                           * Dietary tags are provided by
                           campus dining and may
                           occasionally be inaccurate.
                           Please verify with the restaurant
                           if you have a severe allergy.
                        </p>
                     </div>
                  )}
            </main>
         </div>

         {selectedItem && (
            <div
               className="modal-overlay"
               onClick={() => setSelectedItem(null)}
            >
               <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button
                     className="modal-close"
                     onClick={() => setSelectedItem(null)}
                  >
                     &times;
                  </button>
                  <h3 className="modal-title">
                     {selectedItem.name}
                  </h3>
                  <div className="modal-portion">
                     Portion:{" "}
                     {displayValue(selectedItem.portion)}
                  </div>
                  <div className="modal-nutrients">
                     <div className="modal-nutrient-row">
                        <span>Calories</span>
                        <span>
                           {displayValue(
                              selectedItem.calories,
                           )}
                        </span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Total Fat</span>
                        <span>
                           {displayValue(selectedItem.fat)}
                        </span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Total Carbohydrates</span>
                        <span>
                           {displayValue(
                              selectedItem.carbs,
                           )}
                        </span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Protein</span>
                        <span>
                           {displayValue(
                              selectedItem.protein,
                           )}
                        </span>
                     </div>
                     {selectedItem.dietary_tags &&
                        selectedItem.dietary_tags.length >
                           0 && (
                           <div className="modal-nutrient-row">
                              <span>Dietary</span>
                              <span
                                 style={{
                                    textAlign: "right",
                                    maxWidth: "65%",
                                 }}
                              >
                                 {selectedItem.dietary_tags.join(
                                    ", ",
                                 )}
                              </span>
                           </div>
                        )}
                     {selectedItem.allergens &&
                        selectedItem.allergens.length >
                           0 && (
                           <div className="modal-nutrient-row">
                              <span>Allergens</span>
                              <span
                                 style={{
                                    textAlign: "right",
                                    maxWidth: "65%",
                                 }}
                              >
                                 {selectedItem.allergens.join(
                                    ", ",
                                 )}
                              </span>
                           </div>
                        )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
