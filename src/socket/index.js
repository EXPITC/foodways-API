const {
  transactions,
  users,
  products,
  order,
  restos,
} = require("../../models");
const isValidJwt = require("../utils/jwt/isValidJwt");
const jwt = require("jsonwebtoken");
const Op = require("sequelize").Op;
// const { userCheck, admin, owner } = require("../middleware/userCheck");

const socketIo = (io) => {
  io.use((socket, next) => {
    if (isValidJwt(socket.handshake?.auth?.token)) {
      next();
    } else {
      next(new Error("Not Authorized"));
    }
  });

  io.on("connection", (socket) => {
    console.info("client connect:", socket.id);

    socket.on("load transaction", async (payload) => {
      try {
        // const token = socket.handshake.auth.token;

        // const verified = jwt.verify(token, process.env.JWT_TOKEN )
        // console.log('verified.id')
        // console.log(verified?.id)
        let data = await transactions.findAll({
          where: {
            [Op.or]: [{ buyerId: payload }, { sellerId: payload }],
            status: {
              [Op.or]: ["Success", "Cancel"],
            },
          },
          include: [
            {
              model: users,
              as: "buyer",
              attributes: {
                exclude: ["password", "createdAt", "updatedAt"],
              },
            },
            {
              model: users,
              as: "seller",
              attributes: {
                exclude: ["password", "createdAt", "updatedAt"],
              },
              include: {
                model: restos,
                as: "restos",
                attributes: {
                  exclude: ["ownerId", "createdAt", "updatedAt"],
                },
              },
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        socket.emit("transaction", data);
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("order", async (id) => {
      if (!id) return;
      try {
        let data = await transactions.update(
          { status: "Waiting Approve" },
          {
            where: { id },
          }
        );
        socket.emit("OrderData", data);
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("joinRoomOrder", async (data) => {
      let room;
      let restoId = data?.restoId;
      if (!restoId) return;
      if (data?.restoId) {
        room = `Order/${data?.restoId}`;
      } else {
        const resto = await restos.findOne({
          where: { ownerId: data?.userId },
        });
        if (!resto) return;

        restoId = resto?.id;
        room = `Order/${restoId}`;
      }

      socket.join(room);
      io.in(room).emit("newOrder", `New order in ${restoId}`);
    });

    socket.on("leaveRoomOrder", async (data) => {
      let room = `Order/${data?.restoId}`;
      let restoId = data?.restoId;

      if (!restoId) return;

      if (!data?.restoId) {
        const resto = await restos.findOne({
          where: { ownerId: data?.userId },
        });
        if (!resto) return;

        restoId = resto.id;
        room = `Order/${restoId}`;
      }

      socket.leave(room);
      socket.to(room).emit("newOrder", `Leave order in ${restoId}`);
    });

    socket.on("newOrder", async (restoId) => {
      const room = `Order/${restoId}`;

      socket.to(room).emit("newOrder");
    });

    // confirm when transaction success by client
    socket.on("confirm", async (transId) => {
      try {
        const validation = await transactions.findOne({
          where: { id: transId, status: "On The Way" },
        });

        if (!validation) return;

        const data = await transactions.update(
          { status: "Success" },
          {
            where: { id: transId },
          }
        );

        socket.emit("ConfirmData", data);
      } catch (err) {
        console.error(err.massage);
      }
    });

    socket.on("cancel", async (transId) => {
      try {
        let data = await transactions.update(
          { status: "Cancel" },
          {
            where: { id: transId },
            returning: true,
          }
        );
        socket.emit("cancelData", data);
      } catch (err) {
        console.error(err.massage);
      }
    });

    // for client to get realtime data from owner
    socket.on("subTrans", (transId) => {
      socket.join(transId);
    });

    // for client to get realtime data from owner
    // use in accept
    socket.on("unsubTrans", (transId) => {
      socket.leave(transId);
    });

    // for owner
    socket.on("accept", async (transId) => {
      try {
        const validation = await transactions.findOne({
          where: { id: transId, status: "Waiting Approve" },
        });

        if (!validation) return;

        const data = await transactions.update(
          { status: "On The Way" },
          {
            where: { id: transId },
            returning: true,
          }
        );

        socket.to(transId).emit("confirmTransaction");
        socket.emit("acceptData", data);
      } catch (err) {
        console.error(err.massage);
      }
    });

    socket.on("transactions", async (_payload) => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.headers.token;
        if (!isValidJwt(token))
          return socket.emit("transactionsData", { err: "not valid token" });

        const verified = jwt.verify(token, process.env.JWT_TOKEN);

        const data = await transactions.findAll({
          where: {
            [Op.or]: [{ buyerId: verified.id }, { sellerId: verified.id }],
            status: {
              [Op.or]: ["Success", "Cancel", "On The Way", "Waiting Approve"],
            },
          },
          include: [
            {
              model: users,
              as: "buyer",
              attributes: {
                exclude: ["password", "createdAt", "updatedAt"],
              },
            },
            {
              model: products,
              as: "product",
              through: {
                model: order,
              },
              attributes: {
                exclude: ["createdAt", "updatedAt"],
              },
            },
          ],
          order: [["createdAt", "DESC"]],
        });
        socket.emit("transactionsData", data);
      } catch (err) {
        console.error(err.message);
      }
    });
    socket.on("onTheWay", async (userId) => {
      try {
        let data = await transactions.findOne({
          where: {
            buyerId: userId,
            status: "On The Way",
          },
          order: [
            ["id", "DESC"],
            ["createdAt", "DESC"],
            ["updatedAt", "DESC"],
          ],
        });
        socket.emit("otwData", data);
      } catch (err) {
        console.error(err.massage);
      }
    });
    socket.on("disconnect", () => {
      console.log("client disconnect");
    });
  });
};

module.exports = socketIo;
