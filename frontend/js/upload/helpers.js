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

  console.log("status", result);
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

  return {
    size,
    name,
    type,
    uploadLink,
  };
};

export const upload = async (endpoint, fileInput) => {
  const { size, name, type, uploadLink } = await createVideo(fileInput);

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
  headers.append("upload-type", type);

  try {
    console.log("make request");
    const response = await fetch(endpoint, {
      method: "POST",
      body: stream,
      headers: headers,
      duplex: "half",
    });
    console.log("end request");

    if (response.ok) {
      alert("Video uploaded successfully");
    }
  } catch (error) {
    alert("Error uploading video", error);
  }
};

export const approveVideo = async (filePath) => {
  console.log("filePath", filePath);
  // videos/_videos_a64c94baaf368e1840a1324e839230de.mp4
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  try {
    const response = await fetch("https://localhost:8001/api/video/approve", {
      method: "POST",
      body: JSON.stringify({
        videoPath: filePath,
      }),
      headers: headers,
    });
  } catch (error) {}
};
