import "dotenv/config";
import cron from "node-cron";
import { chromium } from "playwright";
import { supabase } from "../config/supabaseClient.js";

const MENU_SCRAPE_SCHEDULES = [
   "5 6 * * *",
   "35 10 * * *",
   "5 16 * * *",
   "5 22 * * *",
];
const SUBWAY_NUTRITION_PDF_URL =
   "https://www.subway.com/en-us/-/media/northamerica/usa/nutrition/nutritiondocuments/2026/us_nutrition_en_1-2026.pdf";
const SUBWAY_SOURCE_ALIASES = new Set([
   "subway:nutrition",
   "subway://nutrition",
]);
const SUBWAY_MAJOR_CATEGORIES = new Set([
   '6" Sandwiches',
   "Kids' Mini Sub",
   "Wraps",
   "Protein Pockets",
   "Salads",
   "No Bready Bowls",
   "Breakfast",
   '8" Pizza',
   "Sliders",
   "Cookies & Sides",
   "Breads",
   "Sandwich Condiments and Toppings",
   "Seasonings and Spices",
   "Vegetables",
   "Cheese",
   "Individual Proteins",
]);

const TAG_KEYWORD_MAPPING = {
   Coffee: [
      "coffee",
      "espresso",
      "latte",
      "mocha",
      "cappuccino",
      "macchiato",
      "americano",
   ],
   Sandwiches: [
      "sandwich",
      "sub",
      "wrap",
      "panini",
      "melt",
      "hoagie",
   ],
   Burgers: [
      "burger",
      "cheeseburger",
      "hamburger",
      "patty",
   ],
   Mexican: [
      "taco",
      "burrito",
      "quesadilla",
      "nachos",
      "fajita",
      "enchilada",
   ],
   Sushi: ["sushi", "roll", "sashimi", "nigiri"],
   Pizza: ["pizza", "slice", "calzone"],
   Healthy: ["salad", "greens"],
   Breakfast: [
      "pancake",
      "waffle",
      "omelet",
      "egg",
      "bacon",
      "sausage",
      "toast",
      "bagel",
   ],
   Smoothies: ["smoothie", "acai", "shake"],
   Asian: [
      "teriyaki",
      "noodles",
      "wok",
      "pad thai",
      "fried rice",
   ],
   Indian: ["curry", "tikka", "naan", "samosa"],
   Mediterranean: [
      "pita",
      "falafel",
      "hummus",
      "gyro",
      "kebab",
   ],
   Dessert: [
      "cookie",
      "brownie",
      "cake",
      "ice cream",
      "pastry",
      "pie",
   ],
   Chicken: ["chicken", "wings", "nuggets", "tenders"],
   Italian: [
      "pasta",
      "spaghetti",
      "ravioli",
      "macaroni",
      "lasagna",
   ],
   Salads: ["salad"],
   Bowls: ["bowl"],
   Bakery: [
      "bagel",
      "pastry",
      "muffin",
      "croissant",
      "scone",
   ],
   Beverages: [
      "boba",
      "tea",
      "soda",
      "lemonade",
      "juice",
      "beverage",
      "drink",
   ],
};

function getTagsFromKeywords(name, description, category) {
   const tags = [];
   const searchTargets = [name, description, category]
      .filter(Boolean)
      .join(" ");

   for (const [tag, keywords] of Object.entries(
      TAG_KEYWORD_MAPPING,
   )) {
      for (const keyword of keywords) {
         const regex = new RegExp(`\\b${keyword}\\b`, "i");
         if (regex.test(searchTargets)) {
            tags.push(tag);
            break; // Move to next tag if we found a match for this one
         }
      }
   }
   return tags;
}

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

export function buildMenuUrl(
   sourceUrl,
   { date = getTodayDate(), mealPeriod = "every-day" } = {},
) {
   if (!sourceUrl) {
      return null;
   }

   if (isSubwayNutritionSource(sourceUrl)) {
      return resolveSubwayNutritionUrl(sourceUrl);
   }

   let url;
   try {
      url = new URL(sourceUrl);
   } catch {
      return sourceUrl;
   }

   if (url.hostname === "apiv4.dineoncampus.com") {
      url.searchParams.set("date", date);
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

function isSubwayRestaurant(restaurant) {
   return /subway/i.test(restaurant?.name || "");
}

function isSubwayNutritionSource(sourceUrl) {
   const normalizedUrl = String(sourceUrl).toLowerCase();
   return (
      SUBWAY_SOURCE_ALIASES.has(normalizedUrl) ||
      (normalizedUrl.includes("subway.com") &&
         normalizedUrl.includes("nutritiondocuments") &&
         normalizedUrl.endsWith(".pdf"))
   );
}

function resolveSubwayNutritionUrl(sourceUrl) {
   return SUBWAY_SOURCE_ALIASES.has(
      String(sourceUrl).toLowerCase(),
   )
      ? SUBWAY_NUTRITION_PDF_URL
      : sourceUrl;
}

function getRestaurantMenuSourceUrl(restaurant) {
   if (restaurant?.menu_source_url) {
      return restaurant.menu_source_url;
   }

   return isSubwayRestaurant(restaurant)
      ? SUBWAY_NUTRITION_PDF_URL
      : null;
}

function isDineOnCampusApiMenuUrl(sourceUrl) {
   try {
      const url = new URL(sourceUrl);
      return (
         url.hostname === "apiv4.dineoncampus.com" &&
         /\/locations\/[^/]+\/menu$/.test(url.pathname)
      );
   } catch {
      return false;
   }
}

function getDineOnCampusPeriodsUrl(sourceUrl) {
   const url = new URL(sourceUrl);
   const parts = url.pathname.split("/").filter(Boolean);
   const locationIndex = parts.indexOf("locations");
   const locationId = parts[locationIndex + 1];

   const periodsUrl = new URL(
      `/locations/${locationId}/periods`,
      url.origin,
   );
   const date = url.searchParams.get("date");
   periodsUrl.searchParams.set("date", date);

   return periodsUrl.toString();
}

function normalizeMealPeriodName(value) {
   const normalized = String(value).toLowerCase();
   if (normalized.includes("breakfast")) {
      return "breakfast";
   }
   if (normalized.includes("brunch")) {
      return "brunch";
   }
   if (normalized.includes("lunch")) {
      return "lunch";
   }
   if (normalized.includes("dinner")) {
      return "dinner";
   }
   if (
      normalized.includes("late") ||
      normalized.includes("night")
   ) {
      return "late_night";
   }
   return "every-day";
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
               typeof item === "object" && item !== null
                  ? item.name ||
                       item.title ||
                       item.label ||
                       item.value
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

function getContextName(value, key) {
   const explicitName = normalizeText(
      value.category ||
         value.category_name ||
         value.station ||
         value.station_name,
   );

   if (explicitName) {
      return explicitName;
   }

   if (
      /categor(?:y|ies)|station|course|section/i.test(key)
   ) {
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

   const rawName = normalizeText(
      getNestedValue(item, [
         "name",
         "title",
         "item_name",
         "product_name",
         "formal_name",
      ]),
   );

   const extractedDietaryTags = [];
   let cleanName = rawName;

   if (rawName) {
      const tagRegex = /\s*\|\s*(V|VG|GF|AG|PR)\b/gi;
      let match;
      while ((match = tagRegex.exec(rawName)) !== null) {
         const tag = match[1].toUpperCase();
         if (tag === "V") {
            extractedDietaryTags.push("Vegetarian");
         } else if (tag === "VG") {
            extractedDietaryTags.push("Vegan");
         } else if (tag === "GF" || tag === "AG") {
            extractedDietaryTags.push("Gluten-Free");
         } else {
            extractedDietaryTags.push("Protein");
         }
      }
      cleanName =
         rawName
            .replace(/\s*\|\s*(?:V|VG|GF|AG|PR)\b/gi, "")
            .trim() || null;
   }

   const baseDietaryTags = normalizeList(
      getNestedValue(item, [
         "dietary_tags",
         "preferences",
         "traits",
         "filters",
         "cor_icons",
         "icons",
         "dietaries",
         "webtrition_tags",
      ]),
   );

   const computedCategory =
      normalizeText(
         getNestedValue(item, [
            "category",
            "category_name",
            "station",
            "station_name",
         ]),
      ) ||
      category ||
      "Uncategorized";

   const description = normalizeText(
      getNestedValue(item, [
         "description",
         "desc",
         "short_description",
      ]),
   );

   const keywordTags = getTagsFromKeywords(
      cleanName,
      description,
      computedCategory,
   );

   return {
      category: computedCategory,
      name: cleanName,
      description,
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
            "customAllergens",
         ]),
      ),
      dietary_tags: Array.from(
         new Set([
            ...baseDietaryTags,
            ...extractedDietaryTags,
            ...keywordTags,
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
         /categor(?:y|ies)|station|course|section/i.test(
            key,
         ) &&
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
      const key = [item.name, item.meal_period].join("|");

      if (seen.has(key)) {
         return false;
      }

      seen.add(key);
      return true;
   });
}

function shouldIgnoreSubwayHeading(line) {
   return (
      !line ||
      /^-- \d+ of \d+ --$/.test(line) ||
      /^Egg Patty on 12" Wrap/i.test(line) ||
      /^[A-Z\s&]+INGREDIENTS$/.test(line) ||
      /^(include|footlong=)/i.test(line) ||
      /^2,000 calories/i.test(line) ||
      /^Serving Size/i.test(line) ||
      /^(Calories|Total Fat|Sat\. Fat|Trans Fat|Chol\.|Sodium|Carbohydrate|Dietary Fiber|Sugars|Added Sugars|Protein|Vitamin|Calcium|Iron)/i.test(
         line,
      ) ||
      /^U\.S\. NUTRITION INFORMATION/i.test(line) ||
      /^(SANDWICHES|SALADS|WRAPS)$/.test(line) ||
      /^(Double values|Values include|dressing unless noted)/i.test(
         line,
      )
   );
}

function cleanSubwayCategoryName(name) {
   return normalizeText(
      name
         .replace(/\s*\*\*$/g, "")
         .replace(/\*\*/g, "")
         .replace(/\s+®/g, "®")
         .replace(/\s+/g, " "),
   );
}

function cleanSubwayItemName(name) {
   return normalizeText(
      name
         .replace(/\s*\*\*$/g, "")
         .replace(/\s+®/g, "®")
         .replace(/\s+/g, " "),
   );
}

function parseSubwayNutritionValue(value) {
   const normalizedValue = String(value).replace(/^</, "");
   return Number(normalizedValue);
}

export function parseSubwayNutritionText(
   text,
   { sourceUrl, mealPeriod = "every-day" } = {},
) {
   const lines = String(text)
      .split(/\r?\n/)
      .map(normalizeText)
      .filter(Boolean);
   const items = [];
   let majorCategory = null;
   let minorCategory = null;

   for (const line of lines) {
      const itemMatch = line.match(
         /^(.+?)\s+((?:<?-?\d+(?:\.\d+)?\s+){15}<?-?\d+(?:\.\d+)?)$/,
      );

      if (itemMatch) {
         const values = itemMatch[2]
            .trim()
            .split(/\s+/)
            .map(parseSubwayNutritionValue);
         const categoryStr =
            majorCategory && minorCategory
               ? `${majorCategory} - ${minorCategory}`
               : majorCategory ||
                 minorCategory ||
                 "Subway Menu";

         const cleanCategory =
            cleanSubwayCategoryName(categoryStr);
         const cleanName = cleanSubwayItemName(
            itemMatch[1],
         );
         const keywordTags = getTagsFromKeywords(
            cleanName,
            null,
            cleanCategory,
         );

         items.push({
            category: cleanCategory,
            name: cleanName,
            description: null,
            portion: `${values[0]} g`,
            price: null,
            calories: values[1],
            fat: `${values[2]}g`,
            carbs: `${values[7]}g`,
            protein: `${values[11]}g`,
            allergens: [],
            dietary_tags: keywordTags,
            source_url: sourceUrl,
            meal_period: mealPeriod,
            last_scraped_at: new Date().toISOString(),
         });
         continue;
      }

      if (shouldIgnoreSubwayHeading(line)) {
         continue;
      }

      if (/^Egg Patty on 6" Artisan Italian/i.test(line)) {
         majorCategory = "Breakfast";
         minorCategory = null;
         continue;
      }

      if (SUBWAY_MAJOR_CATEGORIES.has(line)) {
         majorCategory = cleanSubwayCategoryName(line);
         minorCategory = null;
      } else if (majorCategory) {
         minorCategory = cleanSubwayCategoryName(line);
      }
   }

   const seen = new Set();
   return items.filter((item) => {
      const key = [item.name, item.meal_period].join("|");

      if (seen.has(key)) {
         return false;
      }

      seen.add(key);
      return true;
   });
}

async function fetchSubwayNutritionText(url) {
   const { PDFParse } = await import("pdf-parse");
   const parser = new PDFParse({ url });

   try {
      const result = await parser.getText();
      return result.text;
   } finally {
      await parser.destroy();
   }
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

async function fetchRestaurants({ restaurantId }) {
   let query = supabase
      .from("restaurants")
      .select("id,name,menu_source_url,tags");

   if (restaurantId) {
      query = query.eq("id", restaurantId);
   }

   const { data, error } = await query;

   if (error) {
      throw error;
   }

   return (data || []).filter((restaurant) =>
      Boolean(getRestaurantMenuSourceUrl(restaurant)),
   );
}

export async function replaceRestaurantMenu({
   restaurantId,
   items,
   mealPeriod,
}) {
   let fetchQuery = supabase
      .from("menu_items")
      .select("id, name, meal_period")
      .eq("restaurant_id", restaurantId);

   if (mealPeriod) {
      fetchQuery = fetchQuery.eq("meal_period", mealPeriod);
   }

   const { data: existingItems, error: fetchError } =
      await fetchQuery;
   if (fetchError) {
      throw fetchError;
   }

   const getCompositeKey = (item) =>
      `${item.name}|${item.meal_period}`;

   const scrapedKeys = new Set(items.map(getCompositeKey));

   const seenExistingKeys = new Set();
   const duplicateIds = [];
   const uniqueExistingItems = [];

   for (const item of existingItems || []) {
      const key = getCompositeKey(item);
      if (seenExistingKeys.has(key)) {
         duplicateIds.push(item.id);
      } else {
         seenExistingKeys.add(key);
         uniqueExistingItems.push(item);
      }
   }

   const idsToDelete = [
      ...duplicateIds,
      ...uniqueExistingItems
         .filter(
            (existing) =>
               !scrapedKeys.has(getCompositeKey(existing)),
         )
         .map((item) => item.id),
   ];

   if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
         .from("menu_items")
         .delete()
         .in("id", idsToDelete);

      if (deleteError) {
         throw deleteError;
      }
   }

   if (items.length === 0) {
      return {
         inserted: [],
         updated: [],
         deleted: idsToDelete,
      };
   }

   const existingMap = new Map(
      uniqueExistingItems.map((item) => [
         getCompositeKey(item),
         item.id,
      ]),
   );

   const rowsToUpdate = [];
   const rowsToInsert = [];

   for (const item of items) {
      const key = getCompositeKey(item);
      const existingId = existingMap.get(key);
      if (existingId) {
         rowsToUpdate.push({
            ...item,
            id: existingId,
            restaurant_id: restaurantId,
         });
      } else {
         rowsToInsert.push({
            ...item,
            restaurant_id: restaurantId,
         });
      }
   }

   const results = {
      inserted: [],
      updated: [],
      deleted: idsToDelete,
   };

   if (rowsToUpdate.length > 0) {
      const updatePromises = rowsToUpdate.map(
         async (row) => {
            const { id, ...updateData } = row;
            const { data, error } = await supabase
               .from("menu_items")
               .update(updateData)
               .eq("id", id)
               .select(
                  "id,name,category,restaurant_id,meal_period",
               )
               .single();

            if (error) {
               throw error;
            }
            return data;
         },
      );

      const updatedData = await Promise.all(updatePromises);
      results.updated.push(...updatedData.filter(Boolean));
   }

   if (rowsToInsert.length > 0) {
      const { data: insertedData, error: insertError } =
         await supabase
            .from("menu_items")
            .insert(rowsToInsert)
            .select(
               "id,name,category,restaurant_id,meal_period",
            );

      if (insertError) {
         throw insertError;
      }
      results.inserted.push(...(insertedData || []));
   }

   return results;
}

export async function scrapeRestaurantMenu(
   restaurant,
   {
      date = getTodayDate(),
      mealPeriod = "every-day",
      dryRun = false,
   } = {},
) {
   const rawSourceUrl =
      getRestaurantMenuSourceUrl(restaurant);
   let sourceUrl = buildMenuUrl(rawSourceUrl, {
      date,
      mealPeriod,
   });

   if (!sourceUrl) {
      return {
         restaurant,
         sourceUrl,
         items: [],
         inserted: [],
         error: "Missing menu_source_url",
      };
   }

   const isSubwaySource =
      isSubwayNutritionSource(sourceUrl);
   let items = [];
   let effectiveMealPeriod = "every-day";
   let replaceAllPeriods = false;

   if (isSubwaySource) {
      effectiveMealPeriod = "every-day";
      items = parseSubwayNutritionText(
         await fetchSubwayNutritionText(sourceUrl),
         {
            sourceUrl,
            mealPeriod: effectiveMealPeriod,
         },
      );
   } else if (isDineOnCampusApiMenuUrl(sourceUrl)) {
      const periodsUrl =
         getDineOnCampusPeriodsUrl(sourceUrl);
      let periodsPayload;
      try {
         periodsPayload = JSON.parse(
            await fetchMenuSource(periodsUrl),
         );
      } catch (err) {
         console.warn(
            `Could not fetch periods for ${restaurant.name}: ${err.message}`,
         );
      }

      const periods = Array.isArray(periodsPayload?.periods)
         ? periodsPayload.periods
         : [];

      if (periods.length === 0) {
         items = parseMenuPayload(
            await fetchMenuSource(sourceUrl),
            {
               sourceUrl,
               mealPeriod: effectiveMealPeriod,
               restaurantName: restaurant.name,
            },
         );
      } else {
         replaceAllPeriods = true;
         for (const period of periods) {
            if (!period.id) {
               continue;
            }

            const periodUrl = new URL(sourceUrl);
            periodUrl.searchParams.set("period", period.id);

            let periodText;
            try {
               periodText = await fetchMenuSource(
                  periodUrl.toString(),
               );
            } catch (err) {
               console.warn(
                  `Failed to fetch period ${period.name} for ${restaurant.name}: ${err.message}`,
               );
               continue;
            }

            const currentPeriodName =
               normalizeMealPeriodName(
                  period.name || period.slug || "every-day",
               );

            const periodItems = parseMenuPayload(
               periodText,
               {
                  sourceUrl: periodUrl.toString(),
                  mealPeriod: currentPeriodName,
                  restaurantName: restaurant.name,
               },
            );
            items.push(...periodItems);
         }
      }
   } else {
      items = parseMenuPayload(
         await fetchMenuSource(sourceUrl),
         {
            sourceUrl,
            mealPeriod: effectiveMealPeriod,
            restaurantName: restaurant.name,
         },
      );
   }

   if (dryRun) {
      return {
         restaurant,
         sourceUrl,
         items,
         syncStats: {
            inserted: [],
            updated: [],
            deleted: [],
         },
      };
   }

   const syncStats = await replaceRestaurantMenu({
      restaurantId: restaurant.id,
      items,
      mealPeriod: replaceAllPeriods
         ? null
         : effectiveMealPeriod,
   });

   // Dynamically update the restaurant's tags with dietary tags found on the menu
   const extractedTags = new Set(restaurant.tags || []);
   let tagsChanged = false;

   for (const item of items) {
      for (const tag of item.dietary_tags) {
         if (!extractedTags.has(tag)) {
            extractedTags.add(tag);
            tagsChanged = true;
         }
      }
   }

   if (!dryRun && tagsChanged && restaurant.id) {
      const updateReq = supabase
         .from("restaurants")
         .update({ tags: Array.from(extractedTags) });

      if (updateReq && updateReq.eq) {
         // Safe-guard for mock tests
         const { error } = await updateReq.eq(
            "id",
            restaurant.id,
         );
         if (error) {
            console.warn(
               `Failed to update tags for ${restaurant.name}: ${error.message}`,
            );
         }
      }
   }

   return {
      restaurant,
      sourceUrl,
      items,
      syncStats,
   };
}

export async function scrapeCurrentMenus({
   restaurantId,
   sourceUrl,
   date = getArgValue("date") || getTodayDate(),
   dryRun = hasArg("dry-run"),
   delayMs = Number(getArgValue("delay-ms") || 1000),
} = {}) {
   const restaurantIdArg =
      restaurantId ?? getArgValue("restaurant-id");
   const sourceUrlArg =
      sourceUrl ?? getArgValue("source-url");

   const restaurants = sourceUrlArg
      ? [
           {
              id: restaurantIdArg
                 ? Number(restaurantIdArg)
                 : null,
              name: "Provided source URL",
              menu_source_url: sourceUrlArg,
              tags: [],
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
      `Scraping ${restaurants.length} restaurant menu source(s) for ${date}${dryRun ? " (dry run)" : ""}.`,
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
               dryRun,
            },
         );

         console.log(`Source: ${result.sourceUrl}`);
         if (dryRun) {
            console.log(
               `Parsed ${result.items.length} item(s).`,
            );
         } else {
            const { inserted, updated, deleted } =
               result.syncStats;
            console.log(
               `Synced: ${inserted.length} added, ${updated.length} updated, ${deleted.length} deleted.`,
            );
         }

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

export function scheduleCurrentMenuScraper() {
   if (process.env.NODE_ENV === "test") {
      return [];
   }

   return MENU_SCRAPE_SCHEDULES.map((cronExpression) =>
      cron.schedule(
         cronExpression,
         () => {
            scrapeCurrentMenus().catch((error) => {
               console.error(
                  `Scheduled menu scrape failed:`,
                  error,
               );
            });
         },
         {
            timezone: "America/Los_Angeles",
         },
      ),
   );
}

if (process.argv[1]?.endsWith("scrapeCurrentMenus.js")) {
   scrapeCurrentMenus().catch((error) => {
      console.error(error);
      process.exitCode = 1;
   });
}
