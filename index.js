require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.EXPRESS_PORT || 5000;
const router = require("./src/routers");

const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FE_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

require("./src/socket")(io);

app.use(express.json());

const corsConf = {
  origin: process.env.FE_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "OPTIONS", "PATCH", "DELETE", "POST", "PUT"],
  allowedHeaders: [
    "X-CSRF-Token",
    "X-Requested-With",
    "Accept",
    "Accept-Version",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "X-Api-Version",
  ],
};
app.use(cors({}));
app.options("*", cors(corsConf));

// app.use("/img", express.static("./uploads/img"));
app.use("/api/v1/", router);
server.listen(port, () => {
  console.info(`listen  ${server.address().address}${port}`);
});
