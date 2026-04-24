import { supabase } from "../config/supabaseClient.js";

const delay = (ms) =>
   new Promise((resolve) => setTimeout(resolve, ms));

// Quick example of geocoding a location string
async function getCoordinates(locationString) {
   const query = encodeURIComponent(locationString);
   // Ensure you add a custom User-Agent per Nominatim's terms of service
   const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
         headers: {
            "User-Agent":
               "UMamiApp/1.0 (CSC308-Student-Project)",
         },
      },
   );

   if (!response.ok) {
      const errorText = await response.text();
      console.error(
         `Nominatim API Error (${response.status}):`,
         errorText,
      );
      return null;
   }

   const data = await response.json();

   if (data && data.length > 0) {
      return {
         lat: parseFloat(data[0].lat),
         lng: parseFloat(data[0].lon), // Nominatim uses 'lon', but your DB will use 'lng'
      };
   }
   return null;
}

async function geocodeAllRestaurants() {
   console.log("Fetching restaurants from database...");
   const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("id, street_address, name, lat, lng");

   if (error) {
      console.error("Error fetching restaurants:", error);
      return;
   }

   console.log(
      `Found ${restaurants.length} restaurants. Clearing existing coordinates...`,
   );

   const restaurantIds = restaurants.map((r) => r.id);
   if (restaurantIds.length > 0) {
      const { error: clearError } = await supabase
         .from("restaurants")
         .update({ lat: null, lng: null })
         .in("id", restaurantIds);

      if (clearError) {
         console.error(
            "Failed to clear existing coordinates:",
            clearError,
         );
         return;
      }
   }

   console.log(
      "Coordinates successfully cleared. Starting geocoding...",
   );

   for (const restaurant of restaurants) {
      // Skip if no street_address is provided
      if (!restaurant.street_address) {
         console.log(
            `Skipping ${restaurant.name || `Restaurant ${restaurant.id}`} (no street address)`,
         );
         continue;
      }

      console.log(
         `Geocoding ${restaurant.name || `Restaurant ${restaurant.id}`} at "${restaurant.street_address}"...`,
      );

      try {
         const coords = await getCoordinates(
            restaurant.street_address,
         );

         if (coords) {
            const { error: updateError } = await supabase
               .from("restaurants")
               .update({ lat: coords.lat, lng: coords.lng })
               .eq("id", restaurant.id);

            if (updateError) {
               console.error(
                  `Failed to update ${restaurant.name} in DB:`,
                  updateError,
               );
            } else {
               console.log(
                  `Successfully updated ${restaurant.name} with coords: ${coords.lat}, ${coords.lng}`,
               );
            }
         } else {
            console.log(
               `Could not find coordinates for ${restaurant.name}`,
            );
         }
      } catch (err) {
         console.error(
            `Error geocoding ${restaurant.name}:`,
            err,
         );
      }

      // Strict delay for Nominatim rate limit (1 request per second)
      await delay(1200);
   }

   console.log("Geocoding complete!");
}

// Run the script
geocodeAllRestaurants();
