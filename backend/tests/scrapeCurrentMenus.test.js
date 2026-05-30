import {
   beforeEach,
   describe,
   expect,
   it,
   jest,
} from "@jest/globals";
import { supabase } from "../config/supabaseClient.js";
import {
   buildMenuUrl,
   getCurrentMealPeriod,
   parseMenuPayload,
   parseSubwayNutritionText,
   replaceRestaurantMenu,
   scrapeRestaurantMenu,
   scrapeCurrentMenus,
   scheduleCurrentMenuScraper,
   fetchMenuSource,
   fetchDineOnCampusSource,
} from "../utils/scrapeCurrentMenus.js";
import cron from "node-cron";
import { chromium } from "playwright";

jest.mock("../config/supabaseClient.js");

jest.mock("node-cron", () => ({
   schedule: jest.fn(),
}));

jest.mock("playwright", () => ({
   chromium: {
      launch: jest.fn(),
   },
}));

jest.mock("pdf-parse", () => {
   return {
      PDFParse: jest.fn().mockImplementation(() => ({
         getText: jest.fn().mockResolvedValue({
            text: '6" Sandwiches\nCheesesteaks\n6" Steak Philly 192 510 25 9 1 85 1320 43 2 5 3 28 10 6 90 100',
         }),
         destroy: jest.fn().mockResolvedValue(undefined),
      })),
   };
});

beforeEach(() => {
   jest.clearAllMocks();
});

describe("menu schedule helpers", () => {
   it("maps Los Angeles time to the expected meal period boundaries", () => {
      expect(
         getCurrentMealPeriod(
            new Date("2026-05-13T17:29:00Z"),
         ),
      ).toBe("breakfast");
      expect(
         getCurrentMealPeriod(
            new Date("2026-05-13T17:30:00Z"),
         ),
      ).toBe("lunch");
      expect(
         getCurrentMealPeriod(
            new Date("2026-05-13T23:00:00Z"),
         ),
      ).toBe("dinner");
      expect(
         getCurrentMealPeriod(
            new Date("2026-05-14T05:00:00Z"),
         ),
      ).toBe("late_night");
   });
});

describe("menu source URL building", () => {
   it("adds date query params for Dine on Campus API sources", () => {
      const url = buildMenuUrl(
         "https://apiv4.dineoncampus.com/locations/abc/menu",
         {
            date: "2026-05-13",
            mealPeriod: "dinner",
         },
      );

      expect(url).toBe(
         "https://apiv4.dineoncampus.com/locations/abc/menu?date=2026-05-13",
      );
   });

   it("preserves an existing Dine on Campus period query param", () => {
      const url = buildMenuUrl(
         "https://apiv4.dineoncampus.com/locations/abc/menu?period=9",
         {
            date: "2026-05-13",
            mealPeriod: "lunch",
         },
      );

      expect(url).toBe(
         "https://apiv4.dineoncampus.com/locations/abc/menu?period=9&date=2026-05-13",
      );
   });

   it("rewrites dated web menu paths with the requested date and meal period", () => {
      const url = buildMenuUrl(
         "https://dineoncampus.com/calpoly/whats-on-the-menu/2026-05-01/breakfast",
         {
            date: "2026-05-13",
            mealPeriod: "lunch",
         },
      );

      expect(url).toBe(
         "https://dineoncampus.com/calpoly/whats-on-the-menu/2026-05-13/lunch",
      );
   });

   it("appends mealPeriod if date is the last segment in the URL", () => {
      const url = buildMenuUrl(
         "https://example.com/menu/2026-05-13",
         {
            date: "2026-05-14",
            mealPeriod: "breakfast",
         },
      );
      expect(url).toBe(
         "https://example.com/menu/2026-05-14/breakfast",
      );
   });
});

describe("generic menu payload parsing", () => {
   it("walks nested menu JSON and normalizes menu items", () => {
      const payload = {
         stations: [
            {
               name: "Grill",
               items: [
                  {
                     title: "Tri Tip Sandwich",
                     desc: "Smoked tri tip on sourdough",
                     serving_size: "1 sandwich",
                     price: "$11.50",
                     nutrition: {
                        calories: "620 cal",
                        total_fat: "21g",
                        total_carbohydrates: "55g",
                        protein: "34g",
                     },
                     allergens: [
                        { name: "Wheat" },
                        { label: "Milk" },
                     ],
                     traits: "Local | Popular",
                  },
               ],
            },
         ],
      };

      expect(
         parseMenuPayload(payload, {
            sourceUrl: "https://example.com/menu",
            mealPeriod: "lunch",
         }),
      ).toEqual([
         expect.objectContaining({
            category: "Grill",
            name: "Tri Tip Sandwich",
            description: "Smoked tri tip on sourdough",
            portion: "1 sandwich",
            price: 11.5,
            calories: 620,
            fat: "21g",
            carbs: "55g",
            protein: "34g",
            allergens: ["Wheat", "Milk"],
            dietary_tags: ["Local", "Popular"],
            source_url: "https://example.com/menu",
            meal_period: "lunch",
         }),
      ]);
   });

   it("extracts JSON from HTML script blocks and removes duplicate items", () => {
      const html = `
         <html>
            <script type="application/json">
               {
                  "sections": [
                     {
                        "name": "Breakfast",
                        "items": [
                           { "name": "Oatmeal", "calories": 180 },
                           { "name": "Oatmeal", "calories": 180 }
                        ]
                     }
                  ]
               }
            </script>
         </html>
      `;

      const items = parseMenuPayload(html, {
         sourceUrl: "https://example.com/breakfast",
         mealPeriod: "breakfast",
      });

      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(
         expect.objectContaining({
            category: "Breakfast",
            name: "Oatmeal",
            calories: 180,
            meal_period: "breakfast",
         }),
      );
   });

   it("uses plural categories as item context", () => {
      const payload = {
         period: {
            categories: [
               {
                  name: "Sides",
                  items: [
                     {
                        name: "Pork Egg Rolls",
                        desc: "Shredded pork and vegetables, in a crispy wrapper.",
                        portion: "2 each",
                        calories: 460,
                     },
                  ],
               },
            ],
         },
      };

      expect(
         parseMenuPayload(payload, {
            sourceUrl: "https://example.com/menu",
            mealPeriod: "dinner",
         }),
      ).toEqual([
         expect.objectContaining({
            category: "Sides",
            name: "Pork Egg Rolls",
            portion: "2 each",
            calories: 460,
            meal_period: "dinner",
         }),
      ]);
   });

   it("deletes all meal periods if mealPeriod is not provided", async () => {
      const deleteEq = jest
         .fn()
         .mockResolvedValue({ error: null });
      const deleteMock = jest.fn(() => ({ eq: deleteEq }));
      const insertMock = jest.fn(() => ({
         select: jest
            .fn()
            .mockResolvedValue({ data: [], error: null }),
      }));

      supabase.from.mockReturnValue({
         delete: deleteMock,
         insert: insertMock,
      });

      await replaceRestaurantMenu({
         restaurantId: 13,
         items: [
            { category: "Breakfast", name: "Oatmeal" },
         ],
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(deleteEq).toHaveBeenCalledTimes(1);
      expect(deleteEq).toHaveBeenCalledWith(
         "restaurant_id",
         13,
      );
   });
});

describe("URL building and resolution edge cases", () => {
   it("returns original sourceUrl if it is not a valid URL format", () => {
      expect(buildMenuUrl("not-a-url")).toBe("not-a-url");
   });

   it("returns null if no sourceUrl is provided", () => {
      expect(buildMenuUrl(null)).toBeNull();
   });
});

describe("Normalizers and JSON extraction", () => {
   it("normalizes text, numbers, lists and strips dietary tags from names", () => {
      const payload = {
         name: "Veggie Burger | VG | AG",
         description: "  A tasty &amp; healthy burger  ",
         calories: "350.5 kcal",
         dietary_tags: [{ name: "Vegan" }, "Gluten-Free"],
         allergens: "Soy,Wheat|Peanuts",
      };

      const items = parseMenuPayload(payload, {
         sourceUrl: "test",
         mealPeriod: "lunch",
      });
      expect(items[0]).toEqual(
         expect.objectContaining({
            name: "Veggie Burger",
            description: "A tasty & healthy burger",
            calories: 350.5,
            dietary_tags: ["Vegan", "Gluten-Free"],
            allergens: ["Soy", "Wheat", "Peanuts"],
         }),
      );
   });

   it("finds nutrients in nested structures and normalizes fields", () => {
      const payload = {
         name: "Complex Nutrient Item",
         price: "5.99",
         portion: "1 slice",
         nutrition: [
            { name: "Calories", value: "250 kcal" },
            { label: "Total Fat", amount: "10g" },
            {
               title: "Carbohydrates",
               display_value: "30g",
            },
         ],
         nutrition_facts: {
            protein: "15g",
         },
      };
      const items = parseMenuPayload(payload, {
         sourceUrl: "test",
         mealPeriod: "lunch",
      });

      expect(items).toHaveLength(1);
      const item = items[0];
      expect(item.price).toBe(5.99);
      expect(item.portion).toBe("1 slice");
      expect(item.calories).toBe(250);
      expect(item.fat).toBe("10g");
      expect(item.carbs).toBe("30g");
      expect(item.protein).toBe("15g");
   });

   it("extracts JSON from window assignment scripts and __NEXT_DATA__", () => {
      const html = `
         <html>
            <script id="__NEXT_DATA__" type="application/json">{"name": "NextData Item", "calories": 100}</script>
            <script>window.__INITIAL_STATE__ = {"name": "Window Item", "calories": 200};</script>
         </html>
      `;
      const items = parseMenuPayload(html, {
         sourceUrl: "test",
         mealPeriod: "dinner",
      });
      expect(items.length).toBe(2);
      expect(
         items.find((i) => i.name === "NextData Item"),
      ).toBeDefined();
      expect(
         items.find((i) => i.name === "Window Item"),
      ).toBeDefined();
   });

   it("handles circular references gracefully", () => {
      const payload = { name: "Circular" };
      payload.self = payload;
      const items = parseMenuPayload(payload, {
         sourceUrl: "test",
         mealPeriod: "lunch",
      });
      expect(items).toHaveLength(0); // Validates it does not crash (call stack exceeded)
   });
});

describe("fetchMenuSource and fetchDineOnCampusSource", () => {
   const originalFetch = global.fetch;
   let consoleErrorSpy;

   beforeEach(() => {
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
   });

   afterEach(() => {
      global.fetch = originalFetch;
      consoleErrorSpy.mockRestore();
   });

   it("fetchMenuSource returns text on success", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () => Promise.resolve("Success HTML"),
      });
      const text = await fetchMenuSource(
         "https://example.com/menu",
      );
      expect(text).toBe("Success HTML");
   });

   it("fetchMenuSource throws Cloudflare block error on 403 with specific text", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: false,
         status: 403,
         text: () =>
            Promise.resolve(
               "Sorry, you have been blocked by Cloudflare",
            ),
      });
      await expect(
         fetchMenuSource("https://example.com/menu"),
      ).rejects.toThrow(/Cloudflare/);
   });

   it("fetchMenuSource throws standard error on other failures", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: false,
         status: 500,
         text: () =>
            Promise.resolve("Internal Server Error"),
      });
      await expect(
         fetchMenuSource("https://example.com/menu"),
      ).rejects.toThrow(/HTTP 500/);
   });

   it("fetchDineOnCampusSource returns text on success", async () => {
      chromium.launch.mockResolvedValue({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve("Playwright HTML"),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const text = await fetchDineOnCampusSource(
         "https://apiv4.dineoncampus.com",
      );
      expect(text).toBe("Playwright HTML");
   });

   it("fetchDineOnCampusSource throws Cloudflare error on 403", async () => {
      chromium.launch.mockResolvedValue({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => false,
                  status: () => 403,
               }),
               content: jest
                  .fn()
                  .mockResolvedValue(
                     "Sorry, you have been blocked",
                  ),
            }),
         }),
         close: jest.fn(),
      });
      await expect(
         fetchDineOnCampusSource(
            "https://apiv4.dineoncampus.com",
         ),
      ).rejects.toThrow(
         "Dine on Campus blocked the browser request with Cloudflare.",
      );
   });

   it("fetchDineOnCampusSource throws generic error if goto returns null or other status", async () => {
      chromium.launch.mockResolvedValue({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue(null),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      await expect(
         fetchDineOnCampusSource(
            "https://apiv4.dineoncampus.com",
         ),
      ).rejects.toThrow(
         "Menu source returned HTTP unknown.",
      );
   });
});

describe("Subway PDF specific edge cases", () => {
   it("ignores Subway headers and invalid lines", () => {
      const text = `
         -- 1 of 3 --
         Egg Patty on 12" Wrap
         U.S. NUTRITION INFORMATION
         SANDWICHES
         Serving Size
         2,000 calories
         Values include
         6" Sandwiches
         Cheesesteaks
         6" Steak Philly 192 510 25 9 1 85 1320 43 2 5 3 28 10 6 90 100
      `;
      const items = parseSubwayNutritionText(text);
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('6" Steak Philly');
   });
});

describe("scrapeRestaurantMenu and resolveDineOnCampusMenuUrl", () => {
   it("resolves DineOnCampus periods and fetches menu", async () => {
      let callCount = 0;
      chromium.launch.mockResolvedValue({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () => {
                     callCount++;
                     if (callCount === 1) {
                        return Promise.resolve(
                           JSON.stringify({
                              periods: [
                                 {
                                    id: "period123",
                                    name: "Lunch",
                                 },
                              ],
                           }),
                        );
                     }
                     return Promise.resolve(
                        JSON.stringify({
                           items: [
                              {
                                 name: "DOC Burger",
                                 calories: 500,
                              },
                           ],
                        }),
                     );
                  },
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });

      const result = await scrapeRestaurantMenu(
         {
            id: 1,
            name: "Test Dining",
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/abc/menu",
         },
         { mealPeriod: "lunch", dryRun: true },
      );

      expect(result.sourceUrl).toContain(
         "period=period123",
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("DOC Burger");
   });

   it("returns warning if no items parsed", async () => {
      chromium.launch.mockResolvedValue({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(JSON.stringify({})), // empty
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const result = await scrapeRestaurantMenu(
         {
            id: 1,
            name: "Test Dining",
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/abc/menu",
         },
         { mealPeriod: "lunch", dryRun: false },
      );

      expect(result.warning).toBeDefined();
      expect(result.items).toHaveLength(0);
   });

   it("returns error if missing menu_source_url", async () => {
      const result = await scrapeRestaurantMenu(
         { id: 3, name: "No URL" },
         { dryRun: true },
      );
      expect(result.error).toBe("Missing menu_source_url");
   });

   it("processes Subway nutrition pdf", async () => {
      const result = await scrapeRestaurantMenu(
         {
            id: 2,
            name: "Subway",
            menu_source_url: "subway:nutrition",
         },
         { dryRun: true },
      );
      expect(result.sourceUrl).toContain("subway.com");
      expect(result.items.length).toBeGreaterThan(0);
   });
});

describe("scrapeCurrentMenus orchestration", () => {
   let consoleLogSpy;
   let consoleErrorSpy;
   let consoleTableSpy;
   const originalArgv = process.argv;

   beforeEach(() => {
      consoleLogSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      consoleTableSpy = jest
         .spyOn(console, "table")
         .mockImplementation(() => {});
      process.argv = [...originalArgv];
   });

   afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleTableSpy.mockRestore();
      process.argv = originalArgv;
   });

   it("correctly parses CLI arguments", async () => {
      process.argv = [
         "node",
         "script",
         "--date=2023-10-10",
         "--dry-run",
      ];

      const mockQuery = {
         eq: function () {
            return this;
         },
         then: function (resolve) {
            resolve({ data: [], error: null });
         },
      };
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      await scrapeCurrentMenus({ delayMs: 0 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining("2023-10-10"),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
         expect.stringContaining("(dry run)"),
      );
   });

   it("throws on invalid meal period", async () => {
      await expect(
         scrapeCurrentMenus({ mealPeriod: "invalid" }),
      ).rejects.toThrow("Invalid meal period");
   });

   it("throws if sourceUrl is provided without restaurantId (not dry-run)", async () => {
      await expect(
         scrapeCurrentMenus({
            sourceUrl: "http://example.com",
            dryRun: false,
         }),
      ).rejects.toThrow("Pass --restaurant-id");
   });

   it("fetches restaurants and scrapes them successfully", async () => {
      const mockQuery = {
         eq: function () {
            return this;
         },
         then: function (resolve) {
            resolve({
               data: [
                  {
                     id: 1,
                     name: "Test",
                     menu_source_url: "http://example.com",
                  },
               ],
               error: null,
            });
         },
      };

      const insertMock = jest.fn(() => ({
         select: jest.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
         }),
      }));
      const deleteEq = jest.fn().mockReturnValue({
         eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const deleteMock = jest.fn(() => ({ eq: deleteEq }));

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
         delete: deleteMock,
         insert: insertMock,
      });

      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: [
                     { name: "Test Item", calories: 100 },
                  ],
               }),
            ),
      });

      process.argv = ["node", "script"]; // ensure arguments don't pollute
      await scrapeCurrentMenus({
         delayMs: 0,
         dryRun: false,
      });

      expect(supabase.from).toHaveBeenCalledWith(
         "restaurants",
      );
      expect(insertMock).toHaveBeenCalled();
   });

   it("handles scraping errors gracefully without crashing the loop", async () => {
      const mockQuery = {
         eq: function () {
            return this;
         },
         then: function (resolve) {
            resolve({
               data: [
                  {
                     id: 1,
                     name: "Test",
                     menu_source_url: "http://example.com",
                  },
               ],
               error: null,
            });
         },
      };
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      global.fetch = jest
         .fn()
         .mockRejectedValue(new Error("Network Error"));

      await scrapeCurrentMenus({
         delayMs: 0,
         dryRun: true,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "Failed to scrape Test: Network Error",
         ),
      );
   });

   it("handles explicit sourceUrl argument with restaurantId correctly", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: [
                     {
                        name: "Test URL Item",
                        calories: 100,
                     },
                  ],
               }),
            ),
      });

      await scrapeCurrentMenus({
         sourceUrl: "http://example.com/menu",
         restaurantId: 5,
         dryRun: true,
         delayMs: 0,
      });

      expect(consoleTableSpy).toHaveBeenCalled();
   });
});

describe("scheduleCurrentMenuScraper", () => {
   const originalEnv = process.env.NODE_ENV;

   afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      jest.clearAllMocks();
   });

   it("returns empty array in test environment", () => {
      process.env.NODE_ENV = "test";
      expect(scheduleCurrentMenuScraper()).toEqual([]);
   });

   it("schedules cron jobs in production environment", async () => {
      process.env.NODE_ENV = "production";
      scheduleCurrentMenuScraper();
      expect(cron.schedule).toHaveBeenCalledTimes(4);

      // Trigger the cron callback to ensure it processes gracefully
      const cronCallback = cron.schedule.mock.calls[0][1];
      const consoleLogSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      const consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue({
            then: (cb) => cb({ data: [], error: null }),
         }),
      });
      cronCallback();
      await new Promise((resolve) =>
         setTimeout(resolve, 50),
      );
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
   });
});

describe("Subway menu scraping", () => {
   it("resolves the Subway nutrition alias to the official PDF", () => {
      expect(buildMenuUrl("subway:nutrition")).toBe(
         "https://www.subway.com/en-us/-/media/northamerica/usa/nutrition/nutritiondocuments/2026/us_nutrition_en_1-2026.pdf",
      );
   });

   it("parses Subway nutrition PDF text into menu items", () => {
      const text = `
         6" Sandwiches
         Cheesesteaks
         6" Steak Philly 192 510 25 9 1 85 1320 43 2 5 3 28 10 6 90 100
         Wraps
         Chicken
         Grilled Chicken 349 680 31 9 1 135 1240 55 3 5 1 48 25 15 25 20
         Cookies & Sides
         White Chip Macadamia Nut Cookie 45 210 10 5 0 15 125 28 <1 17 17 2 0 0 0 10
      `;

      expect(
         parseSubwayNutritionText(text, {
            sourceUrl: "subway.pdf",
         }),
      ).toEqual([
         expect.objectContaining({
            category: '6" Sandwiches - Cheesesteaks',
            name: '6" Steak Philly',
            portion: "192 g",
            calories: 510,
            fat: "25g",
            carbs: "43g",
            protein: "28g",
            meal_period: "every-day",
            source_url: "subway.pdf",
         }),
         expect.objectContaining({
            category: "Wraps - Chicken",
            name: "Grilled Chicken",
            portion: "349 g",
            calories: 680,
            fat: "31g",
            carbs: "55g",
            protein: "48g",
         }),
         expect.objectContaining({
            category: "Cookies & Sides",
            name: "White Chip Macadamia Nut Cookie",
            portion: "45 g",
            calories: 210,
            carbs: "28g",
            protein: "2g",
         }),
      ]);
   });

   it("removes duplicate subway items based on category, name, and meal period", () => {
      const text = `
         6" Sandwiches
         Cheesesteaks
         6" Steak Philly 192 510 25 9 1 85 1320 43 2 5 3 28 10 6 90 100
         6" Steak Philly 192 510 25 9 1 85 1320 43 2 5 3 28 10 6 90 100
      `;
      const items = parseSubwayNutritionText(text, {
         sourceUrl: "subway.pdf",
      });
      expect(items).toHaveLength(1);
   });
});

describe("menu replacement safety", () => {
   it("does not delete existing rows when no items were parsed", async () => {
      const result = await replaceRestaurantMenu({
         restaurantId: 13,
         items: [],
         mealPeriod: "lunch",
      });

      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
   });

   it("deletes the current meal period and inserts parsed rows", async () => {
      const deleteEq = jest.fn();
      deleteEq
         .mockReturnValueOnce({ eq: deleteEq })
         .mockResolvedValueOnce({ error: null });
      const deleteMock = jest.fn(() => ({ eq: deleteEq }));
      const selectMock = jest.fn().mockResolvedValue({
         data: [
            {
               id: 99,
               name: "Oatmeal",
               category: "Breakfast",
               restaurant_id: 13,
               meal_period: "breakfast",
            },
         ],
         error: null,
      });
      const insertMock = jest.fn(() => ({
         select: selectMock,
      }));

      supabase.from.mockReturnValue({
         delete: deleteMock,
         insert: insertMock,
      });

      const result = await replaceRestaurantMenu({
         restaurantId: 13,
         mealPeriod: "breakfast",
         items: [
            {
               category: "Breakfast",
               name: "Oatmeal",
               meal_period: "breakfast",
            },
         ],
      });

      expect(supabase.from).toHaveBeenCalledWith(
         "menu_items",
      );
      expect(deleteMock).toHaveBeenCalled();
      expect(deleteEq).toHaveBeenNthCalledWith(
         1,
         "restaurant_id",
         13,
      );
      expect(deleteEq).toHaveBeenNthCalledWith(
         2,
         "meal_period",
         "breakfast",
      );
      expect(insertMock).toHaveBeenCalledWith([
         {
            category: "Breakfast",
            name: "Oatmeal",
            meal_period: "breakfast",
            restaurant_id: 13,
         },
      ]);
      expect(selectMock).toHaveBeenCalledWith(
         "id,name,category,restaurant_id,meal_period",
      );
      expect(result).toEqual([
         {
            id: 99,
            name: "Oatmeal",
            category: "Breakfast",
            restaurant_id: 13,
            meal_period: "breakfast",
         },
      ]);
   });
});

describe("edge cases and fallbacks", () => {
   const originalFetch = global.fetch;
   let consoleErrorSpy, consoleLogSpy, consoleWarnSpy;

   beforeEach(() => {
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      consoleLogSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      consoleWarnSpy = jest
         .spyOn(console, "warn")
         .mockImplementation(() => {});
   });

   afterEach(() => {
      global.fetch = originalFetch;
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      jest.clearAllMocks();
   });

   it("getCurrentMealPeriod handles missing time parts", () => {
      const formatSpy = jest
         .spyOn(
            Intl.DateTimeFormat.prototype,
            "formatToParts",
         )
         .mockReturnValue([]);
      expect(getCurrentMealPeriod(new Date())).toBe(
         "breakfast",
      );
      formatSpy.mockRestore();
   });

   it("buildMenuUrl handles whats-on-the-menu paths without dates", () => {
      const url = buildMenuUrl(
         "https://dineoncampus.com/calpoly/whats-on-the-menu",
         { date: "2026-05-13", mealPeriod: "dinner" },
      );
      expect(url).toBe(
         "https://dineoncampus.com/calpoly/whats-on-the-menu/2026-05-13/dinner",
      );
   });

   it("isDineOnCampusApiMenuUrl handles bad urls and throws safely", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(JSON.stringify({ items: [] })),
      });
      const res = await scrapeRestaurantMenu(
         { id: 1, menu_source_url: "not-a-url" },
         { dryRun: true },
      );
      expect(res.sourceUrl).toBe("not-a-url");
   });

   it("isDineOnCampusApiMenuUrl evaluates false for matching hostname but different path", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(
                        JSON.stringify({ items: [] }),
                     ),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const res = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/some/other/path",
         },
         { date: "2026-05-13", dryRun: true },
      );
      expect(res.sourceUrl).toBe(
         "https://apiv4.dineoncampus.com/some/other/path?date=2026-05-13",
      );
   });

   it("isDineOnCampusApiMenuUrl evaluates false for different hostname but matching path", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(JSON.stringify({ items: [] })),
      });
      const res = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://example.com/locations/123/menu",
         },
         { dryRun: true },
      );
      expect(res.sourceUrl).toBe(
         "https://example.com/locations/123/menu",
      );
   });

   it("parseMenuPayload removes duplicate items using seen key", () => {
      const payload = [
         {
            name: "Duplicate",
            category: "Grill",
            calories: 100,
         },
         {
            name: "Duplicate",
            category: "Grill",
            calories: 200,
         },
      ];
      const items = parseMenuPayload(payload, {
         mealPeriod: "lunch",
      });
      expect(items.length).toBe(1);
      expect(items[0].calories).toBe(100);
   });

   it("resolveDineOnCampusMenuUrl handles everyday periods", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(
                        JSON.stringify({
                           periods: [
                              {
                                 id: "every",
                                 name: "every day",
                              },
                           ],
                        }),
                     ),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const result = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/123/menu",
         },
         { mealPeriod: "dinner", dryRun: true },
      );
      expect(result.sourceUrl).toContain("period=every");
   });

   it("resolveDineOnCampusMenuUrl returns sourceUrl if no ID in periods", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(
                        JSON.stringify({
                           periods: [
                              { name: "No ID Period" },
                           ],
                        }),
                     ),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const result = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/123/menu",
         },
         { mealPeriod: "lunch", dryRun: true },
      );
      expect(result.sourceUrl).not.toContain("period=");
   });

   it("selectDineOnCampusPeriod fallback with null mealPeriod", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(
                        JSON.stringify({
                           periods: [
                              {
                                 id: "fallback",
                                 name: "Any",
                              },
                           ],
                        }),
                     ),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const result = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/123/menu",
         },
         { mealPeriod: null, dryRun: true },
      );
      expect(result.sourceUrl).toContain("period=fallback");
   });

   it("normalizeNumber returns null for text", () => {
      const payload = {
         name: "Test",
         calories: "none",
         price: "",
      };
      const items = parseMenuPayload(payload);
      expect(items[0].calories).toBeNull();
      expect(items[0].price).toBeNull();
   });

   it("findNutrientValue finds replaced names", () => {
      const payload = {
         name: "Test",
         nutrition_facts: {
            total_fat: "10g",
            total_carbohydrates: "20g",
         },
      };
      const items = parseMenuPayload(payload);
      expect(items[0].fat).toBe("10g");
      expect(items[0].carbs).toBe("20g");
   });

   it("getContextName pulls from station_name", () => {
      const payload = {
         station_name: "Explicit Station",
         items: [{ name: "Eggs", calories: 100 }],
      };
      const items = parseMenuPayload(payload);
      expect(items[0].category).toBe("Explicit Station");
   });

   it("getContextName pulls from key using section regex", () => {
      const payload = {
         "My Section": {
            name: "My Section Title",
            items: [{ name: "Toast", calories: 100 }],
         },
      };
      const items = parseMenuPayload(payload);
      expect(items[0].category).toBe("My Section Title");
   });

   it("parseJsonSafely ignores corrupted JSON strings", () => {
      expect(parseMenuPayload("invalid { json")).toEqual(
         [],
      );
   });

   it("cleanSubwayCategoryName handles Subway edge cases", () => {
      const text = `
         Stray Item 100 200 10 0 0 0 0 10 2 0 0 0 0 0 0 0
         Egg Patty on 6" Artisan Italian
         Breakfast Item 100 200 10 0 0 0 0 10 2 0 0 0 0 0 0 0
         **Random Item** 10 20 1 0 0 0 0 1 0 0 0 0 0 0 0 0
      `;
      const items = parseSubwayNutritionText(text);
      expect(items[0].category).toBe("Subway Menu");
      expect(items[0].name).toBe("Stray Item");
      expect(items[1].category).toBe("Breakfast");
      expect(items[2].name).toBe("**Random Item");
      expect(items[2].category).toBe("Breakfast");
   });

   it("fetchRestaurants filters by ID", async () => {
      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: (cb) =>
            cb({
               data: [
                  {
                     id: 42,
                     menu_source_url: "http://example.com",
                  },
               ],
               error: null,
            }),
      };
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(JSON.stringify({ items: [] })),
      });

      await scrapeCurrentMenus({
         restaurantId: "42",
         dryRun: true,
         delayMs: 0,
      });
      expect(mockQuery.eq).toHaveBeenCalledWith("id", 42);
   });

   it("scrapeCurrentMenus executes gracefully with sourceUrl and no dryRun when valid", async () => {
      const insertMock = jest.fn(() => ({
         select: jest.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
         }),
      }));
      const deleteMock = jest.fn(() => ({
         eq: jest.fn().mockReturnThis(),
         then: (cb) => cb({ error: null }),
      }));

      supabase.from.mockReturnValue({
         delete: deleteMock,
         insert: insertMock,
      });

      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: [{ name: "Test", calories: 100 }],
               }),
            ),
      });

      await scrapeCurrentMenus({
         sourceUrl: "http://example.com",
         restaurantId: 5,
         dryRun: false,
         delayMs: 0,
      });
      expect(insertMock).toHaveBeenCalled();
   });

   it("replaceRestaurantMenu throws on insert error", async () => {
      supabase.from.mockReturnValue({
         delete: jest.fn(() => ({
            eq: jest.fn().mockReturnThis(),
            then: (cb) => cb({ error: null }),
         })),
         insert: jest.fn(() => ({
            select: jest.fn().mockResolvedValue({
               error: new Error("Insert failed"),
            }),
         })),
      });
      await expect(
         replaceRestaurantMenu({
            restaurantId: 1,
            items: [{ name: "A", category: "B" }],
            mealPeriod: "lunch",
         }),
      ).rejects.toThrow("Insert failed");
   });

   it("replaceRestaurantMenu throws on delete error", async () => {
      const queryMock = {
         eq: function () {
            return this;
         },
         then: function (cb) {
            cb({ error: new Error("Delete failed") });
         },
      };
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnValue(queryMock),
      });
      await expect(
         replaceRestaurantMenu({
            restaurantId: 1,
            items: [{ name: "A", category: "B" }],
            mealPeriod: "lunch",
         }),
      ).rejects.toThrow("Delete failed");
   });

   it("fetchDineOnCampusSource throws Attention Required cloudflare error", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => false,
                  status: () => 403,
               }),
               content: jest
                  .fn()
                  .mockResolvedValue(
                     "Attention Required! Cloudflare",
                  ),
            }),
         }),
         close: jest.fn(),
      });
      await expect(
         fetchDineOnCampusSource(
            "https://apiv4.dineoncampus.com",
         ),
      ).rejects.toThrow(
         "Dine on Campus blocked the browser request with Cloudflare.",
      );
   });

   it("scheduleCurrentMenuScraper catches internal cron errors", async () => {
      process.env.NODE_ENV = "production";
      scheduleCurrentMenuScraper();
      const cronCallback =
         cron.schedule.mock.calls[
            cron.schedule.mock.calls.length - 1
         ][1];

      // Triggering an error by forcing supabase to fail
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue({
            then: (cb) =>
               cb({
                  data: null,
                  error: new Error("DB fail"),
               }),
         }),
      });
      cronCallback();
      await new Promise((resolve) =>
         setTimeout(resolve, 50),
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
   });
});

describe("CLI execution", () => {
   const originalArgv = process.argv;
   const originalExitCode = process.exitCode;
   let consoleErrorSpy;

   beforeEach(() => {
      jest.resetModules();
      process.argv = [...originalArgv];
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
   });

   afterEach(() => {
      process.argv = originalArgv;
      process.exitCode = originalExitCode;
      consoleErrorSpy.mockRestore();
   });

   it("executes scrapeCurrentMenus when run directly", async () => {
      process.argv[1] = "scrapeCurrentMenus.js";
      process.argv.push("--meal-period=invalid"); // force error to cover catch block

      await import("../utils/scrapeCurrentMenus.js");

      // Wait for event loop to clear so catch block executes
      await new Promise((resolve) =>
         setTimeout(resolve, 50),
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
   });
});

describe("additional branch coverage", () => {
   const originalArgv = process.argv;
   const originalFetch = global.fetch;
   let consoleErrorSpy, consoleTableSpy, consoleLogSpy;

   beforeEach(() => {
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      consoleTableSpy = jest
         .spyOn(console, "table")
         .mockImplementation(() => {});
      consoleLogSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      process.argv = [...originalArgv];
   });

   afterEach(() => {
      global.fetch = originalFetch;
      consoleErrorSpy.mockRestore();
      consoleTableSpy.mockRestore();
      consoleLogSpy.mockRestore();
      process.argv = originalArgv;
      jest.clearAllMocks();
   });

   it("covers deep getNestedValue misses and un-categorized fallback", () => {
      const payload = {
         name: "Plain Item",
         description: "No nutrients",
      };
      const items = parseMenuPayload([payload]);
      expect(items[0].category).toBe("Uncategorized");
      expect(items[0].calories).toBeNull();
      expect(items[0].price).toBeNull();
      expect(items[0].fat).toBeNull();
      expect(items[0].carbs).toBeNull();
      expect(items[0].protein).toBeNull();
      expect(items[0].allergens).toEqual([]);
      expect(items[0].dietary_tags).toEqual([]);
   });

   it("covers Subway parser minorCategory fallback", () => {
      const text = `
         8" Pizza
         Cheese Pizza 10 20 1 0 0 0 0 1 0 0 0 0 0 0 0 0
      `;
      const items = parseSubwayNutritionText(text);
      expect(items[0].category).toBe('8" Pizza');
   });

   it("covers JSON payload extraction with HTML encoded characters", () => {
      const html = `
         <html>
            <script type="application/json">{&quot;name&quot;: &quot;test &amp; item&quot;, &quot;calories&quot;: 100}</script>
         </html>
      `;
      const items = parseMenuPayload(html);
      expect(items[0].name).toBe("test & item");
   });

   it("covers fetchMenuSource 403 but not cloudflare", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: false,
         status: 403,
         text: () =>
            Promise.resolve(
               "Just a regular forbidden error",
            ),
      });
      await expect(
         fetchMenuSource("https://example.com/menu"),
      ).rejects.toThrow("Menu source returned HTTP 403.");
   });

   it("covers scrapeCurrentMenus branch for missing restaurant.name", async () => {
      const mockQuery = {
         eq: function () {
            return this;
         },
         then: function (cb) {
            cb({
               data: [
                  {
                     id: 999,
                     menu_source_url: "http://example.com",
                  },
               ],
               error: null,
            });
         },
      };

      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });

      global.fetch = jest
         .fn()
         .mockRejectedValue(new Error("Fake failure"));

      await scrapeCurrentMenus({
         delayMs: 0,
         dryRun: false,
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "Failed to scrape Restaurant 999: Fake failure",
         ),
      );
   });

   it("covers scrapeCurrentMenus dryRun empty items branch", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(JSON.stringify({ items: [] })),
      });
      await scrapeCurrentMenus({
         sourceUrl: "http://example.com",
         dryRun: true,
         delayMs: 0,
      });
      expect(consoleTableSpy).not.toHaveBeenCalled();
   });

   it("covers CLI arg parsing branches for source-url without restaurant-id", async () => {
      process.argv = [
         "node",
         "script.js",
         "--source-url=http://example.com",
         "--dry-run",
      ];
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: [
                     { name: "Arg Item", calories: 100 },
                  ],
               }),
            ),
      });
      await scrapeCurrentMenus({ delayMs: 0 });
      expect(consoleTableSpy).toHaveBeenCalled();
   });
});

describe("deep object parsing and formatting", () => {
   const originalArgv = process.argv;
   const originalFetch = global.fetch;
   let consoleErrorSpy, consoleTableSpy, consoleLogSpy;

   beforeEach(() => {
      consoleErrorSpy = jest
         .spyOn(console, "error")
         .mockImplementation(() => {});
      consoleTableSpy = jest
         .spyOn(console, "table")
         .mockImplementation(() => {});
      consoleLogSpy = jest
         .spyOn(console, "log")
         .mockImplementation(() => {});
      process.argv = [...originalArgv];
   });

   afterEach(() => {
      global.fetch = originalFetch;
      consoleErrorSpy.mockRestore();
      consoleTableSpy.mockRestore();
      consoleLogSpy.mockRestore();
      process.argv = originalArgv;
      jest.clearAllMocks();
   });

   it("covers exhaustive getDisplayName and normalizeList paths", () => {
      const payload = [
         {
            category_name: "CatName",
            items: [
               {
                  name: "Item 1",
                  dietary_tags: [
                     { title: "Tag Title" },
                     { label: "Tag Label" },
                     { value: "Tag Value" },
                     null,
                     "",
                  ],
                  calories: 10,
               },
            ],
         },
         {
            station: "StatName",
            items: [{ name: "Item 2", calories: 10 }],
         },
         {
            station_name: "StatName2",
            items: [{ name: "Item 3", calories: 10 }],
         },
         {
            title: "TitleName",
            items: [{ name: "Item 4", calories: 10 }],
         },
      ];
      const items = parseMenuPayload(payload, {
         category: "Section",
      });
      expect(items.length).toBe(4);
      expect(items[0].category).toBe("CatName");
      expect(items[0].dietary_tags).toEqual([
         "Tag Title",
         "Tag Label",
         "Tag Value",
      ]);
      expect(items[1].category).toBe("StatName");
      expect(items[2].category).toBe("StatName2");
   });

   it("covers getDisplayName title/name fallbacks via section key", () => {
      const payload = {
         section: {
            title: "Section Title",
            items: [{ name: "Item 1", calories: 10 }],
         },
         course: {
            name: "Course Name",
            items: [{ name: "Item 2", calories: 10 }],
         },
      };
      const items = parseMenuPayload(payload);
      expect(items[0].category).toBe("Section Title");
      expect(items[1].category).toBe("Course Name");
   });

   it("covers getNestedValue alternative keys for protein, carbs, and fat", () => {
      const items = parseMenuPayload([
         {
            name: "Alt Nutrients",
            nutrition: {
               protein: "10g",
               fat: "5g",
               carbs: "20g",
            },
         },
         {
            name: "Alt Nutrients 2",
            nutrition_facts: {
               protein: "11g",
               fat: "6g",
               carbs: "21g",
            },
         },
      ]);
      expect(items[0].protein).toBe("10g");
      expect(items[1].protein).toBe("11g");
   });

   it("covers getNestedValue alternative keys for name", () => {
      const items = parseMenuPayload([
         { item_name: "Item 1", calories: 10 },
         { product_name: "Item 2", calories: 10 },
         { formal_name: "Item 3", calories: 10 },
      ]);
      expect(items[0].name).toBe("Item 1");
      expect(items[1].name).toBe("Item 2");
      expect(items[2].name).toBe("Item 3");
   });

   it("covers getNestedValue alternative keys for price", () => {
      const items = parseMenuPayload([
         {
            name: "Item",
            display_price: "5.99",
            calories: 10,
         },
      ]);
      expect(items[0].price).toBe(5.99);
   });

   it("covers resolveDineOnCampusMenuUrl payload null", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () => Promise.resolve("null"),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const res = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/123/menu",
         },
         { mealPeriod: "lunch", dryRun: true },
      );
      expect(res.sourceUrl).not.toContain("period=");
   });

   it("covers selectDineOnCampusPeriod missing name using slug", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(
                        JSON.stringify({
                           periods: [
                              { id: "p1", slug: "lunch" },
                           ],
                        }),
                     ),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const res = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/123/menu",
         },
         { mealPeriod: "lunch", dryRun: true },
      );
      expect(res.sourceUrl).toContain("period=p1");
   });

   it("covers scrapeCurrentMenus > 10 items dryRun", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: Array.from({ length: 15 }).map(
                     (_, i) => ({
                        name: `Item ${i}`,
                        calories: 100,
                     }),
                  ),
               }),
            ),
      });
      await scrapeCurrentMenus({
         sourceUrl: "http://example.com",
         restaurantId: 1,
         dryRun: true,
         delayMs: 0,
      });
      expect(consoleTableSpy).toHaveBeenCalled();
      expect(consoleTableSpy.mock.calls[0][0].length).toBe(
         10,
      );
   });

   it("covers scrapeCurrentMenus CLI args with restaurant-id", async () => {
      process.argv = [
         "node",
         "script.js",
         "--source-url=http://example.com",
         "--restaurant-id=42",
         "--dry-run",
      ];
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(JSON.stringify({ items: [] })),
      });
      await scrapeCurrentMenus({ delayMs: 0 });
      expect(supabase.from).not.toHaveBeenCalledWith(
         "restaurants",
      );
   });

   it("covers fetchDineOnCampusSource 403 but not cloudflare", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => false,
                  status: () => 403,
               }),
               content: jest
                  .fn()
                  .mockResolvedValue(
                     "Regular forbidden without keyword",
                  ),
            }),
         }),
         close: jest.fn(),
      });
      await expect(
         fetchDineOnCampusSource(
            "https://apiv4.dineoncampus.com",
         ),
      ).rejects.toThrow("Menu source returned HTTP 403.");
   });

   it("covers Subway scrapeRestaurantMenu branch explicitly", async () => {
      const res = await scrapeRestaurantMenu(
         { id: 2, menu_source_url: "subway:nutrition" },
         { mealPeriod: "lunch", dryRun: true },
      );
      expect(res.items.length).toBeGreaterThan(0);
   });

   it("covers parseSubwayNutritionText without options", () => {
      const text = `
         8" Pizza
         Cheese Pizza 10 20 1 0 0 0 0 1 0 0 0 0 0 0 0 0
      `;
      const items = parseSubwayNutritionText(text);
      expect(items[0].source_url).toBeUndefined();
   });

   it("covers scrapeCurrentMenus with sourceUrl, restaurantId, and NOT dryRun", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: [
                     { name: "Insert Item", calories: 100 },
                  ],
               }),
            ),
      });
      const insertMock = jest.fn().mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: [{ id: 1 }],
            error: null,
         }),
      });
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
               eq: jest
                  .fn()
                  .mockResolvedValue({ error: null }),
            }),
         }),
         insert: insertMock,
      });

      await scrapeCurrentMenus({
         sourceUrl: "http://example.com",
         restaurantId: 99,
         dryRun: false,
         delayMs: 0,
      });
      expect(insertMock).toHaveBeenCalled();
   });

   it("covers scheduleCurrentMenuScraper catch block completely", async () => {
      process.env.NODE_ENV = "production";
      scheduleCurrentMenuScraper();
      const cronCallback =
         cron.schedule.mock.calls[
            cron.schedule.mock.calls.length - 1
         ][1];

      const queryMock = {
         eq: jest.fn().mockReturnThis(),
         then: function (cb) {
            cb({
               data: null,
               error: new Error("Cron DB Fail"),
            });
         },
      };
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(queryMock),
      });

      cronCallback();
      await new Promise((resolve) =>
         setTimeout(resolve, 50),
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
         expect.stringContaining(
            "Scheduled late_night menu scrape failed:",
         ),
         expect.any(Error),
      );
   });

   it("covers getRestaurantMenuSourceUrl and isSubwayRestaurant with missing or null restaurant", async () => {
      const res1 = await scrapeRestaurantMenu(null, {
         dryRun: true,
      });
      expect(res1.error).toBe("Missing menu_source_url");

      const res2 = await scrapeRestaurantMenu(
         {},
         { dryRun: true },
      );
      expect(res2.error).toBe("Missing menu_source_url");
   });

   it("covers getRestaurantMenuSourceUrl fallback for subway", async () => {
      const res = await scrapeRestaurantMenu(
         { id: 1, name: "Subway" },
         { dryRun: true },
      );
      expect(res.sourceUrl).toBe(
         "https://www.subway.com/en-us/-/media/northamerica/usa/nutrition/nutritiondocuments/2026/us_nutrition_en_1-2026.pdf",
      );
   });

   it("covers resolveSubwayNutritionUrl custom pdf url", async () => {
      const res = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://www.subway.com/en-us/-/media/nutritiondocuments/custom.pdf",
         },
         { dryRun: true },
      );
      expect(res.sourceUrl).toBe(
         "https://www.subway.com/en-us/-/media/nutritiondocuments/custom.pdf",
      );
   });

   it("covers selectDineOnCampusPeriod everyday fallback with slug", async () => {
      chromium.launch.mockResolvedValueOnce({
         newContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
               goto: jest.fn().mockResolvedValue({
                  ok: () => true,
                  status: () => 200,
                  text: () =>
                     Promise.resolve(
                        JSON.stringify({
                           periods: [
                              {
                                 id: "every",
                                 slug: "everyday",
                              },
                           ],
                        }),
                     ),
               }),
               content: jest.fn().mockResolvedValue(""),
            }),
         }),
         close: jest.fn(),
      });
      const result = await scrapeRestaurantMenu(
         {
            id: 1,
            menu_source_url:
               "https://apiv4.dineoncampus.com/locations/123/menu",
         },
         { mealPeriod: "dinner", dryRun: true },
      );
      expect(result.sourceUrl).toContain("period=every");
   });

   it("covers findNutrientValue alternative nutrient value keys", () => {
      const items = parseMenuPayload([
         {
            name: "Item 1",
            nutrition: [{ name: "calories", amount: 100 }],
         },
         {
            name: "Item 2",
            nutrition: [
               { name: "calories", display_value: 200 },
            ],
         },
         {
            name: "Item 3",
            nutrition: [
               { name: "calories", quantity: 300 },
            ],
         },
      ]);
      expect(items[0].calories).toBe(100);
      expect(items[1].calories).toBe(200);
      expect(items[2].calories).toBe(300);
   });

   it("covers findNutrientValue primitive container fallback", () => {
      const items = parseMenuPayload([
         {
            name: "Item 1",
            nutrition: "Not an object or array",
         },
      ]);
      expect(items[0].calories).toBeNull();
   });

   it("covers getContextName default key parameter", () => {
      const items = parseMenuPayload({
         category_name: "Root Category",
         items: [{ name: "Root Item", calories: 100 }],
      });
      expect(items[0].category).toBe("Root Category");
   });

   it("covers walkForItems item.name stripped to null", () => {
      const items = parseMenuPayload([
         { name: " | VG", calories: 100 },
      ]);
      expect(items.length).toBe(0);
   });

   it("covers parseJsonSafely returning null for invalid json blocks", () => {
      const html = `<html><script type="application/json">invalid json</script></html>`;
      const items = parseMenuPayload(html);
      expect(items.length).toBe(0);
   });

   it("covers payload falsy object check", () => {
      expect(parseMenuPayload(null)).toEqual([]);
      expect(parseMenuPayload(undefined)).toEqual([]);
      expect(parseMenuPayload(123)).toEqual([]);
   });

   it("covers parseSubwayNutritionText skipping minor category when no major category", () => {
      const text = `
         Unknown Heading
         Cheese Pizza 10 20 1 0 0 0 0 1 0 0 0 0 0 0 0 0
      `;
      const items = parseSubwayNutritionText(text);
      expect(items[0].category).toBe("Subway Menu");
   });

   it("covers fetchRestaurants data fallback", async () => {
      const mockQuery = {
         eq: jest.fn().mockReturnThis(),
         then: function (cb) {
            cb({ data: null, error: null });
         },
      };
      supabase.from.mockReturnValue({
         select: jest.fn().mockReturnValue(mockQuery),
      });
      await scrapeCurrentMenus({
         delayMs: 0,
         dryRun: true,
      });
   });

   it("covers replaceRestaurantMenu data fallback", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(
               JSON.stringify({
                  items: [
                     { name: "Insert Item", calories: 100 },
                  ],
               }),
            ),
      });
      const insertMock = jest.fn().mockReturnValue({
         select: jest.fn().mockResolvedValue({
            data: null,
            error: null,
         }),
      });
      supabase.from.mockReturnValue({
         delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
               eq: jest
                  .fn()
                  .mockResolvedValue({ error: null }),
            }),
         }),
         insert: insertMock,
      });

      await scrapeCurrentMenus({
         sourceUrl: "http://example.com",
         restaurantId: 99,
         dryRun: false,
         delayMs: 0,
      });
      expect(insertMock).toHaveBeenCalled();
   });

   it("covers scrapeRestaurantMenu default options", async () => {
      global.fetch = jest.fn().mockResolvedValue({
         ok: true,
         text: () =>
            Promise.resolve(JSON.stringify({ items: [] })),
      });
      const res = await scrapeRestaurantMenu({
         id: 1,
         menu_source_url: "http://example.com",
      });
      expect(res.items).toEqual([]);
   });
});
