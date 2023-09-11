console.log("start js!");

import { approach2 } from "./helpers.js";

const checkBtn = document.querySelector(".upload-btn");

// check button
checkBtn.addEventListener("click", async function () {
  await approach2();
});
