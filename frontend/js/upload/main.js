console.log("start js!");

import { upload } from "./helpers.js";

const checkBtn = document.querySelector(".upload-btn");

// check button
checkBtn.addEventListener("click", async function () {
  await upload();
});
