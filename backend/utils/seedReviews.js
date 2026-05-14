import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Using service key to bypass RLS

if (!supabaseUrl || !supabaseKey) {
   console.error("Missing Supabase credentials in .env");
   process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const genericPositive = [
   {
      text: "Absolutely love this place! The food is always fresh.",
      tags: ["Fresh"],
   },
   {
      text: "Honestly one of the better dining options on campus. Highly recommend!",
      tags: ["Good Value", "Comfort Food"],
   },
   {
      text: "My go-to spot between classes. Fast, reliable, and tastes great. Even when the line looks incredibly long, they churn out the orders incredibly fast.",
      tags: ["Fast", "Fresh", "Reliable", "Good Value"],
   },
   {
      text: "The portions here are huge! Definitely get your money's worth.",
      tags: ["Good Value", "Filling"],
   },
   {
      text: "Always hits the spot. The line moves fast even during the lunch rush, which is crucial when you only have 20 minutes between lectures.",
      tags: ["Fast", "Convenient"],
   },
   {
      text: "Best food on campus hands down. I eat here at least twice a week.",
      tags: ["Quality", "Fresh"],
   },
   {
      text: "Super clean and the staff is always smiling. Food is consistently good.",
      tags: ["Friendly Staff", "Clean", "Filling"],
   },
   {
      text: "Incredible flavor! You can tell they use high-quality ingredients.",
      tags: ["Fresh", "Quality"],
   },
   {
      text: "Such a cozy vibe and the meals are perfectly seasoned. 10/10.",
      tags: ["Comfort Food", "Good Vibe"],
   },
   {
      text: "Fast service even when it's packed. The staff really knows what they're doing. Truly amazing customer service!",
      tags: ["Fast", "Friendly Staff", "Reliable", "Clean"],
   },
   {
      text: "They never mess up my custom orders. Always exactly how I want it!",
      tags: [],
   },
   {
      text: "Really great value for a student budget. Will definitely be coming back.",
      tags: ["Good Value"],
   },
   {
      text: "Delicious food and amazing presentation. Looks just like the pictures.",
      tags: ["Fresh", "Quality"],
   },
   {
      text: "The best spot to grab a quick bite before an exam. Highly satisfying.",
      tags: ["Fast", "Filling"],
   },
   {
      text: "I'm obsessed! Everything on the menu is an absolute winner.",
      tags: [],
   },
   {
      text: "Awesome atmosphere and even better food. Perfect place to hang out.",
      tags: ["Good Vibe"],
   },
   {
      text: "The staff here went above and beyond today. The food was piping hot and delicious. It's a great spot to bring your laptop and get some work done while eating.",
      tags: ["Friendly Staff", "Fresh", "Good Vibe"],
   },
   {
      text: "Consistently amazing. It’s hard to find food this good on a college campus.",
      tags: ["Reliable", "Quality"],
   },
];

const genericNeutral = [
   {
      text: "Pretty good food, but the line was way too long today.",
      tags: ["Long Line", "Slow Service"],
   },
   {
      text: "It's okay. Good in a pinch if you don't have time to walk somewhere else.",
      tags: ["Fast"],
   },
   {
      text: "Standard campus food. Nothing special, but it satisfies the craving.",
      tags: [],
   },
   {
      text: "Menu could use some more variety, but the staples are solid.",
      tags: [],
   },
   {
      text: "Food is decent, but it's a bit pricey for what you get.",
      tags: ["Overpriced"],
   },
   {
      text: "It gets the job done. Not the best I've had, but certainly not the worst.",
      tags: [],
   },
   {
      text: "Hit or miss depending on the day. Today was just alright.",
      tags: ["Inconsistent"],
   },
   {
      text: "An average dining experience. Fine if you're already in the area.",
      tags: ["Convenient"],
   },
   {
      text: "The seating area is a bit cramped, but the food is acceptable. I just wish they had more tables available during the 12pm rush.",
      tags: ["Crowded", "Convenient"],
   },
   {
      text: "Takes a while to get your food during rush hour. Quality is fine.",
      tags: ["Slow Service", "Long Line"],
   },
   {
      text: "Nothing to write home about. It's just fuel for studying.",
      tags: ["Filling"],
   },
   {
      text: "I wish they gave slightly bigger portions, but the taste is okay. The staff is polite though.",
      tags: [
         "Small Portions",
         "Friendly Staff",
         "Convenient",
      ],
   },
   {
      text: "Middle of the road. I eat here when the other places are closed. You know exactly what you're going to get.",
      tags: ["Reliable", "Convenient"],
   },
   {
      text: "It's fine. The service is friendly enough but the food lacks flavor. Needs more salt.",
      tags: ["Bland"],
   },
   {
      text: "Decent spot, but they often run out of the popular items early.",
      tags: ["Sold Out"],
   },
   {
      text: "The menu is a bit repetitive if you eat here often. Quality is standard.",
      tags: [],
   },
   {
      text: "Not bad, but I definitely wouldn't go out of my way to eat here.",
      tags: [],
   },
   {
      text: "Food was lukewarm today, though the flavor was still alright. The line was practically non-existent so that was a nice bonus.",
      tags: ["Cold Food", "Fast", "Inconsistent"],
   },
];

const genericNegative = [
   {
      text: "Food was a bit cold today, which is unusual.",
      tags: ["Cold Food"],
   },
   {
      text: "Way overpriced for the portion size you actually get.",
      tags: ["Overpriced", "Small Portions"],
   },
   {
      text: "Service was incredibly slow today and my order was wrong.",
      tags: ["Long Line", "Slow Service", "Wrong Order"],
   },
   {
      text: "Terrible experience. The cashier was rude and the food was bland.",
      tags: ["Rude Staff", "Bland"],
   },
   {
      text: "I waited 30 minutes for a simple order. Absolutely unacceptable.",
      tags: ["Slow Service", "Long Line"],
   },
   {
      text: "The dining area was filthy. Tables hadn't been wiped down in hours.",
      tags: ["Dirty"],
   },
   {
      text: "Gave me a stomach ache. I don't think the ingredients were fresh.",
      tags: ["Not Fresh", "Bad Quality"],
   },
   {
      text: "Completely tasteless. I could make better food in my dorm microwave.",
      tags: ["Bland"],
   },
   {
      text: "They completely messed up my order and refused to remake it.",
      tags: ["Rude Staff", "Wrong Order", "Bad Quality"],
   },
   {
      text: "Smallest portions I've ever seen. I left feeling completely hungry.",
      tags: ["Small Portions", "Overpriced"],
   },
   {
      text: "Way too salty. I couldn't even finish half of my meal.",
      tags: ["Bad Quality"],
   },
   {
      text: "The line management here is a disaster. Total chaos during lunch.",
      tags: ["Long Line", "Crowded"],
   },
   {
      text: "Staff seemed annoyed that I even ordered. Terrible customer service.",
      tags: ["Rude Staff"],
   },
   {
      text: "Found a hair in my food. Completely lost my appetite.",
      tags: ["Dirty", "Bad Quality", "Not Fresh"],
   },
   {
      text: "Everything tastes like it was frozen and microwaved. Do not recommend. I asked for a refund and the staff just ignored me.",
      tags: [
         "Not Fresh",
         "Overpriced",
         "Bad Quality",
         "Rude Staff",
      ],
   },
   {
      text: "Prices keep going up but the food quality keeps going down.",
      tags: ["Overpriced"],
   },
   {
      text: "They were out of almost everything on the menu. A total waste of time.",
      tags: ["Sold Out"],
   },
   {
      text: "Absolutely terrible experience today. I waited in line for nearly 45 minutes and the cashier was incredibly dismissive.",
      tags: ["Slow Service", "Long Line", "Rude Staff"],
   },
];

const specificReviews = {
   Mexican: {
      positive: [
         {
            text: "I'm a big fan of the breakfast burritos here! Perfectly wrapped and filled.",
            tags: ["Comfort Food", "Filling"],
         },
      ],
      negative: [
         {
            text: "The salsa was watered down and my taco was cold.",
            tags: ["Bad Quality", "Cold Food"],
         },
      ],
   },
   Burgers: {
      positive: [
         {
            text: "Best burger on campus! The fries are perfectly crispy.",
            tags: ["Comfort Food"],
         },
      ],
      negative: [
         {
            text: "The patty was completely raw in the middle. The fries were cold.",
            tags: ["Bad Quality", "Cold Food"],
         },
      ],
   },
   Coffee: {
      positive: [
         {
            text: "My iced latte was perfectly made. Great espresso pull.",
            tags: ["Quality", "Fresh"],
         },
      ],
      negative: [
         {
            text: "Espresso tasted burnt today and they forgot my syrup.",
            tags: ["Bad Quality", "Wrong Order"],
         },
      ],
   },
   Vegan: {
      positive: [
         {
            text: "Great vegetarian options! The tofu bowls here are perfectly spiced.",
            tags: ["Vegetarian", "Healthy"],
         },
      ],
      negative: [
         {
            text: "The plant-based options were very bland today.",
            tags: ["Bland"],
         },
      ],
   },
   Healthy: {
      positive: [
         {
            text: "I was really surprised by how many healthy options they had available, including a full salad bar.",
            tags: ["Healthy", "Fresh"],
         },
      ],
   },
   Chicken: {
      positive: [
         {
            text: "The chicken sandwich is always perfectly crispy and juicy.",
            tags: ["Comfort Food", "Quality"],
         },
      ],
      negative: [
         {
            text: "The chicken was tough, chewy, and definitely overcooked.",
            tags: ["Bad Quality"],
         },
      ],
   },
   Sushi: {
      positive: [
         {
            text: "The rolls were surprisingly fresh and delicious for campus sushi.",
            tags: ["Fresh", "Quality"],
         },
      ],
      negative: [
         {
            text: "Rice was hard and undercooked, and the fish didn't taste fresh.",
            tags: ["Not Fresh", "Bad Quality"],
         },
      ],
   },
   Pizza: {
      positive: [
         {
            text: "Slices are huge, cheesy, and always hit the spot.",
            tags: ["Comfort Food", "Good Value"],
         },
      ],
      negative: [
         {
            text: "Crust was burnt and the pizza was way too greasy.",
            tags: ["Bad Quality"],
         },
      ],
   },
   Sandwiches: {
      positive: [
         {
            text: "They make a fantastic sandwich here. Ingredients taste very fresh.",
            tags: ["Fresh", "Filling"],
         },
      ],
      negative: [
         {
            text: "They completely skimped on the meat for my sub today.",
            tags: ["Small Portions"],
         },
      ],
   },
   Smoothies: {
      positive: [
         {
            text: "Perfectly blended smoothie! Not too sweet and really refreshing.",
            tags: ["Fresh", "Healthy"],
         },
      ],
      negative: [
         {
            text: "Smoothie was super watery and didn't taste like real fruit.",
            tags: ["Bad Quality", "Overpriced"],
         },
      ],
   },
};

const samplePhotos = [
   "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", // Burger
   "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", // Pizza
   "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80", // Coffee
   "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80", // Salad
   "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80", // Sushi
   "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80", // Sandwich
   "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", // Restaurant vibe
   "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80", // Restaurant seating
   "https://images.unsplash.com/photo-1550547660-d14547882299?auto=format&fit=crop&w=800&q=80", // Burger 2
   "https://images.unsplash.com/photo-1541592224651-240f28454a12?auto=format&fit=crop&w=800&q=80", // Burger 3
   "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80", // Pizza 2
   "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80", // Pizza 3
   "https://images.unsplash.com/photo-1495474472205-11e0413000bd?auto=format&fit=crop&w=800&q=80", // Coffee 2
   "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80", // Coffee 3
   "https://images.unsplash.com/photo-1546069901-ba6c3825cb38?auto=format&fit=crop&w=800&q=80", // Salad 2
   "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80", // Sushi 2
   "https://images.unsplash.com/photo-1550507992-ebef4fdc40e1?auto=format&fit=crop&w=800&q=80", // Sandwich 2
   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", // Restaurant vibe 2
   "https://images.unsplash.com/photo-1554679665-f5537f187268?auto=format&fit=crop&w=800&q=80", // Tacos
   "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80", // Tacos 2
   "https://images.unsplash.com/photo-1563379926898-10f14acdf9c6?auto=format&fit=crop&w=800&q=80", // Noodles
   "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80", // Ramen
   "https://images.unsplash.com/photo-1505253716362-af196013f1aa?auto=format&fit=crop&w=800&q=80", // Smoothie
   "https://images.unsplash.com/photo-1494597564530-871f2b93ac55?auto=format&fit=crop&w=800&q=80", // Smoothie 2
   "https://images.unsplash.com/photo-1484723091782-4defd7cb80da?auto=format&fit=crop&w=800&q=80", // Dessert
   "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80", // Dessert 2
   "https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80", // Breakfast
   "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80", // Breakfast 2
   "https://images.unsplash.com/photo-1504670073073-6123e39e0754?auto=format&fit=crop&w=800&q=80", // Healthy bowl
   "https://images.unsplash.com/photo-1540420773-8eabb2ce8018?auto=format&fit=crop&w=800&q=80", // Burrito
   "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80", // Chicken
   "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80", // Fried Chicken
];

const randomElement = (arr) =>
   arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
   Math.floor(Math.random() * (max - min + 1)) + min;
const randomDateInPastMonth = () =>
   new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
   ).toISOString();

async function getValidPhotos(photos) {
   console.log("Verifying sample photo URLs...");
   const validPhotos = [];
   await Promise.all(
      photos.map(async (url) => {
         try {
            // Use a HEAD request to check the status without downloading the image body
            const res = await fetch(url, {
               method: "HEAD",
            });
            if (res.ok) {
               validPhotos.push(url);
            } else {
               console.log(
                  `Skipping broken photo link (${res.status}): ${url}`,
               );
            }
         } catch {
            console.log(
               `Error checking photo link: ${url}`,
            );
         }
      }),
   );
   console.log(
      `Verified ${validPhotos.length} working images out of ${photos.length}.`,
   );
   return validPhotos;
}

async function seedReviews() {
   console.log("Fetching users and restaurants...");
   const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id");
   // Fetch tags as well so we can dynamically map reviews to the restaurant
   const { data: restaurants, error: restError } =
      await supabase
         .from("restaurants")
         .select("id, name, tags");

   if (
      usersError ||
      restError ||
      !users?.length ||
      !restaurants?.length
   ) {
      console.error(
         "Failed to fetch prerequisite data. Check your database tables.",
      );
      return;
   }

   let successCount = 0;
   let failCount = 0;

   const validPhotos = await getValidPhotos(samplePhotos);

   console.log(
      "Clearing old mock reviews to prevent duplicates...",
   );
   // .gt("id", -1) is a PostgREST trick to bypass the "must have filter" rule and delete all rows
   const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .gt("id", -1);

   if (deleteError) {
      console.warn(
         "Could not clear old reviews:",
         deleteError.message,
      );
   } else {
      console.log("Old reviews successfully cleared!");
   }

   console.log(
      `Generating reviews for ${restaurants.length} restaurants...`,
   );

   for (const restaurant of restaurants) {
      // Build a pool of valid review templates for this specific restaurant
      let validPositive = [...genericPositive];
      let validNeutral = [...genericNeutral];
      let validNegative = [...genericNegative];

      const restTags = restaurant.tags || [];
      restTags.forEach((tag) => {
         if (specificReviews[tag]) {
            if (specificReviews[tag].positive) {
               validPositive.push(
                  ...specificReviews[tag].positive,
               );
            }
            if (specificReviews[tag].neutral) {
               validNeutral.push(
                  ...specificReviews[tag].neutral,
               );
            }
            if (specificReviews[tag].negative) {
               validNegative.push(
                  ...specificReviews[tag].negative,
               );
            }
         }
      });

      // Decide how many reviews to generate for this restaurant (between 1 and 8)
      const numReviews = randomInt(1, 8);

      for (let i = 0; i < numReviews; i++) {
         const user = randomElement(users);

         // Determine sentiment (70% positive, 20% neutral, 10% negative)
         const sentimentRoll = Math.random();
         let reviewTemplate;
         let rating;

         if (sentimentRoll < 0.7) {
            reviewTemplate = randomElement(validPositive);
            rating = randomInt(4, 5);
         } else if (sentimentRoll < 0.9) {
            reviewTemplate = randomElement(validNeutral);
            rating = 3;
         } else {
            reviewTemplate = randomElement(validNegative);
            rating = randomInt(1, 2);
         }

         // 30% chance to include a random photo
         const photo_urls =
            Math.random() < 0.3 && validPhotos.length > 0
               ? [randomElement(validPhotos)]
               : [];

         // Dynamically build tags: mix template generic tags with restaurant's specific tags
         let reviewTags = new Set(
            reviewTemplate.tags || [],
         );
         if (restTags.length > 0) {
            const shuffledRestTags = [...restTags].sort(
               () => 0.5 - Math.random(),
            );
            const tagsToAdd = randomInt(
               1,
               Math.min(2, restTags.length),
            );
            for (let j = 0; j < tagsToAdd; j++) {
               reviewTags.add(shuffledRestTags[j]);
            }
         }

         const newReview = {
            user_id: user.id,
            restaurant_id: restaurant.id,
            rating: rating,
            comment: reviewTemplate.text,
            tags: Array.from(reviewTags),
            photo_urls: photo_urls,
            created_at: randomDateInPastMonth(),
         };

         // Insert row-by-row to safely ignore foreign key errors from incomplete mock users
         const { data: insertedReview, error } =
            await supabase
               .from("reviews")
               .insert(newReview)
               .select("id")
               .single();
         if (error) {
            failCount++;
         } else {
            successCount++;

            // Generate random helpful votes from unique users
            const numVotes = randomInt(0, 15);
            if (numVotes > 0) {
               const shuffledUsers = [...users].sort(
                  () => 0.5 - Math.random(),
               );
               const votingUsers = shuffledUsers.slice(
                  0,
                  Math.min(numVotes, users.length),
               );

               const voteRows = votingUsers.map((vu) => ({
                  review_id: insertedReview.id,
                  user_id: vu.id,
               }));

               // Insert votes (your DB trigger will automatically catch these and update helpful_count)
               await supabase
                  .from("review_helpful_votes")
                  .insert(voteRows);
            }
         }
      }
   }

   console.log("--- SEEDING COMPLETE ---");
   console.log(
      `Successfully inserted: ${successCount} reviews`,
   );
   console.log(
      `Skipped (FK/Auth constraints): ${failCount} reviews`,
   );
}

seedReviews();
