export const readFileAsBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    const progressText = document.querySelector("#loaded-progress");

    // define listeners
    reader.onload = function (e) {
      resolve(e.target.result);
    };

    reader.onprogress = function (e) {
      // console.log("e", Math.ceil((e.loaded / e.total) * 100));
    };

    reader.onerror = function (e) {
      // error occurred
      reject("Error : " + e.type);
    };

    reader.readAsArrayBuffer(file);
  });

export const getfile = async (fileInput) => {
  const file = fileInput.files[0];

  const fileInfo = await readFileAsBuffer(file);

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
};

export const createVideo = async (fileInput) => {
  const { file, maxByteSize, name, size, type } = await getfile(fileInput);

  // create a video
  const result = await fetch("https://localhost:8001/api/video/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ maxByteSize, name, size, type }),
  });
  const createVideoResponse = await result.json();
  const uploadLink = createVideoResponse.uploadLink;
  const previewLink = createVideoResponse.response.player_embed_url;

  return {
    size,
    name,
    type,
    uploadLink,
    previewLink,
  };
};

export const uploadToVimeo = async (
  endpoint,
  fileInput,
  statusText,
  destinationPath
) => {
  const { size, name, type, uploadLink, previewLink } = await createVideo(
    fileInput
  );

  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a video file");
    return;
  }

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
  headers.append("upload-name", name);

  let bytesUploaded = 0;

  // Use a custom TransformStream to track upload progress
  const progressTrackingStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      bytesUploaded += chunk.byteLength;
      if (statusText) {
        statusText.innerHTML =
          "Upload Status: " + Math.ceil((bytesUploaded / size) * 100) + "%";
      }
    },
    flush(controller) {
      // console.log("completed stream");
    },
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: stream.pipeThrough(progressTrackingStream),
      headers: headers,
      duplex: "half",
    });

    if (destinationPath && previewLink) {
      destinationPath.innerHTML = "Preview Link: " + previewLink;
    }

    if (response.ok) {
      // console.log("Video uploaded successfully");
    }
  } catch (error) {
    alert("Error uploading video", error);
  }
};

export const uploadToGoogle = async (
  endpoint,
  fileInput,
  statusText,
  destinationPath
) => {
  const { name, size, type } = await getfile(fileInput);

  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a video file");
    return;
  }

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
  headers.append("upload-size", size);
  headers.append("video-title", name);
  headers.append("upload-type", type);
  headers.append("Authorization", "Bearer x");

  let bytesUploaded = 0;

  // Use a custom TransformStream to track upload progress
  const progressTrackingStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      bytesUploaded += chunk.byteLength;
      if (statusText) {
        statusText.innerHTML =
          "Upload Status: " + Math.ceil((bytesUploaded / size) * 100) + "%";
      }
    },
    flush(controller) {
      // console.log("completed stream");
    },
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: stream.pipeThrough(progressTrackingStream),
      headers: headers,
      // allowHTTP1ForStreamingUpload: true,
      duplex: "half",
    });

    const destinationPathText = (await response.json()).destination_link;

    if (destinationPath && destinationPathText) {
      destinationPath.innerHTML = "Destination Path: " + destinationPathText;
    }

    if (response.ok) {
      // console.log("Video uploaded successfully");
    }
  } catch (error) {
    console.log("error", error);
  }
};

export const approveVideo = async (filePath, name) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  try {
    const response = await fetch("https://localhost:3001/video/approve", {
      method: "POST",
      body: JSON.stringify({
        path: filePath,
        name: name,
      }),
      headers: headers,
    });
  } catch (error) {}
};
