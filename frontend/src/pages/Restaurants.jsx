import {
   useState,
   useEffect,
   useRef,
   useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard.jsx";
import { MagnifyingGlass } from "@phosphor-icons/react";
import "./Restaurants.css";

function Restaurants({ restaurants: initialRestaurants }) {
   const [query, setQuery] = useState("");
   const [restaurants, setRestaurants] = useState(
      initialRestaurants || [],
   );
   const [bookmarkedIds, setBookmarkedIds] = useState(
      () =>
         new Set(
            initialRestaurants?.map((r) => r.id) || [],
         ),
   );
   const [loading, setLoading] = useState(
      !initialRestaurants,
   );
   const [error, setError] = useState("");

   const navigate = useNavigate();

   const originalBookmarkedIdsRef = useRef(
      new Set(initialRestaurants?.map((r) => r.id) || []),
   );
   const bookmarkedIdsRef = useRef(new Set());

   useEffect(() => {
      bookmarkedIdsRef.current = bookmarkedIds;
   }, [bookmarkedIds]);

   useEffect(() => {
      if (initialRestaurants) return;

      const fetchData = async () => {
         try {
            setLoading(true);
            setError("");

            const storedUser = JSON.parse(
               localStorage.getItem("user"),
            );
            const userId = storedUser?.id;

            const restaurantsResponse = await fetch(
               "http://localhost:4000/api/restaurants",
            );

            if (!restaurantsResponse.ok) {
               let message = "Failed to fetch restaurants";
               try {
                  const err =
                     await restaurantsResponse.json();
                  message = err.error || message;
               } catch {
                  // ignore
               }
               throw new Error(message);
            }

            const restaurantsData =
               await restaurantsResponse.json();

            const mappedRestaurants = restaurantsData.map(
               (r) => ({
                  id: r.id,
                  name: r.name || "Unnamed Restaurant",
                  image:
                     r.image_urls?.[0] ||
                     "https://placehold.co/300x200/003831/FFFFFF?text=Restaurant",
                  avg_rating: r.avg_rating ?? 0,
                  location: r.location || "",
                  tags: r.tags || [],
                  hours: r.hours || [],
                  rating_count: r.rating_count ?? 0,
                  rating_sum: r.rating_sum ?? 0,
               }),
            );

            setRestaurants(mappedRestaurants);

            if (userId) {
               const bookmarksResponse = await fetch(
                  `http://localhost:4000/api/restaurants/bookmarks/${userId}`,
               );

               if (bookmarksResponse.ok) {
                  const bookmarkedRestaurants =
                     await bookmarksResponse.json();

                  const mappedBookmarkedRestaurants =
                     bookmarkedRestaurants.map((r) => ({
                        id: r.id,
                        name:
                           r.name || "Unnamed Restaurant",
                        image:
                           r.image_urls?.[0] ||
                           "https://placehold.co/300x200/003831/FFFFFF?text=Restaurant",
                        avg_rating: r.avg_rating ?? 0,
                        location: r.location || "",
                        tags: r.tags || [],
                        hours: r.hours || [],
                        rating_count: r.rating_count ?? 0,
                        rating_sum: r.rating_sum ?? 0,
                     }));

                  const ids = new Set(
                     mappedBookmarkedRestaurants.map(
                        (r) => r.id,
                     ),
                  );

                  setBookmarkedIds(ids);
                  originalBookmarkedIdsRef.current =
                     new Set(ids);
               }
            }
         } catch (err) {
            console.error("Error loading data:", err);
            setError(
               err.message || "Failed to load restaurants.",
            );
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [initialRestaurants]);

   useEffect(() => {
      const syncBookmarks = () => {
         const storedUser = JSON.parse(
            localStorage.getItem("user"),
         );
         const userId = storedUser?.id;

         if (!userId) return;

         const original = originalBookmarkedIdsRef.current;
         const current = bookmarkedIdsRef.current;

         const added = [...current].filter(
            (id) => !original.has(id),
         );
         const removed = [...original].filter(
            (id) => !current.has(id),
         );

         if (added.length === 0 && removed.length === 0)
            return;

         fetch(
            "http://localhost:4000/api/restaurants/bookmarks/sync",
            {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  user_id: userId,
                  added,
                  removed,
               }),
               keepalive: true,
            },
         );
      };

      window.addEventListener(
         "beforeunload",
         syncBookmarks,
      );

      return () => {
         window.removeEventListener(
            "beforeunload",
            syncBookmarks,
         );
         syncBookmarks();
      };
   }, []);

   const handleBookmarkToggle = (restaurantId) => {
      setBookmarkedIds((prev) => {
         const next = new Set(prev);
         if (next.has(restaurantId)) {
            next.delete(restaurantId);
         } else {
            next.add(restaurantId);
         }
         return next;
      });
   };

   const handleCardClick = (restaurant) => {
      navigate(`/restaurants/${restaurant.id}`);
   };

   const visibleRestaurants = useMemo(() => {
      const lowerQuery = query.toLowerCase();

      return restaurants.filter((restaurant) => {
         const nameMatch = restaurant.name
            ?.toLowerCase()
            .includes(lowerQuery);

         const locationMatch = restaurant.location
            ?.toLowerCase()
            .includes(lowerQuery);

         const tagsMatch = (restaurant.tags || []).some(
            (tag) => tag.toLowerCase().includes(lowerQuery),
         );

         return nameMatch || locationMatch || tagsMatch;
      });
   }, [restaurants, query]);

   return (
      <div className="restaurants-page">
         <div className="restaurants-content">
            <h1 className="restaurants-title">
               All Restaurants
            </h1>

            <div className="restaurants-controls">
               <div className="search-wrap">
                  <MagnifyingGlass
                     size={18}
                     weight="regular"
                     className="search-icon"
                  />
                  <input
                     className="search-input"
                     placeholder="Search restaurants"
                     value={query}
                     onChange={(e) =>
                        setQuery(e.target.value)
                     }
                  />
               </div>
            </div>

            {loading && <p>Loading restaurants...</p>}
            {!loading && error && <p>{error}</p>}
            {!loading &&
               !error &&
               visibleRestaurants.length === 0 && (
                  <p>No restaurants found.</p>
               )}

            <div className="restaurants-grid">
               {visibleRestaurants.map(
                  (restaurant, index) => (
                     <div
                        key={
                           restaurant.id ??
                           `${restaurant.name ?? "restaurant"}-${index}`
                        }
                        onClick={() =>
                           handleCardClick(restaurant)
                        }
                        style={{ cursor: "pointer" }}
                     >
                        <RestaurantCard
                           restaurant={restaurant}
                           isBookmarked={bookmarkedIds.has(
                              restaurant.id,
                           )}
                           onToggle={() =>
                              handleBookmarkToggle(
                                 restaurant.id,
                              )
                           }
                        />
                     </div>
                  ),
               )}
            </div>
         </div>
      </div>
   );
}

export default Restaurants;
