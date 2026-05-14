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

// NEW: upload a profile/avatar photo
export async function uploadProfilePhoto(file) {
   const formData = new FormData();
   formData.append("file", file);

   const res = await fetch(
      "https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net/api/uploads/profile-photo",
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
