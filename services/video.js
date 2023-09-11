const tus = require("tus-js-client");
const fs = require("fs");
let Vimeo = require("vimeo").Vimeo;
const client = new Vimeo(
  process.env.VIMEO_CLIENT_ID,
  process.env.VIMEO_CLIENT_SECRET,
  process.env.VIMEO_ACCESS_TOKEN
);
const ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;

// Create Video
const createVideo = async (data) => {
  const { lastModified, name, size, type } = data;

  const createHeaders = new Headers();
  createHeaders.append("Content-Type", "application/json");
  createHeaders.append("Accept", "application/vnd.vimeo.*+json;version=3.4");
  createHeaders.append("Authorization", `Bearer ${ACCESS_TOKEN}`);

  const createResponse = await fetch("https://api.vimeo.com/me/videos", {
    method: "POST",
    headers: createHeaders,
    body: JSON.stringify({
      upload: {
        approach: "tus",
        size: size,
      },
    }),
  });

  // create - user info, upload progress/status, review page, resource key, play (available/unavailable), upload link and size (for the next request)
  const create = await createResponse.json();
  // console.log("create response", create);
  const uploadLink = create?.upload?.upload_link;

  return { response: create, uploadLink };
};

const wait = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

const uploadVideoChunkAsync = (stream, chunkSize, totalSize, uploadLink) => {
  return new Promise((resolve, reject) => {
    // const localFile = fs.createReadStream(`${__dirname}/../videos/demo.mp4`);
    const upload = new tus.Upload(stream, {
      endpoint: "https://tusd.tusdemo.net/files/", //uploadLink,
      uploadUrl: "https://tusd.tusdemo.net/files/", //uploadLink,
      chunkSize: chunkSize, // no change
      uploadSize: totalSize,
      // retryDelays: [0, 1000, 3000, 5000],
      onError: function (error) {
        console.log("stream error: ", error);
        console.log("/STREAM <------ END ------->");
        reject(error);
      },
      onProgress(bytesUploaded, total) {
        console.log("onProgress: ", bytesUploaded, total);
      },
      onSuccess: async function (data) {
        // console.log("data", data);
        // console.log("Download %s from %s", upload.file.name, upload.url);
        // console.log(upload);

        console.log("stream success");
        console.log("/STREAM <------ END ------->");
        resolve(data);
      },
    });

    // Start the upload
    console.log("start the start");
    upload.start();
  });
};

const uploadChunk = async (uploadLink, chunk) => {
  return await uploadVideoChunkAsync(uploadLink, chunk);
};

const getStatus = async (uploadLink) => {
  const headers = new Headers();
  headers.append("Tus-Resumable", "1.0.0");
  headers.append("Accept", "application/vnd.vimeo.*+json;version=3.4");
  headers.append("Authorization", `Bearer ${ACCESS_TOKEN}`);

  const response = await fetch(uploadLink, {
    method: "HEAD",
    headers: headers,
  });

  return response;
};

module.exports = {
  createVideo,
  getStatus,
  uploadChunk,
  uploadVideoChunkAsync,
  wait,
};
