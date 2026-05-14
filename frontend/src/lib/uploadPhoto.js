export async function uploadReviewPhoto(file) {
   const formData = new FormData();
   formData.append("file", file);

   const res = await fetch("/api/uploads/review-photo", {
      method: "POST",
      body: formData,
   });

   if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
   }

   const { url } = await res.json();
   return url;
}

// Uploads a profile photo — uses user_id as filename to overwrite old photo
export async function uploadProfilePhoto(file, userId) {
   const baseUrl =
      window.location.hostname === "localhost"
         ? "http://localhost:4000"
         : "https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net";

   const formData = new FormData();
   formData.append("file", file);
   if (userId) formData.append("user_id", userId);

   const res = await fetch(
      `${baseUrl}/api/uploads/profile-photo`,
      {
         method: "POST",
         body: formData,
      },
   );

   if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
   }

   const { url } = await res.json();
   return url;
}

// Removes a profile photo from storage and reverts to default avatar
export async function removeProfilePhoto(userId) {
   const baseUrl =
      window.location.hostname === "localhost"
         ? "http://localhost:4000"
         : "https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net";

   const res = await fetch(
      `${baseUrl}/api/uploads/profile-photo/${userId}`,
      {
         method: "DELETE",
      },
   );

   if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Remove failed");
   }

   const { avatar_url } = await res.json();
   return avatar_url;
}
