const http2 = require("http2");
const http2Express = require("http2-express-bridge");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const serverOptions = {
  key: fs.readFileSync("test.key"),
  cert: fs.readFileSync("test.crt"),
  allowHTTP1: true,
};

const video = require("./router/video");

// Configure out app
const app = http2Express(express);
const port = process.env.PORT || 8000;

app.use(cors());

// Middlewares
app.use(express.raw({ type: "application/octet-stream" }));
app.use(express.text());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
// app.use(helmet());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/video", video);

// const server = http2.createServer(serverOptions, app);
const server = http2.createSecureServer(serverOptions, app);
// Create the server
server.listen(port, () => {
  console.log("Our app is running on port ", port);
});
