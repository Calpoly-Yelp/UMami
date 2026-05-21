import { apiUrl } from "./api";

const CAL_POLY_EMAIL_RE = /^[^@\s]+@calpoly\.edu$/i;

export function isCalPolyEmail(email) {
   return CAL_POLY_EMAIL_RE.test(
      String(email || "").trim(),
   );
}

function getDisplayName(user) {
   const metadataName = user?.user_metadata?.name?.trim();
   if (metadataName) {
      return metadataName;
   }

   return user?.email?.split("@")[0] || "User";
}

function getAvatarUrl(name) {
   const encodedName = encodeURIComponent(
      name.trim(),
   ).replace(/%20/g, "+");

   return `https://ui-avatars.com/api/?name=${encodedName}`;
}

export async function ensureUserProfile(user) {
   if (!user?.id || !user?.email) {
      throw new Error(
         "Missing verified user profile details.",
      );
   }

   const existingResponse = await fetch(
      apiUrl(`/api/users/${user.id}`),
   );

   if (existingResponse.ok) {
      return existingResponse.json();
   }

   if (existingResponse.status !== 404) {
      const body = await existingResponse
         .json()
         .catch(() => ({}));
      throw new Error(
         body.error ||
            `Failed to fetch user profile (${existingResponse.status})`,
      );
   }

   const name = getDisplayName(user);
   const createResponse = await fetch(
      apiUrl("/api/users"),
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({
            id: user.id,
            name,
            email: user.email,
            avatar_url: getAvatarUrl(name),
            is_verified: isCalPolyEmail(user.email),
         }),
      },
   );

   const createdProfile = await createResponse
      .json()
      .catch(() => ({}));

   if (!createResponse.ok) {
      throw new Error(
         createdProfile.error || "Failed to save user.",
      );
   }

   return createdProfile;
}
