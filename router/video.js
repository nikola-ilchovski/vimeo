const axios = require("axios");
// const auth = require('../middlewares/auth');
// const admin = require('../middlewares/admin');
// const { asyncMiddleware } = require('../middlewares/async');
const tus = require("tus-js-client");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const {
  createVideo,
  getStatus,
  uploadChunk,
  uploadVideoChunkAsync,
  wait,
} = require("../services/video");
// const dogModel = require('../models/dog');

// /api/video/create
router.post("/create", async (req, res) => {
  console.log("/CREATE <------ START ------->");
  try {
    const result = await createVideo(req.body);

    console.log("/CREATE <------ END ------->");
    res.send(result);
  } catch (error) {
    console.log("error", error);

    console.log("/CREATE <------ END ER ------->");
    res.sendStatus(400);
  }
});

router.post("/upload", async (req, res) => {
  console.log("/UPLOAD <------ START ------->");
  try {
    const uploadLink = req.headers["upload-link"];
    console.log("uploadLink", uploadLink);
    const { chunk } = req.body;
    console.log("chunk", chunk);
    console.log("req.body", req.body);
    const result = await uploadChunk(uploadLink, req.body);

    console.log("/UPLOAD <------ END ------->");
    res.send(result);
  } catch (error) {
    console.log("error", error);
    console.log("/UPLOAD <------ END ER ------->");
    res.sendStatus(400);
  }
});

router.post("/stream", async (req, res) => {
  try {
    console.log("req.body", req.body);

    // console.log("stream", stream);

    console.log("/STREAM <------ START ------->");
    const uploadLink = req.headers["upload-link"];
    const uploadSize = Number(req.headers["upload-size"]);
    // const CHUNK_SIZE = 1_000_000; // 1MB
    const CHUNK_SIZE = 1024 * 512; // 0.5MB

    // console.log("streamTransformed", streamTransformed);
    // These functions will be specific to your application
    let patchIndex = 0;
    let cacheStorageAmount = 0;
    const REQUIRED_BUFFER_AMOUNT = 1024 * 1024 * 4;
    let bufferStorage = [];
    let start = 0;

    req
      .on("data", async function (data) {
        console.log(`Progress: ${(patchIndex / uploadSize) * 100}%`);
        try {
          req.pause();

          if (!start) {
            console.log("setting start!...");
            start = new Date().getTime() / 1000;
          }

          // console.log("stream chunk length", data.length);
          // console.log(
          //   "uploadSize",
          //   uploadSize,
          //   data.length + patchIndex + cacheStorageAmount
          // );
          if (uploadSize === data.length + patchIndex + cacheStorageAmount) {
            console.log("1");
            console.log("BAAAAAAAAm");
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
            // console.log("2");
            // check if required amount for request is gathered
            if (cacheStorageAmount >= REQUIRED_BUFFER_AMOUNT) {
              // console.log("2 1");
              // send request
              bufferStorage.push(data);
              const toSendChunk = Buffer.concat(bufferStorage);
              // console.log(".?.", toSendChunk);

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
              // console.log("2 2");
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
        // console.log("status upload-length", status.headers["upload-length"]);
      })
      .on("error", async function (error) {
        console.log("readable stream error: ", error);
        const status = await getStatus(uploadLink);
      });
  } catch (error) {
    console.log("error happened");
  }
});

//api/video/status
router.post("/status", async (req, res) => {
  try {
    const result = await getStatus(req.body.uploadLink);

    res.send(result);
  } catch (error) {
    console.log("error", error);
    res.sendStatus(400);
  }
});

module.exports = router;
