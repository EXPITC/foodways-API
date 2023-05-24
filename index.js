require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.EXPRESS_PORT;
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
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200,
};
app.use(cors(corsConf));

app.use("/img", express.static("./uploads/img"));
app.use("/api/v1/", router);
server.listen(port, () => {
  console.info(`listen  ${server.address().address}${port}`);
});
