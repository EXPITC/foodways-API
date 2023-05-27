require("dotenv").config();
const express = require("express");
const app = express();
const router = require("./src/routers");

const port = process.env.EXPRESS_PORT || 5000;

const cors = require("cors");
const http = require("http");
const httpServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FE_ORIGIN,
    // Disable this for local dev
    credentials: true,
    methods: ["GET", "POST"],
  },
});

require("./src/socket")(io);

app.use(express.json());

// Disable this `corsConf` for local dev,
// also disable db ssl connection
const corsConf = {
  origin: process.env.FE_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "OPTIONS", "PATCH", "DELETE", "POST", "PUT"],
};

app.use(cors(corsConf));
app.options(process.env.FE_ORIGIN, cors(corsConf));

// app.use("/img", express.static("./uploads/img"));
app.use("/api/v1/", router);
httpServer.listen(port, () => {
  console.info(`listen  ${httpServer.address().address}${port}`);
});
