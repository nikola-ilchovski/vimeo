const tus = require("tus-js-client");
const crypto = require("crypto");

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

// not used
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
        reject(error);
      },
      onProgress(bytesUploaded, total) {
        // console.log("onProgress: ", bytesUploaded, total);
      },
      onSuccess: async function (data) {
        resolve(data);
      },
    });

    // Start the upload
    upload.start();
  });
};

// not used
const uploadChunk = async (uploadLink, chunk) => {
  return await uploadVideoChunkAsync(uploadLink, chunk);
};

module.exports = {
  createVideo,
  getStatus,
  uploadChunk,
  uploadVideoChunkAsync,
  wait,
};
