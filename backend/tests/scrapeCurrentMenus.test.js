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
} from "../utils/scrapeCurrentMenus.js";

jest.mock("../config/supabaseClient.js");

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
   it("adds date and Dine on Campus period query params for API sources", () => {
      const url = buildMenuUrl(
         "https://apiv4.dineoncampus.com/locations/abc/menu",
         {
            date: "2026-05-13",
            mealPeriod: "dinner",
         },
      );

      expect(url).toBe(
         "https://apiv4.dineoncampus.com/locations/abc/menu?date=2026-05-13&period=2",
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
