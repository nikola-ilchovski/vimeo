console.log("start js!");

import { upload, approveVideo } from "./helpers.js";

const vimeoBtn = document.querySelector(".upload-btn");
const fileInputVimeo = document.querySelector("#vimeo_upload");

const googleBtn = document.querySelector(".upload-btn-google");
const fileInputGoogle = document.querySelector("#upload_google");

const approveBtn = document.querySelector(".approve-video");
const approveField = document.querySelector("#approve-field-path");

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

approveBtn.addEventListener("click", async function () {
  console.log("approveField", approveField);
  await approveVideo(approveField.value);
});
