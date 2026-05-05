import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";
import * as dotenv from "dotenv";
import { fetchDineOnCampusSource } from "./scrapeCurrentMenus.js";

dotenv.config();

// To run this scraper manually from /backend, use the following command:
// node utils/restaurantScraper.js

const DINE_ON_CAMPUS_URL =
   "https://apiv4.dineoncampus.com/sites/59fb66f5a23ef231d62ed495/locations-public?for_map=true";

// Dynamically get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];
const WEEKLY_SCHEDULE_URL = `https://apiv4.dineoncampus.com/locations/weekly_schedule?site_id=59fb66f5a23ef231d62ed495&date=${today}`;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service key needed to bypass RLS when upserting from backend

if (!supabaseUrl || !supabaseKey) {
   console.warn(
      "Supabase credentials missing. Scraper will not run.",
   );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const scrapeRestaurants = async () => {
   console.log("Starting Dine On Campus scrape...");
   try {
      console.log(
         "Fetching location data via Playwright...",
      );
      const locationText = await fetchDineOnCampusSource(
         DINE_ON_CAMPUS_URL,
      );

      console.log("Parsing response...");
      const apiData = JSON.parse(locationText);

      // Safely attempt to find the array of locations
      let locations = [];
      if (Array.isArray(apiData)) {
         locations = apiData;
      } else if (apiData && Array.isArray(apiData.data)) {
         locations = apiData.data;
      } else if (
         apiData &&
         Array.isArray(apiData.locations)
      ) {
         locations = apiData.locations;
      } else if (
         apiData &&
         Array.isArray(apiData.buildings)
      ) {
         locations = apiData.buildings.flatMap(
            (building) => {
               return (building.locations || []).map(
                  (loc) => ({
                     ...loc,
                     buildingName: building.buildingName,
                  }),
               );
            },
         );
      } else {
         console.error("\n--- UNEXPECTED API RESPONSE ---");
         console.error(
            JSON.stringify(apiData, null, 2).substring(
               0,
               1000,
            ),
         ); // Print up to 1000 chars of the raw response
         throw new Error(
            "Could not find an array of locations in the API response.",
         );
      }

      console.log(
         `Found ${locations.length} raw locations from API. Grouping into unique restaurants...`,
      );

      console.log(
         "Fetching weekly schedule data via Playwright...",
      );
      let scheduleData = null;
      try {
         const scheduleText = await fetchDineOnCampusSource(
            WEEKLY_SCHEDULE_URL,
         );
         scheduleData = JSON.parse(scheduleText);
      } catch (err) {
         console.warn(
            "Could not fetch weekly schedule:",
            err.message,
         );
      }

      const getNames = (name) => {
         let baseName = name
            .replace(
               /\s*-\s*(Breakfast|Lunch|Dinner|Late Night|Brunch)\s*$/i,
               "",
            )
            .trim();
         let subNameMatch = name.match(
            /\s*-\s*(Breakfast|Lunch|Dinner|Late Night|Brunch)\s*$/i,
         );
         let subName = subNameMatch
            ? subNameMatch[1]
            : "Default";

         if (baseName.includes("Wednesday BBQ")) {
            baseName = "Grill at Campus Market";
            subName = "BBQ";
         }

         return { baseName, subName };
      };

      const scheduleIntervals = {};
      const scheduleImages = {}; // Collect images from schedule data just in case

      // Recursively search any object for strings that look like images
      const extractImages = (obj, imageSet) => {
         if (!obj) {
            return;
         }
         if (typeof obj === "string") {
            const hasImageExt = obj.match(
               /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i,
            );
            const hasUploadsPath =
               obj.includes("uploads/images/") ||
               obj.includes("uploads/locations/");
            const isHexFilename = obj.match(
               /^[a-f0-9]{32}(\.(jpeg|jpg|gif|png|webp))?$/i,
            ); // Matches 32-char hash with or without extension

            if (
               hasImageExt ||
               hasUploadsPath ||
               isHexFilename
            ) {
               if (obj.startsWith("http")) {
                  imageSet.add(obj);
               } else if (obj.includes("uploads/")) {
                  imageSet.add(
                     `https://apiv4.dineoncampus.com${obj.startsWith("/") ? "" : "/"}${obj}`,
                  );
               } else if (isHexFilename) {
                  // It's a raw hash, manually construct the URL
                  const cleanName = obj.includes(".")
                     ? obj
                     : `${obj}.jpg`;
                  imageSet.add(
                     `https://apiv4.dineoncampus.com/uploads/images/${cleanName}`,
                  );
               }
            }
         } else if (Array.isArray(obj)) {
            obj.forEach((item) =>
               extractImages(item, imageSet),
            );
         } else if (typeof obj === "object") {
            Object.values(obj).forEach((val) =>
               extractImages(val, imageSet),
            );
         }
      };

      // Attempt to extract tags from API fields or infer them from keywords
      const extractTags = (obj, baseName, tagSet) => {
         if (!obj) {
            return;
         }

         // 1. Try to grab explicit tags/categories from the API
         const apiCategories =
            obj.categories ||
            obj.tags ||
            obj.concept_types ||
            obj.concept_type ||
            [];
         const categoriesArray = Array.isArray(
            apiCategories,
         )
            ? apiCategories
            : typeof apiCategories === "string"
              ? apiCategories.split(",")
              : [apiCategories];

         categoriesArray.forEach((c) => {
            let rawTag = null;
            if (typeof c === "string" && c.trim()) {
               rawTag = c.trim();
            } else if (
               c &&
               typeof c === "object" &&
               c.name &&
               typeof c.name === "string"
            ) {
               rawTag = c.name.trim();
            }
            if (rawTag) {
               tagSet.add(
                  rawTag.charAt(0).toUpperCase() +
                     rawTag.slice(1).toLowerCase(),
               );
            }
         });

         // 2. Infer from name and description using keywords
         const textToSearch =
            `${baseName} ${obj.description || ""} ${obj.short_description || ""}`.toLowerCase();

         const keywordMapping = {
            Coffee: [
               "coffee",
               "starbucks",
               "espresso",
               "cafe",
               "café",
               "julian's",
               "scout",
            ],
            Sandwiches: [
               "sandwich",
               "deli",
               "sub",
               "craftwich",
               "subway",
               "mingle + nosh",
               "mingle and nosh",
               "what's cookin",
               "einstein",
            ],
            Burgers: ["burger", "grill"],
            Mexican: [
               "taco",
               "burrito",
               "mexican",
               "quesadilla",
               "picos",
               "streats",
               "taqueria",
               "g. brothers",
               "taco bell",
            ],
            Sushi: ["sushi", "roll", "bento"],
            Pizza: ["pizza", "slice", "hearth"],
            Healthy: [
               "salad",
               "produce",
               "balance",
               "green",
               "red radish",
               "health shack",
               "poly choice",
               "plant ivy",
               "pom & honey",
               "jamba",
               "sequel",
               "shake smart",
            ],
            Breakfast: [
               "breakfast",
               "morning",
               "brunch",
               "bagel",
               "einstein",
            ],
            Vegan: [
               "vegan",
               "plant-based",
               "plant based",
               "plant ivy",
               "vegetarian",
               "red radish",
            ],
            Smoothies: [
               "smoothie",
               "acai",
               "shake",
               "jamba",
               "sequel",
               "health shack",
               "shake smart",
            ],
            Asian: [
               "asian",
               "noodles",
               "wok",
               "teriyaki",
               "panda express",
               "jewel of india",
            ],
            Indian: [
               "indian",
               "jewel of india",
               "curry",
               "tikka",
            ],
            Mediterranean: [
               "mediterranean",
               "pom & honey",
               "pita",
               "falafel",
            ],
            Dessert: [
               "sweet",
               "bakery",
               "treat",
               "pastry",
               "julian's",
            ],
            Halal: ["halal"],
            Kosher: ["kosher", "what's cookin"],
            Convenience: ["market", "express", "snacks"],
            Chicken: ["chick-fil-a", "chicken", "wings"],
            "Comfort Food": [
               "1901 kitchen",
               "comfort",
               "kitchen",
               "hearth",
               "noodles",
               "streats",
               "grill",
               "panda express",
               "brunch",
               "jewel of india",
               "balance",
            ],
            "Fast Food": [
               "fast food",
               "chick-fil-a",
               "panda express",
               "taco bell",
               "picos",
               "subway",
               "g. brothers",
            ],
            "Allergy-Friendly": [
               "poly choice",
               "allergen free",
               "gluten-free",
               "balance",
            ],
            American: [
               "1901 kitchen",
               "burger",
               "grill",
               "brunch",
               "plant ivy",
               "chick-fil-a",
               "poly choice",
               "american",
            ],
            Cafe: [
               "coffee",
               "starbucks",
               "julian's",
               "scout",
               "einstein",
               "cafe",
               "café",
            ],
            Beverages: [
               "coffee",
               "starbucks",
               "jamba",
               "sequel",
               "shake smart",
               "scout",
               "smoothie",
               "boba",
               "tea",
               "julian's",
               "beverage",
            ],
            "Quick Bites": [
               "express",
               "market",
               "snacks",
               "deli",
               "convenience",
               "grab & go",
               "picos",
               "mingle + nosh",
               "streats",
               "health shack",
               "g. brothers",
               "quick bite",
            ],
            Salads: [
               "salad",
               "red radish",
               "green",
               "lettuce",
            ],
            Bowls: [
               "bowl",
               "pom & honey",
               "plant ivy",
               "balance",
               "noodles",
            ],
            Deli: [
               "deli",
               "subway",
               "what's cookin",
               "craftwich",
               "mingle + nosh",
               "market grand ave",
            ],
            Bakery: [
               "bakery",
               "einstein",
               "bagel",
               "pastry",
               "scout",
               "sweet",
               "julian's",
            ],
            "Late Night": [
               "taco bell",
               "late night",
               "subway at pcv",
               "pcv",
            ],
            Protein: [
               "protein",
               "shake smart",
               "chicken",
               "chick-fil-a",
            ],
            Italian: [
               "pizza",
               "pasta",
               "hearth",
               "italian",
            ],
            Lunch: [
               "1901 kitchen",
               "red radish",
               "poly choice",
               "balance",
               "subway",
               "panda express",
               "what's cookin",
               "lunch",
            ],
            Dinner: [
               "1901 kitchen",
               "noodles",
               "hearth",
               "panda express",
               "streats",
               "balance",
               "dinner",
            ],
         };

         for (const [tag, keywords] of Object.entries(
            keywordMapping,
         )) {
            if (
               keywords.some((kw) =>
                  textToSearch.includes(kw),
               )
            ) {
               tagSet.add(tag);
            }
         }
      };

      if (scheduleData) {
         const scheduleLocations =
            scheduleData.theLocations ||
            scheduleData.locations ||
            scheduleData.buildings ||
            scheduleData.data ||
            [];

         for (const loc of scheduleLocations) {
            if (
               !loc.name ||
               !loc.week ||
               !Array.isArray(loc.week)
            ) {
               continue;
            }

            const { baseName, subName } = getNames(
               loc.name,
            );

            if (!scheduleImages[baseName]) {
               scheduleImages[baseName] = new Set();
            }
            extractImages(loc, scheduleImages[baseName]);

            if (!scheduleIntervals[baseName]) {
               scheduleIntervals[baseName] = Array.from(
                  { length: 7 },
                  () => [],
               );
            }

            for (const d of loc.week) {
               const targetIdx =
                  d.day === 0 ? 6 : d.day - 1; // Map day 0 (Sun) to index 6, day 1 (Mon) to index 0
               if (
                  d.status === "open" &&
                  !d.closed &&
                  d.hours &&
                  d.hours.length > 0
               ) {
                  for (const h of d.hours) {
                     const startStr = `${String(h.start_hour).padStart(2, "0")}:${String(h.start_minutes).padStart(2, "0")}:00`;
                     const endStr = `${String(h.end_hour).padStart(2, "0")}:${String(h.end_minutes).padStart(2, "0")}:00`;
                     scheduleIntervals[baseName][
                        targetIdx
                     ].push({
                        start: startStr,
                        end: endStr,
                        subName: subName,
                     });
                  }
               }
            }
         }
      }

      const hoursMap = {};
      for (const [baseName, week] of Object.entries(
         scheduleIntervals,
      )) {
         const weekHours = new Array(42).fill(null); // Accommodate up to 3 intervals (6 times) per day
         let hasHours = false;

         for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const dayIntervals = week[dayIdx].sort((a, b) =>
               a.start.localeCompare(b.start),
            );

            // Merge overlapping intervals (e.g. Wednesday BBQ grouping with Market)
            const mergedIntervals = [];
            for (const interval of dayIntervals) {
               if (mergedIntervals.length === 0) {
                  mergedIntervals.push({ ...interval });
               } else {
                  const last =
                     mergedIntervals[
                        mergedIntervals.length - 1
                     ];
                  const lastCrossesMidnight =
                     last.end < last.start;
                  const intCrossesMidnight =
                     interval.end < interval.start;

                  if (
                     lastCrossesMidnight ||
                     interval.start <= last.end
                  ) {
                     if (
                        intCrossesMidnight &&
                        !lastCrossesMidnight
                     ) {
                        last.end = interval.end;
                     } else if (
                        !lastCrossesMidnight &&
                        !intCrossesMidnight &&
                        interval.end > last.end
                     ) {
                        last.end = interval.end;
                     } else if (
                        lastCrossesMidnight &&
                        intCrossesMidnight &&
                        interval.end > last.end
                     ) {
                        last.end = interval.end;
                     }
                  } else {
                     mergedIntervals.push({ ...interval });
                  }
               }
            }

            for (
               let i = 0;
               i < Math.min(mergedIntervals.length, 3);
               i++
            ) {
               weekHours[dayIdx * 6 + i * 2] =
                  mergedIntervals[i].start;
               weekHours[dayIdx * 6 + i * 2 + 1] =
                  mergedIntervals[i].end;
               hasHours = true;
            }
         }

         if (hasHours) {
            hoursMap[baseName] = weekHours;
         }
      }

      const groupedLocations = {};
      for (const loc of locations) {
         const { baseName } = getNames(loc.name);
         if (!groupedLocations[baseName]) {
            groupedLocations[baseName] = [];
         }
         groupedLocations[baseName].push(loc);
      }

      const mappedRestaurants = Object.entries(
         groupedLocations,
      ).map(([baseName, locs]) => {
         const uniqueLocationNames = [
            ...new Set(
               locs
                  .map(
                     (l) =>
                        l.buildingName ||
                        l.building ||
                        l.location,
                  )
                  .filter(Boolean),
            ),
         ];
         const locationStr =
            uniqueLocationNames.join(" / ") || null;

         let lat = null;
         let lng = null;
         let menuSourceUrl = null;
         const imageUrls = new Set();
         const tags = new Set();

         // Grab any images we found in the schedule data for this restaurant
         if (scheduleImages[baseName]) {
            scheduleImages[baseName].forEach((img) =>
               imageUrls.add(img),
            );
         }

         const locationMapping = {
            locations: {},
            schedule: [],
         };

         // Fill schedule from scheduleIntervals
         if (scheduleIntervals[baseName]) {
            for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
               const dayIntervals = scheduleIntervals[
                  baseName
               ][dayIdx].sort((a, b) =>
                  a.start.localeCompare(b.start),
               );
               locationMapping.schedule.push(dayIntervals);
            }
         }

         for (const loc of locs) {
            const { subName } = getNames(loc.name);

            let currentLat = loc.latitude
               ? parseFloat(loc.latitude)
               : null;
            let currentLng = loc.longitude
               ? parseFloat(loc.longitude)
               : null;

            const locId =
               loc.id || loc._id || loc.location_id;
            if (!menuSourceUrl && locId) {
               menuSourceUrl = `https://apiv4.dineoncampus.com/locations/${locId}/menu`;
            }

            if (
               loc.address &&
               typeof loc.address === "object"
            ) {
               const { lat: addrLat, lon: addrLon } =
                  loc.address;
               if (addrLat) {
                  currentLat = parseFloat(addrLat);
               }
               if (addrLon) {
                  currentLng = parseFloat(addrLon);
               }
            }

            // Recursively extract all images from this location object
            extractImages(loc, imageUrls);

            // Attempt to extract tags
            extractTags(loc, baseName, tags);

            locationMapping.locations[subName] = {
               lat: currentLat,
               lng: currentLng,
               label:
                  loc.buildingName ||
                  loc.building ||
                  loc.location ||
                  null,
            };

            if (
               currentLat !== null &&
               currentLng !== null &&
               lat === null
            ) {
               lat = currentLat;
               lng = currentLng;
            }
         }

         return {
            name: baseName,
            location: locationStr,
            lat: lat,
            lng: lng,
            hours: hoursMap[baseName] || null,
            image_urls: Array.from(imageUrls),
            tags: Array.from(tags),
            menu_source_url: menuSourceUrl,
            location_mapping: locationMapping,
         };
      });

      console.log(
         `Consolidated into ${mappedRestaurants.length} unique restaurants.`,
      );

      // Fix Balance Cafe location to match Hearth
      const hearthRest = mappedRestaurants.find(
         (r) =>
            r.name &&
            r.name.toLowerCase().includes("hearth"),
      );
      const balanceCafe = mappedRestaurants.find(
         (r) =>
            r.name &&
            r.name.toLowerCase().includes("balance café"),
      );

      if (balanceCafe && hearthRest) {
         balanceCafe.lat = hearthRest.lat;
         balanceCafe.lng = hearthRest.lng;
         balanceCafe.location = hearthRest.location;
         if (
            balanceCafe.location_mapping &&
            hearthRest.location_mapping
         ) {
            balanceCafe.location_mapping.locations =
               hearthRest.location_mapping.locations;
         }
      }

      const EXCLUDED_LOCATIONS = [
         "hilltop",
         "poly produce",
         "market at grand ave",
         "salad bar at campus market",
         "campus market",
         "sweet bar",
      ];

      const restaurantsToUpsert = mappedRestaurants.filter(
         (restaurant) =>
            restaurant.hours !== null &&
            !EXCLUDED_LOCATIONS.includes(
               restaurant.name.toLowerCase(),
            ),
      );
      const skippedRestaurants = mappedRestaurants.filter(
         (restaurant) =>
            restaurant.hours === null ||
            EXCLUDED_LOCATIONS.includes(
               restaurant.name.toLowerCase(),
            ),
      );

      if (skippedRestaurants.length > 0) {
         console.log(
            `Skipped ${skippedRestaurants.length} restaurants:`,
         );
         console.log(
            skippedRestaurants
               .map((r) => {
                  const reason =
                     EXCLUDED_LOCATIONS.includes(
                        r.name.toLowerCase(),
                     )
                        ? "Explicitly excluded"
                        : "Missing hours";
                  return `  - ${r.name} (${reason})`;
               })
               .join("\n"),
         );
      }

      if (restaurantsToUpsert.length === 0) {
         console.log("No locations found.");
         return;
      }

      console.log(
         `Upserting ${restaurantsToUpsert.length} records to Supabase...`,
      );
      const { error } = await supabase
         .from("restaurants")
         .upsert(restaurantsToUpsert, {
            onConflict: "name",
         });

      if (error) {
         throw error;
      }
      console.log(
         `Successfully scraped and upserted ${restaurantsToUpsert.length} locations.`,
      );
   } catch (error) {
      console.error("Error scraping restaurants:");
      console.error(error); // Logs the full error object, including stack traces and detailed Supabase objects
   }
};

// Schedule to run every Monday at 8:00 AM (local server time)
if (process.env.NODE_ENV !== "test") {
   cron.schedule("0 8 * * 1", scrapeRestaurants);
}

// Allow running the scraper manually from the command line
const isMainScraper =
   process.argv[1] &&
   process.argv[1].endsWith("restaurantScraper.js");
if (isMainScraper) {
   scrapeRestaurants()
      .then(() => process.exit(0))
      .catch((error) => {
         console.error(error);
         process.exit(1);
      });
}
