export const readFileAsBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    const progressText = document.querySelector("#loaded-progress");

    // define listeners
    reader.onload = function (e) {
      console.log("reading of file done: ", e.target.result);
      resolve(e.target.result);
    };

    reader.onprogress = function (e) {
      console.log("e", Math.ceil((e.loaded / e.total) * 100));
      progressText.innerHTML =
        "Reading file: " + Math.ceil((e.loaded / e.total) * 100) + " %";
    };

    reader.onerror = function (e) {
      // error occurred
      reject("Error : " + e.type);
    };

    reader.readAsArrayBuffer(file);
  });

export const getfile = async () => {
  const fileInput = document.querySelector("#vimeo_upload");
  const file = fileInput.files[0];
  console.log("file", file);

  const fileInfo = await readFileAsBuffer(file);
  console.log("fileInfo", fileInfo);
  // console.log('videoBinary', videoBinary);

  return {
    file: fileInfo,
    maxByteSize: fileInfo.maxByteLength,
    name: file.name,
    size: file.size,
    type: file.type,
  };
};

export const checkVideoUploadStatus = async (uploadLink) => {
  const result = await fetch(`http://localhost:8001/api/video/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadLink: uploadLink }),
  });

  console.log("status", result);
};

export const createVideo = async () => {
  const { file, maxByteSize, name, size, type } = await getfile();
  const uploadStatus = document.querySelector("#upload-status");
  const uploadStatusText = document.querySelector("#upload-status-text");
  console.log("file");
  // create a video
  // upload videoChunk
  const result = await fetch("https://localhost:8001/api/video/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxByteSize, name, size, type }),
  });
  const createVideoResponse = await result.json();

  console.log("createVideoResponse", createVideoResponse);
  uploadStatus.classList.remove("hidden");
  uploadStatusText.innerHTML = createVideoResponse.response.status;
  const uploadLink = createVideoResponse.uploadLink;

  return {
    fileFirst: file,
    size,
    name,
    type,
    uploadLink,
  };
};

export const approach2 = async () => {
  const { fileFirst, size, name, type, uploadLink } = await createVideo();

  const fileInput = document.querySelector("#vimeo_upload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a video file");
    return;
  }

  // Todo: file.stream() ----> Might not be compatible with all browsers check this!!
  const readStream = file.stream();
  const stream = new ReadableStream({
    start(controller) {
      const reader = readStream.getReader();

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          controller.enqueue(value);
          read();
        });
      }

      read();
    },
  });

  const headers = new Headers();
  headers.append("Content-Type", "application/octet-stream");
  headers.append("upload-link", uploadLink);
  headers.append("upload-size", size);
  console.log("??????");
  console.log("body stream", stream);

  try {
    const response = await fetch("https://localhost:8001/api/video/stream", {
      method: "POST",
      body: stream,
      headers: headers,
      duplex: "half",
    });

    if (response.ok) {
      alert("Video uploaded successfully");
    }
  } catch (error) {
    alert("Error uploading video", error);
  }
};
