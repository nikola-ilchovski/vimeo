console.log("start js!");

import { upload } from "./helpers.js";

const vimeoBtn = document.querySelector(".upload-btn");
const fileInputVimeo = document.querySelector("#vimeo_upload");

const googleBtn = document.querySelector(".upload-btn-google");
const fileInputGoogle = document.querySelector("#upload_google");

// vimeo button
vimeoBtn.addEventListener("click", async function () {
  await upload("https://localhost:8001/api/video/stream", fileInputVimeo);
});

// google button
googleBtn.addEventListener("click", async function () {
  console.log("clicked");
  await upload(
    "https://localhost:8001/api/video/stream-google",
    fileInputGoogle
  );
});
