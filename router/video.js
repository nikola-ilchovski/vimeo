const axios = require("axios");
const express = require("express");
const router = express.Router();
require("dotenv").config();
const {
  createVideo,
  getStatus,
  wait,
  generateFilePath,
} = require("../services/video");
const {
  uploadToGoogleStorage,
  streamFileDownload,
} = require("../services/google");

// Import Node.js stream
const stream = require("stream");

// /api/video/create
router.post("/create", async (req, res) => {
  console.log("/CREATE");
  try {
    const result = await createVideo(req.body);
    res.send(result);
  } catch (error) {
    console.log("error", error);
    res.sendStatus(400);
  }
});

router.post("/stream-vimeo", async (req, res) => {
  try {
    console.log("/STREAM");
    const uploadLink = req.headers["upload-link"]; // vimeo video upload destination url
    const uploadSize = Number(req.headers["upload-size"]); // the size of the video that will be uploaded

    // These functions will be specific to your application
    let patchIndex = 0; // tracking the progress of the upload in bytes (required for vimeo)
    let cacheStorageAmount = 0; // tracking cached amount in bytes
    const REQUIRED_BUFFER_AMOUNT = 1024 * 1024 * 4; // cached amount max amount in bytes
    let bufferStorage = []; // caching the actual buffer data
    let start = 0; // tracking request time execution

    req
      .on("data", async function (data) {
        console.log(`Progress: ${(patchIndex / uploadSize) * 100}%`);
        try {
          req.pause();

          // used only for tracking time
          if (!start) {
            console.log("setting start!...");
            start = new Date().getTime() / 1000;
          }

          if (uploadSize === data.length + patchIndex + cacheStorageAmount) {
            bufferStorage.push(data);
            cacheStorageAmount = cacheStorageAmount + data.length;

            const toSendChunk = Buffer.concat(bufferStorage);
            // send request
            const response = await axios.patch(uploadLink, toSendChunk, {
              headers: {
                "Tus-Resumable": "1.0.0",
                "Upload-Offset": patchIndex,
                "Content-Type": "application/offset+octet-stream",
              },
            });

            patchIndex = patchIndex + toSendChunk.length;

            bufferStorage = [];
            cacheStorageAmount = 0;
          } else {
            if (cacheStorageAmount >= REQUIRED_BUFFER_AMOUNT) {
              // send request
              bufferStorage.push(data);
              const toSendChunk = Buffer.concat(bufferStorage);

              const response = await axios.patch(uploadLink, toSendChunk, {
                headers: {
                  "Tus-Resumable": "1.0.0",
                  "Upload-Offset": patchIndex,
                  "Content-Type": "application/offset+octet-stream",
                },
              });

              patchIndex = patchIndex + toSendChunk.length;

              // reset cache
              bufferStorage = [];
              cacheStorageAmount = 0;
            } else {
              // skip send request + increment cache
              bufferStorage.push(data);
              cacheStorageAmount = cacheStorageAmount + data.length;
            }
          }
        } catch (error) {
          console.log("on data error");
        }

        req.resume();
      })
      .on("end", async function () {
        console.log("readable stream is done");
        const end = new Date().getTime() / 1000;
        console.log("total time: ", end - start);
        await wait(3000);
        const status = await getStatus(uploadLink);
        console.log("status upload-offset", status.headers);
      })
      .on("error", async function (error) {
        console.log("readable stream error: ", error);
        const status = await getStatus(uploadLink);
      });
  } catch (error) {
    console.log("error happened");
  }
});

router.post("/stream-google", async (req, res) => {
  console.log("/stream-google");
  try {
    console.log("/STREAM Google");
    // const uploadLink = req.headers["upload-link"]; // vimeo video upload destination url
    // const uploadSize = Number(req.headers["upload-size"]); // the size of the video that will be uploaded
    const name = req.headers["upload-name"]; // the name of the video that will be uploaded
    const type = req.headers["upload-type"]; // the type (mp4) of the video that will be uploaded

    const response = await uploadToGoogleStorage(req, name, type);
    console.log("response", response);
    res.send(response);
  } catch (error) {
    console.log("error happened", error);
  }
});

router.post("/approve", async (req, res) => {
  console.log("approve route");
  const stream = await streamFileDownload(req.body.videoPath);
  console.log("stream", stream);
});

// api/video/status
router.post("/status", async (req, res) => {
  try {
    const result = await getStatus(req.body.uploadLink);

    res.send(result.headers);
  } catch (error) {
    console.log("error", error);
    res.sendStatus(400);
  }
});

module.exports = router;
