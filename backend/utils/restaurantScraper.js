import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";
import * as dotenv from "dotenv";

dotenv.config();

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
      // Cloudflare blocked AllOrigins (520). Let's use corsproxy.io which returns raw JSON directly.
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(DINE_ON_CAMPUS_URL)}`;
      console.log("Fetching data via proxy...");
      const response = await fetch(proxyUrl, {
         headers: {
            "User-Agent":
               "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
         },
      });

      if (!response.ok) {
         throw new Error(
            `Failed to fetch from API: ${response.status}`,
         );
      }

      console.log("Parsing proxy response...");
      const apiData = await response.json();

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
         `Found ${locations.length} locations. Mapping to database schema...`,
      );

      console.log(
         "Fetching weekly schedule data via proxy...",
      );
      const scheduleProxyUrl = `https://corsproxy.io/?${encodeURIComponent(WEEKLY_SCHEDULE_URL)}`;
      const scheduleResponse = await fetch(
         scheduleProxyUrl,
         {
            headers: {
               "User-Agent":
                  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            },
         },
      );

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
      if (scheduleResponse.ok) {
         const scheduleData = await scheduleResponse.json();
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

            for (
               let i = 0;
               i < Math.min(dayIntervals.length, 3);
               i++
            ) {
               weekHours[dayIdx * 6 + i * 2] =
                  dayIntervals[i].start;
               weekHours[dayIdx * 6 + i * 2 + 1] =
                  dayIntervals[i].end;
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
            location_mapping: locationMapping,
         };
      });

      const EXCLUDED_LOCATIONS = [
         "hilltop",
         "poly produce",
         "market at grand ave",
         "salad bar at campus market",
         "campus market",
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
            `Skipped ${skippedRestaurants.length} locations (missing hours or excluded):`,
         );
         console.log(
            skippedRestaurants
               .map((r) => `  - ${r.name}`)
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
