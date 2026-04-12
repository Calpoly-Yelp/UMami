import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import "./RestaurantMenu.css";

const menuData = [
   {
      category: "Signature Shakes",
      items: [
         {
            name: "Acai Energy",
            portion: "24 oz",
            calories: 350,
            fat: "8g",
            carbs: "50g",
            protein: "20g",
         },
         {
            name: "Perfect 10",
            portion: "24 oz",
            calories: 420,
            fat: "12g",
            carbs: "60g",
            protein: "30g",
         },
         {
            name: "Breakfast to Go",
            portion: "24 oz",
            calories: 380,
            fat: "10g",
            carbs: "45g",
            protein: "25g",
         },
      ],
   },
   {
      category: "Premium Shakes",
      items: [
         {
            name: "PB & A",
            portion: "24 oz",
            calories: 450,
            fat: "16g",
            carbs: "55g",
            protein: "28g",
         },
         {
            name: "Greens To Go",
            portion: "24 oz",
            calories: 320,
            fat: "5g",
            carbs: "40g",
            protein: "15g",
         },
      ],
   },
   {
      category: "Acai Bowls",
      items: [
         {
            name: "Traditional Acai",
            portion: "Bowl",
            calories: 550,
            fat: "15g",
            carbs: "90g",
            protein: "10g",
         },
         {
            name: "Peanut Butter Acai",
            portion: "Bowl",
            calories: 650,
            fat: "25g",
            carbs: "80g",
            protein: "20g",
         },
      ],
   },
   {
      category: "Cold Brew Coffee",
      items: [
         {
            name: "Cold Brew",
            portion: "16 oz",
            calories: 15,
            fat: "0g",
            carbs: "3g",
            protein: "1g",
         },
         {
            name: "Vanilla Cold Brew",
            portion: "16 oz",
            calories: 60,
            fat: "0g",
            carbs: "12g",
            protein: "1g",
         },
      ],
   },
   {
      category: "Oatmeal & Yogurt",
      items: [
         {
            name: "Oatmeal",
            portion: "Bowl",
            calories: 150,
            fat: "3g",
            carbs: "27g",
            protein: "5g",
         },
         {
            name: "Greek Yogurt Parfait",
            portion: "Cup",
            calories: 220,
            fat: "4g",
            carbs: "30g",
            protein: "18g",
         },
      ],
   },
   {
      category: "Toast",
      items: [
         {
            name: "Avocado Toast",
            portion: "1 slice",
            calories: 250,
            fat: "15g",
            carbs: "20g",
            protein: "6g",
         },
         {
            name: "PB & Banana Toast",
            portion: "1 slice",
            calories: 300,
            fat: "14g",
            carbs: "35g",
            protein: "9g",
         },
      ],
   },
   {
      category: "Extras",
      items: [
         {
            name: "Whey Protein",
            portion: "1 scoop",
            calories: 120,
            fat: "1.5g",
            carbs: "3g",
            protein: "24g",
         },
         {
            name: "Peanut Butter",
            portion: "1 scoop",
            calories: 90,
            fat: "8g",
            carbs: "3g",
            protein: "4g",
         },
      ],
   },
];

export default function RestaurantMenu() {
   const { id } = useParams();
   const [restaurantName, setRestaurantName] =
      useState("Loading...");
   const [restaurantBanner, setRestaurantBanner] =
      useState(null);
   const [activeCategory, setActiveCategory] = useState(
      menuData[0].category,
   );
   const [selectedItem, setSelectedItem] = useState(null);

   useEffect(() => {
      const fetchRestaurant = async () => {
         try {
            const response = await fetch(
               `http://localhost:4000/api/restaurants/${id}`,
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
                  {menuData.map((section) => (
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
                  ))}
               </ul>
            </aside>

            <main className="menu-items">
               {menuData.map((section, idx) => (
                  <div
                     key={idx}
                     className="menu-section"
                     id={section.category
                        .replace(/\s+/g, "-")
                        .toLowerCase()}
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
                           {section.items.map(
                              (item, itemIdx) => (
                                 <tr
                                    key={itemIdx}
                                    onClick={() =>
                                       setSelectedItem(item)
                                    }
                                 >
                                    <td>{item.name}</td>
                                    <td>{item.portion}</td>
                                    <td>{item.calories}</td>
                                 </tr>
                              ),
                           )}
                        </tbody>
                     </table>
                  </div>
               ))}
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
                     Portion: {selectedItem.portion}
                  </div>
                  <div className="modal-nutrients">
                     <div className="modal-nutrient-row">
                        <span>Calories</span>
                        <span>{selectedItem.calories}</span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Total Fat</span>
                        <span>{selectedItem.fat}</span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Total Carbohydrates</span>
                        <span>{selectedItem.carbs}</span>
                     </div>
                     <div className="modal-nutrient-row">
                        <span>Protein</span>
                        <span>{selectedItem.protein}</span>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
