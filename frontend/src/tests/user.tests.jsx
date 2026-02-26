import {
   describe,
   test,
   expect,
   beforeAll,
} from "@jest/globals";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserPage from "../pages/user.jsx";

// test data
const testUser = {
   id: "123",
   name: "Eli Schiffler",
   avatar_url:
      "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
   is_verified: true,
};
const testReviews = [
   {
      avatar_url: testUser.profilePicture,
      userName: testUser.name,
      is_verified: testUser.is_verified,
      rating: 4,
      date: "2026-02-14",
      comments: "Loved it!",
      tags: ["Cozy", "Spicy"],
      photos: [
         "https://loremflickr.com/320/240/food",
         "https://picsum.photos/200/300",
      ],
   },
   {
      avatar_url: testUser.profilePicture,
      userName: testUser.name,
      is_verified: testUser.is_verified,
      rating: 3,
      date: "2026-02-16",
      comments:
         "This food was so good! I will for sure be coming back again.",
      tags: [],
      photos: [
         "https://loremflickr.com/320/240/food",
         "https://picsum.photos/200/300",
      ],
   },
   {
      avatar_url: testUser.profilePicture,
      userName: testUser.name,
      is_verified: testUser.is_verified,
      rating: 5,
      date: "2026-02-18",
      comments:
         "This was honestly one of the best dining experiences I've had in a long time. From the moment we walked in, the atmosphere felt warm and inviting, and the staff were incredibly attentive without being overbearing. The food itself was absolutely phenomenal — every bite was packed with flavor, and you could tell that high-quality ingredients were used throughout. I ordered the house special, and it exceeded all expectations. The portion sizes were generous, the presentation was beautiful, and the flavors were perfectly balanced. I also tried a few bites from my friends' plates, and everything we tasted was consistently excellent. On top of that, the ambiance made it such a comfortable place to sit and talk for hours. I would highly recommend this place to anyone looking for a memorable meal, and I’m already planning my next visit!",
      tags: ["Cozy", "Spicy", "Date Night", "Must Try"],
      photos: [
         "https://loremflickr.com/320/240/food",
         "https://picsum.photos/200/300",
      ],
   },
   {
      avatar_url: testUser.profilePicture,
      userName: testUser.name,
      is_verified: testUser.is_verified,
      rating: 4,
      date: "2026-02-19",
      comments: "Great spot.",
      tags: [
         "Cozy",
         "Spicy",
         "Date Night",
         "Must Try",
         "Family Friendly",
         "Outdoor Seating",
         "Live Music",
         "Vegan Options",
         "Gluten Free",
         "Late Night",
         "Affordable",
         "Trendy",
         "Romantic",
         "Comfort Food",
         "Quick Service",
      ],
      photos: [
         "https://loremflickr.com/320/240/food",
         "https://picsum.photos/200/300",
      ],
   },
   {
      avatar_url: testUser.profilePicture,
      userName: testUser.name,
      is_verified: testUser.is_verified,
      rating: 5,
      date: "2026-02-20",
      comments:
         "Absolutely incredible experience from start to finish. The ambiance was lively yet comfortable, making it perfect for both casual outings and special occasions. Every dish we ordered was thoughtfully prepared and beautifully presented. The flavors were bold and balanced, and you could truly taste the quality of the ingredients. The service was attentive, friendly, and knowledgeable, offering excellent recommendations that did not disappoint. We tried a wide range of menu items — appetizers, entrees, desserts, and even specialty drinks — and everything exceeded expectations. It’s rare to find a place that delivers consistently across every aspect of the dining experience, but this restaurant absolutely nailed it. I would highly recommend it to anyone looking for outstanding food, welcoming atmosphere, and memorable moments.",
      tags: [
         "Cozy",
         "Spicy",
         "Date Night",
         "Must Try",
         "Family Friendly",
         "Outdoor Seating",
         "Live Music",
         "Vegan Options",
         "Gluten Free",
         "Late Night",
         "Affordable",
         "Trendy",
         "Romantic",
         "Comfort Food",
         "Quick Service",
         "Hidden Gem",
         "Downtown",
         "Great Cocktails",
         "Brunch",
         "Reservations Recommended",
      ],
      photos: [
         "https://loremflickr.com/320/240/food",
         "https://picsum.photos/200/300",
      ],
   },
];
const testRestaurants = [
   {
      id: "101",
      name: "Shake Smart",
      image: "https://placehold.co/300x200/003831/FFFFFF?text=Shake+Smart",
      averageRating: 4.5,
      tags: ["Acai", "Smoothies", "Toast"],
      isBookmarked: true,
   },
   {
      id: "102",
      name: "Jamba Juice",
      image: "https://placehold.co/300x200/003831/FFFFFF?text=Jamba+Juice",
      averageRating: 4.0,
      tags: ["Smoothies", "Juice", "Breakfast"],
      isBookmarked: false,
   },
   {
      id: "103",
      name: "Health Shack",
      image: "https://placehold.co/300x200/003831/FFFFFF?text=Health+Shack",
      averageRating: 3.5,
      tags: ["Juice", "Toast", "Acai"],
      isBookmarked: true,
   },
];
const testBookmarks = [
   {
      user_id: "123",
      restaurant_id: "101",
   },
   {
      user_id: "123",
      restaurant_id: "102",
   },
   {
      user_id: "123",
      restaurant_id: "103",
   },
];
const testFollowedUsers = [
   {
      name: "Jane",
      is_verified: true,
      avatar_url:
         "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
      numReviews: 10,
   },
   {
      name: "Bob",
      is_verified: false,
      avatar_url:
         "https://placehold.co/100x100/003831/FFFFFF?text=Green+Fork",
      numReviews: 5,
   },
   {
      name: "Sarah Jenkins",
      is_verified: true,
      avatar_url:
         "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
      numReviews: 283,
   },
   {
      name: "This is my name",
      is_verified: false,
      avatar_url:
         "https://placehold.co/100x100/003831/FFFFFF?text=Green+Fork",
      numReviews: 5,
   },
   {
      name: "Another User",
      is_verified: true,
      avatar_url:
         "https://placehold.co/100x100/003831/FFFFFF?text=Mustang+Eats",
      numReviews: 1,
   },
];

// this beforeAll is neccessary to handle our
// IntersectionObserver we used in reviewCard.jsx
beforeAll(() => {
   window.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {
         return null;
      }
      unobserve() {
         return null;
      }
      disconnect() {
         return null;
      }
   };

   window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
   window.cancelAnimationFrame = (id) => clearTimeout(id);
});

describe("User Profile Page", () => {
   // checks to see if user page will render
   test("renders the user page", () => {
      render(
         <UserPage
            user={testUser}
            reviews={testReviews}
            restaurants={testRestaurants}
            bookmarks={testBookmarks}
            followedUsers={testFollowedUsers}
         />,
      );
   });

   // check for header elements
   test("renders header elements", () => {
      render(
         <UserPage
            user={testUser}
            reviews={testReviews}
            restaurants={testRestaurants}
         />,
      );
      const logoElement = document.querySelector(".logo");
      expect(logoElement).toBeInTheDocument();
      const accountIcon = document.querySelector(
         ".user-header svg",
      );
      expect(accountIcon).toBeInTheDocument();
   });

   // check for user info elements
   test("renders user info", () => {
      render(
         <UserPage
            user={testUser}
            reviews={testReviews}
            restaurants={testRestaurants}
         />,
      );
      const nameElement = document.querySelector(".name");
      expect(nameElement).toBeInTheDocument();
      const verifiedBadge = document.querySelector(
         ".verified-badge",
      );
      expect(verifiedBadge).toBeInTheDocument();
   });

   // check for review card elements
   test("renders review cards", () => {
      render(
         <UserPage
            user={testUser}
            reviews={testReviews}
            restaurants={testRestaurants}
         />,
      );
      const reviewCards =
         document.querySelectorAll(".review-card");
      expect(reviewCards.length).toBe(5);
   });

   // check for saved restaurant elements
   test("renders saved restaurants", () => {
      render(
         <UserPage
            user={testUser}
            reviews={testReviews}
            restaurants={testRestaurants}
         />,
      );
      const restaurantCards = document.querySelectorAll(
         ".restaurant-card",
      );
      expect(restaurantCards.length).toBe(3);
   });

   // check for followed user elements
   test("renders followed users", () => {
      render(
         <UserPage
            user={testUser}
            reviews={testReviews}
            restaurants={testRestaurants}
            bookmarks={testBookmarks}
            followedUsers={testFollowedUsers}
         />,
      );
      const followedUserCards = document.querySelectorAll(
         ".followed-user-card",
      );
      expect(followedUserCards.length).toBe(5);
   });
});
