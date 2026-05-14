import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useBookmarks(initialIds = []) {
   // Use lazy initialization so the Set is only built on the first render
   const [bookmarkedIds, setBookmarkedIds] = useState(
      () => new Set(initialIds),
   );

   const toggleBookmark = useCallback(
      async (
         userId,
         restaurantId,
         isOptimisticOnly = false,
      ) => {
         if (!userId) {
            return {
               error: new Error(
                  "You must be signed in to bookmark.",
               ),
            };
         }

         const id =
            typeof restaurantId === "string"
               ? parseInt(restaurantId, 10)
               : restaurantId;
         const wasBookmarked = bookmarkedIds.has(id);

         // Optimistic UI update
         setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (wasBookmarked) {
               next.delete(id);
            } else {
               next.add(id);
            }
            return next;
         });

         // Some components batch their updates (e.g., User page on unload)
         if (isOptimisticOnly) {
            return { error: null };
         }

         try {
            if (wasBookmarked) {
               const { error } = await supabase
                  .from("bookmarks")
                  .delete()
                  .eq("user_id", userId)
                  .eq("restaurant_id", id);
               if (error) throw error;
            } else {
               const { error } = await supabase
                  .from("bookmarks")
                  .insert({
                     user_id: userId,
                     restaurant_id: id,
                  });
               if (error) throw error;
            }

            return { error: null };
         } catch (err) {
            console.error("Error updating bookmark:", err);

            // Revert optimistic update on failure
            setBookmarkedIds((prev) => {
               const next = new Set(prev);
               if (wasBookmarked) next.add(id);
               else next.delete(id);
               return next;
            });

            return { error: err };
         }
      },
      [bookmarkedIds],
   );

   return {
      bookmarkedIds,
      setBookmarkedIds,
      toggleBookmark,
   };
}
