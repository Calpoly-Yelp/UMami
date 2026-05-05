import "dotenv/config";
import { chromium } from "playwright";
import { supabase } from "../config/supabaseClient.js";

const DEFAULT_MEAL_PERIODS = [
   "breakfast",
   "brunch",
   "lunch",
   "dinner",
   "late_night",
   "every-day",
];
const DINE_ON_CAMPUS_PERIOD_IDS = {
   breakfast: "0",
   brunch: "0",
   lunch: "1",
   dinner: "2",
   late_night: "3",
   "every-day": "1",
};

const delay = (ms) =>
   new Promise((resolve) => setTimeout(resolve, ms));

function getArgValue(name) {
   const prefix = `--${name}=`;
   const arg = process.argv.find((value) =>
      value.startsWith(prefix),
   );
   return arg ? arg.slice(prefix.length) : null;
}

function hasArg(name) {
   return process.argv.includes(`--${name}`);
}

function getTodayDate() {
   return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
   }).format(new Date());
}

export function getCurrentMealPeriod(date = new Date()) {
   const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
   }).formatToParts(date);
   const hour = Number(
      parts.find((part) => part.type === "hour")?.value ||
         0,
   );
   const minute = Number(
      parts.find((part) => part.type === "minute")?.value ||
         0,
   );
   const minutes = hour * 60 + minute;

   if (minutes < 10 * 60 + 30) {
      return "breakfast";
   }

   if (minutes < 16 * 60) {
      return "lunch";
   }

   if (minutes < 22 * 60) {
      return "dinner";
   }

   return "late_night";
}

export function buildMenuUrl(
   sourceUrl,
   {
      date = getTodayDate(),
      mealPeriod = getCurrentMealPeriod(),
   } = {},
) {
   if (!sourceUrl) {
      return null;
   }

   let url;
   try {
      url = new URL(sourceUrl);
   } catch {
      return sourceUrl;
   }

   if (url.hostname === "apiv4.dineoncampus.com") {
      url.searchParams.set("date", date);
      if (
         !url.searchParams.has("period") &&
         DINE_ON_CAMPUS_PERIOD_IDS[mealPeriod]
      ) {
         url.searchParams.set(
            "period",
            DINE_ON_CAMPUS_PERIOD_IDS[mealPeriod],
         );
      }
      return url.toString();
   }

   const parts = url.pathname.split("/").filter(Boolean);
   const dateIndex = parts.findIndex((part) =>
      /^\d{4}-\d{2}-\d{2}$/.test(part),
   );

   if (dateIndex >= 0) {
      parts[dateIndex] = date;

      if (parts[dateIndex + 1]) {
         parts[dateIndex + 1] = mealPeriod;
      } else {
         parts.push(mealPeriod);
      }

      url.pathname = `/${parts.join("/")}`;
      return url.toString();
   }

   if (parts.includes("whats-on-the-menu")) {
      parts.push(date, mealPeriod);
      url.pathname = `/${parts.join("/")}`;
   }

   return url.toString();
}

function normalizeText(value) {
   if (value === null || value === undefined) {
      return null;
   }

   const text = String(value)
      .replace(/\s+/g, " ")
      .replace(/&amp;/g, "&")
      .trim();

   return text || null;
}

function normalizeNumber(value) {
   if (
      value === null ||
      value === undefined ||
      value === ""
   ) {
      return null;
   }

   const match = String(value).match(/-?\d+(\.\d+)?/);
   return match ? Number(match[0]) : null;
}

function normalizeList(value) {
   if (!value) {
      return [];
   }

   if (Array.isArray(value)) {
      return value
         .map((item) =>
            normalizeText(
               typeof item === "object"
                  ? item.name || item.title || item.label
                  : item,
            ),
         )
         .filter(Boolean);
   }

   return String(value)
      .split(/[,|]/)
      .map(normalizeText)
      .filter(Boolean);
}

function getNestedValue(item, keys) {
   for (const key of keys) {
      const value = key
         .split(".")
         .reduce(
            (current, part) =>
               current && current[part] !== undefined
                  ? current[part]
                  : undefined,
            item,
         );

      if (
         value !== undefined &&
         value !== null &&
         value !== ""
      ) {
         return value;
      }
   }

   return null;
}

function findNutrientValue(item, names) {
   const containers = [
      item.nutrition,
      item.nutrients,
      item.nutrition_facts,
      item.nutritional_info,
   ].filter(Boolean);

   for (const container of containers) {
      if (Array.isArray(container)) {
         const nutrient = container.find((entry) => {
            const label = normalizeText(
               entry.name || entry.label || entry.title,
            )?.toLowerCase();
            return (
               label &&
               names.some((name) =>
                  label.includes(name.toLowerCase()),
               )
            );
         });

         if (nutrient) {
            return (
               nutrient.value ||
               nutrient.amount ||
               nutrient.display_value ||
               nutrient.quantity
            );
         }
      }

      if (typeof container === "object") {
         for (const name of names) {
            const value = getNestedValue(container, [
               name,
               name.toLowerCase(),
               name.replace(/\s+/g, "_").toLowerCase(),
            ]);

            if (value !== null) {
               return value;
            }
         }
      }
   }

   return null;
}

function looksLikeMenuItem(item) {
   if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
   ) {
      return false;
   }

   const name = getNestedValue(item, [
      "name",
      "title",
      "item_name",
      "product_name",
      "formal_name",
   ]);

   if (!normalizeText(name)) {
      return false;
   }

   return Boolean(
      getNestedValue(item, [
         "description",
         "desc",
         "portion",
         "portion_size",
         "serving_size",
         "price",
         "calories",
         "category",
      ]) ||
      item.nutrition ||
      item.nutrients ||
      item.nutrition_facts ||
      item.nutritional_info,
   );
}

function getContextName(value, key = "") {
   if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
   ) {
      return null;
   }

   const explicitName = normalizeText(
      value.category ||
         value.category_name ||
         value.station ||
         value.station_name,
   );

   if (explicitName) {
      return explicitName;
   }

   if (/category|station|course|section/i.test(key)) {
      return normalizeText(value.name || value.title);
   }

   return null;
}

function getDisplayName(value) {
   if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
   ) {
      return null;
   }

   return normalizeText(
      value.category ||
         value.category_name ||
         value.station ||
         value.station_name ||
         value.name ||
         value.title,
   );
}

function normalizeMenuItem(
   item,
   { category, sourceUrl, mealPeriod },
) {
   const calories =
      normalizeNumber(
         getNestedValue(item, [
            "calories",
            "kcal",
            "nutrition.calories",
            "nutrition_facts.calories",
         ]),
      ) ??
      normalizeNumber(
         findNutrientValue(item, ["calories"]),
      );

   const fat =
      normalizeText(
         getNestedValue(item, [
            "fat",
            "total_fat",
            "nutrition.fat",
            "nutrition_facts.fat",
         ]),
      ) ||
      normalizeText(
         findNutrientValue(item, ["fat", "total fat"]),
      );

   const carbs =
      normalizeText(
         getNestedValue(item, [
            "carbs",
            "carbohydrates",
            "total_carbohydrates",
            "nutrition.carbs",
            "nutrition_facts.carbs",
         ]),
      ) ||
      normalizeText(
         findNutrientValue(item, [
            "carbs",
            "carbohydrates",
            "total carbohydrates",
         ]),
      );

   const protein =
      normalizeText(
         getNestedValue(item, [
            "protein",
            "nutrition.protein",
            "nutrition_facts.protein",
         ]),
      ) ||
      normalizeText(findNutrientValue(item, ["protein"]));

   return {
      category:
         normalizeText(
            getNestedValue(item, [
               "category",
               "category_name",
               "station",
               "station_name",
            ]),
         ) ||
         category ||
         "Uncategorized",
      name: normalizeText(
         getNestedValue(item, [
            "name",
            "title",
            "item_name",
            "product_name",
            "formal_name",
         ]),
      ),
      description: normalizeText(
         getNestedValue(item, [
            "description",
            "desc",
            "short_description",
         ]),
      ),
      portion: normalizeText(
         getNestedValue(item, [
            "portion",
            "portion_size",
            "serving_size",
            "serving",
         ]),
      ),
      price: normalizeNumber(
         getNestedValue(item, ["price", "display_price"]),
      ),
      calories,
      fat,
      carbs,
      protein,
      allergens: normalizeList(
         getNestedValue(item, [
            "allergens",
            "allergen_list",
            "contains",
         ]),
      ),
      dietary_tags: normalizeList(
         getNestedValue(item, [
            "dietary_tags",
            "preferences",
            "traits",
            "filters",
         ]),
      ),
      source_url: sourceUrl,
      meal_period: mealPeriod,
      last_scraped_at: new Date().toISOString(),
   };
}

function walkForItems(
   value,
   context,
   items,
   seenObjects,
   key = "",
) {
   if (!value || typeof value !== "object") {
      return;
   }

   if (seenObjects.has(value)) {
      return;
   }
   seenObjects.add(value);

   if (Array.isArray(value)) {
      for (const entry of value) {
         walkForItems(
            entry,
            context,
            items,
            seenObjects,
            key,
         );
      }
      return;
   }

   const nextContext = {
      ...context,
      category:
         getContextName(value, key) || context.category,
   };

   if (looksLikeMenuItem(value)) {
      const item = normalizeMenuItem(value, nextContext);
      if (item.name) {
         items.push(item);
      }
   }

   for (const [key, child] of Object.entries(value)) {
      const keyContext = { ...nextContext };
      if (
         /category|station|course|section/i.test(key) &&
         typeof child === "object"
      ) {
         keyContext.category =
            getDisplayName(child) || keyContext.category;
      }

      walkForItems(
         child,
         keyContext,
         items,
         seenObjects,
         key,
      );
   }
}

function extractJsonBlocks(html) {
   const blocks = [];
   const scriptMatches = html.matchAll(
      /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi,
   );

   for (const match of scriptMatches) {
      blocks.push(match[1]);
   }

   const nextData = html.match(
      /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
   );
   if (nextData) {
      blocks.push(nextData[1]);
   }

   const assignmentMatches = html.matchAll(
      /window\.[A-Z0-9_$]+(?:__)?\s*=\s*({[\s\S]*?});\s*<\/script>/gi,
   );
   for (const match of assignmentMatches) {
      blocks.push(match[1]);
   }

   return blocks;
}

function parseJsonSafely(value) {
   try {
      return JSON.parse(value);
   } catch {
      return null;
   }
}

export function parseMenuPayload(payload, context = {}) {
   const roots = [];

   if (typeof payload === "string") {
      const directJson = parseJsonSafely(payload);
      if (directJson) {
         roots.push(directJson);
      }

      for (const block of extractJsonBlocks(payload)) {
         const parsed = parseJsonSafely(
            block
               .replace(/&quot;/g, '"')
               .replace(/&amp;/g, "&"),
         );
         if (parsed) {
            roots.push(parsed);
         }
      }
   } else if (payload && typeof payload === "object") {
      roots.push(payload);
   }

   const items = [];
   for (const root of roots) {
      walkForItems(root, context, items, new WeakSet());
   }

   const seen = new Set();
   return items.filter((item) => {
      const key = [
         item.category,
         item.name,
         item.meal_period,
      ].join("|");

      if (seen.has(key)) {
         return false;
      }

      seen.add(key);
      return true;
   });
}

export async function fetchMenuSource(url) {
   if (
      url.includes("dineoncampus.com") ||
      url.includes("apiv4.dineoncampus.com")
   ) {
      return fetchDineOnCampusSource(url);
   }

   const response = await fetch(url, {
      headers: {
         "User-Agent":
            "UMamiApp/1.0 (CSC308-Student-Project; menu scraper)",
         Accept:
            "application/json,text/html;q=0.9,*/*;q=0.8",
         "Accept-Language": "en-US,en;q=0.9",
      },
   });
   const text = await response.text();

   if (!response.ok) {
      const isCloudflareBlock =
         response.status === 403 &&
         /Cloudflare|Sorry, you have been blocked|Attention Required/i.test(
            text,
         );

      const message = isCloudflareBlock
         ? "Dine on Campus blocked the request with Cloudflare."
         : `Menu source returned HTTP ${response.status}.`;

      const error = new Error(message);
      error.status = response.status;
      error.body = text.slice(0, 500);
      throw error;
   }

   return text;
}

export async function fetchDineOnCampusSource(url) {
   const browser = await chromium.launch({
      headless: true,
   });

   try {
      const context = await browser.newContext({
         userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15",
         extraHTTPHeaders: {
            Accept: "application/json, text/plain, */*",
            Origin: "https://dineoncampus.com",
            Referer: "https://dineoncampus.com/",
         },
      });
      const page = await context.newPage();
      const response = await page.goto(url, {
         waitUntil: "networkidle",
         timeout: 30000,
      });

      if (!response || !response.ok()) {
         const text = await page.content();
         const isCloudflareBlock =
            response?.status() === 403 &&
            /Cloudflare|Sorry, you have been blocked|Attention Required/i.test(
               text,
            );

         throw new Error(
            isCloudflareBlock
               ? "Dine on Campus blocked the browser request with Cloudflare."
               : `Menu source returned HTTP ${response?.status() || "unknown"}.`,
         );
      }

      return await response.text();
   } finally {
      await browser.close();
   }
}

async function fetchRestaurants({ restaurantId } = {}) {
   let query = supabase
      .from("restaurants")
      .select("id,name,menu_source_url")
      .not("menu_source_url", "is", null);

   if (restaurantId) {
      query = query.eq("id", restaurantId);
   }

   const { data, error } = await query;

   if (error) {
      throw error;
   }

   return data || [];
}

async function replaceRestaurantMenu({
   restaurantId,
   items,
   mealPeriod,
}) {
   let deleteQuery = supabase
      .from("menu_items")
      .delete()
      .eq("restaurant_id", restaurantId);

   if (mealPeriod) {
      deleteQuery = deleteQuery.eq(
         "meal_period",
         mealPeriod,
      );
   }

   const { error: deleteError } = await deleteQuery;
   if (deleteError) {
      throw deleteError;
   }

   if (items.length === 0) {
      return [];
   }

   const rows = items.map((item) => ({
      ...item,
      restaurant_id: restaurantId,
   }));

   const { data, error } = await supabase
      .from("menu_items")
      .insert(rows)
      .select("id,name,category,restaurant_id,meal_period");

   if (error) {
      throw error;
   }

   return data || [];
}

export async function scrapeRestaurantMenu(
   restaurant,
   {
      date = getTodayDate(),
      mealPeriod = getCurrentMealPeriod(),
      dryRun = false,
   } = {},
) {
   const sourceUrl = buildMenuUrl(
      restaurant.menu_source_url,
      {
         date,
         mealPeriod,
      },
   );

   if (!sourceUrl) {
      return {
         restaurant,
         sourceUrl,
         items: [],
         inserted: [],
         error: "Missing menu_source_url",
      };
   }

   const payload = await fetchMenuSource(sourceUrl);
   const items = parseMenuPayload(payload, {
      sourceUrl,
      mealPeriod,
   });

   if (dryRun) {
      return {
         restaurant,
         sourceUrl,
         items,
         inserted: [],
      };
   }

   const inserted = await replaceRestaurantMenu({
      restaurantId: restaurant.id,
      items,
      mealPeriod,
   });

   return {
      restaurant,
      sourceUrl,
      items,
      inserted,
   };
}

async function scrapeCurrentMenus() {
   const restaurantIdArg = getArgValue("restaurant-id");
   const sourceUrlArg = getArgValue("source-url");
   const date = getArgValue("date") || getTodayDate();
   const mealPeriod =
      getArgValue("meal-period") || getCurrentMealPeriod();
   const dryRun = hasArg("dry-run");
   const delayMs = Number(getArgValue("delay-ms") || 1000);

   if (!DEFAULT_MEAL_PERIODS.includes(mealPeriod)) {
      throw new Error(
         `Invalid meal period "${mealPeriod}". Expected one of: ${DEFAULT_MEAL_PERIODS.join(", ")}`,
      );
   }

   const restaurants = sourceUrlArg
      ? [
           {
              id: restaurantIdArg
                 ? Number(restaurantIdArg)
                 : null,
              name: "Provided source URL",
              menu_source_url: sourceUrlArg,
           },
        ]
      : await fetchRestaurants({
           restaurantId: restaurantIdArg
              ? Number(restaurantIdArg)
              : null,
        });

   if (sourceUrlArg && !dryRun && !restaurantIdArg) {
      throw new Error(
         "Pass --restaurant-id with --source-url when not using --dry-run.",
      );
   }

   console.log(
      `Scraping ${restaurants.length} restaurant menu source(s) for ${date} ${mealPeriod}${dryRun ? " (dry run)" : ""}.`,
   );

   for (const restaurant of restaurants) {
      try {
         console.log(
            `Scraping ${restaurant.name || `Restaurant ${restaurant.id}`}...`,
         );

         const result = await scrapeRestaurantMenu(
            restaurant,
            {
               date,
               mealPeriod,
               dryRun,
            },
         );

         console.log(`Source: ${result.sourceUrl}`);
         console.log(
            dryRun
               ? `Parsed ${result.items.length} item(s).`
               : `Inserted ${result.inserted.length} item(s).`,
         );

         if (dryRun && result.items.length > 0) {
            console.table(
               result.items.slice(0, 10).map((item) => ({
                  category: item.category,
                  name: item.name,
                  calories: item.calories,
               })),
            );
         }
      } catch (error) {
         console.error(
            `Failed to scrape ${restaurant.name || `Restaurant ${restaurant.id}`}: ${error.message}`,
         );
      }

      await delay(delayMs);
   }
}

const isMainMenuScraper =
   process.argv[1] &&
   process.argv[1].endsWith("scrapeCurrentMenus.js");
if (isMainMenuScraper) {
   scrapeCurrentMenus().catch((error) => {
      console.error(error);
      process.exitCode = 1;
   });
}
