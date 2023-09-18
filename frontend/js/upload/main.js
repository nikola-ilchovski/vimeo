import { uploadToGoogle, uploadToVimeo, approveVideo } from "./helpers.js";

/* ---------- Frontend -> Backend -> Vimeo ---------- */
const vimeoBtn = document.querySelector(".upload-btn");
const fileInputVimeo = document.querySelector("#vimeo_upload");
const vimeoUploadStatus = document.querySelector("#upload-status-text");
const previewVimeoUrl = document.querySelector("#destination-path-vimeo");

// vimeo button
vimeoBtn.addEventListener("click", async function () {
  await uploadToVimeo(
    "https://localhost:8001/api/video/stream-vimeo",
    fileInputVimeo,
    vimeoUploadStatus,
    previewVimeoUrl
  );
});
/* ---------- END: Frontend -> Backend -> Vimeo ---------- */

/* ---------- Frontend -> Backend -> GCloud ---------- */
const googleBtn = document.querySelector(".upload-btn-google");
const fileInputGoogle = document.querySelector("#upload_google");
const googleUploadStatus = document.querySelector("#upload-status-text-google");
const destinationPathGoogle = document.querySelector(
  "#destination-path-google"
);

googleBtn.addEventListener("click", async function () {
  await uploadToGoogle(
    "https://localhost:3001/video/upload",
    fileInputGoogle,
    googleUploadStatus,
    destinationPathGoogle
  );
});

/* ---------- END: Frontend -> Backend -> GCloud ---------- */

/* ---------- Approve video -> transfer from gCloud to Vimeo ---------- */
const approveBtn = document.querySelector(".approve-video");
const approveField = document.querySelector("#approve-field-path");

approveBtn.addEventListener("click", async function () {
  await approveVideo(approveField.value, "Chill Music Video");
});
/* ---------- END: Approve video -> transfer from gCloud to Vimeo ---------- */
