// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");

/**
 * TODO(developer): Uncomment the following lines before running the sample
 */
// The ID of your GCS bucket
const bucketName = "opus-edu-dev";

// Creates a client
const storage = new Storage({
  projectId: process.env.GOOGLE_STORAGE_PROJECT_ID,
  scopes: "https://www.googleapis.com/auth/cloud-platform",
  credentials: {
    client_email: process.env.GOOGLE_STORAGE_EMAIL,
    private_key: process.env.GOOGLE_STORAGE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

// Get a reference to the bucket
const bucket = storage.bucket(bucketName);

async function streamFileDownload(filePath) {
  // The example below demonstrates how we can reference a remote file, then
  // pipe its contents to a local file.
  // Once the stream is created, the data can be piped anywhere (process, sdout, etc)
  const stream = await storage
    .bucket(bucketName)
    .file(filePath)
    .createReadStream(); //stream is created

  return stream;
}

async function uploadToGoogleStorage(stream, name, type) {
  return new Promise((resolve, reject) => {
    try {
      // The new ID for your GCS file
      const destFileName = generateFilePath("videos", "", name, true);

      // Create a reference to a file object
      const file = bucket.file(destFileName);

      stream.pipe(file.createWriteStream()).on("finish", async () => {
        // The file upload is complete
        console.log("file upload is complete?");
        await file.setMetadata({
          contentType: type,
        });
        resolve(destFileName);
      });
    } catch (error) {
      reject(error);
    }
  });
}

const generateFilePath = (folder, extention, fileName, skip_extension) => {
  if (!fileName) {
    let string = new Date().getMilliseconds().toString();
    fileName = crypto.createHash("md5").update(string).digest("hex");
  }

  if (typeof skip_extension != "undefined" && skip_extension) {
    return folder + "/" + fileName;
  }

  return folder + "/" + fileName + "." + extention;
};

module.exports = {
  uploadToGoogleStorage,
  streamFileDownload,
};
