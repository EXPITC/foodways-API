const {
  transactions,
  users,
  products,
  order,
  restos,
} = require("../../models");
const Op = require("sequelize").Op;
exports.addTransaction = async (req, res) => {
  try {
    let data = await req.body;
    if (!data)
      return res.status(400).send({
        status: "error",
        message: "request data cannot be found.",
      });
    const onGoingTransaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: {
          [Op.or]: ["Waiting Approve", "On The Way", "Order"],
        },
      },
      include: {
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
      order: [["createdAt", "DESC"]],
    });
    if (onGoingTransaction) {
      // still valid
      if (
        onGoingTransaction.status === "Order" &&
        onGoingTransaction.seller.id === data.sellerId
      )
        return res.status(201).send({
          status: "ok",
          message: "Still have transaction in same resto, ok to proceed",
          onGoingTransaction,
        });
      // Refuse new order

      return res.status(409).send({
        status: "order not finish",
        message: `you still have transaction with status ${onGoingTransaction.status}`,
        onGoingTransaction,
      });
    }

    let response = await transactions.create({
      sellerId: data.sellerId,
      buyerId: req.user.id,
      status: "Order",
      price: 0,
    });

    data = JSON.parse(JSON.stringify(data));

    let dataOrder = data.product;
    if (dataOrder) {
      dataOrder = dataOrder.map((x) => {
        return {
          ...x,
          transactionId: response.id,
          status: "pending",
          buyerId: req.user.id,
        };
      });
      await order.bulkCreate(dataOrder);
    }

    response = await transactions.findOne({
      where: {
        id: response.id,
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
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: [
          "sellerId",
          "buyerId",
          "productId",
          "price",
          "createdAt",
          "updatedAt",
        ],
      },
    });
    let total = 0;
    total = response.product.map((x) => {
      return total + x.price * x.order.qty;
    });
    total = total.reduce((a, b) => a + b, 0);
    await transactions.update(
      { price: total },
      {
        where: { id: response.id },
      }
    );
    res.status(200).send({
      status: "success add",
      data: {
        transactions: {
          response,
          total,
        },
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransactionOngoin = async (req, res) => {
  try {
    const thenTransaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: "On The Way",
      },
    });
    res.status(200).send({
      status: "success",
      data: thenTransaction,
    });
  } catch (error) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getTransactionActive = async (req, res) => {
  try {
    const thenTransaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: {
          [Op.or]: ["Waiting Approve", "On The Way", "Order"],
        },
      },
    });

    res.status(200).send({
      status: "success",
      data: thenTransaction,
    });
  } catch (error) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getTransactions = async (req, res) => {
  try {
    const id = req.user.id;
    const data = await transactions.findOne({
      where: {
        buyerId: id,
        status: {
          [Op.or]: ["Waiting Approve", "On The Way", "Order"],
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
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      message: "Success",
      data: {
        transaction: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransactionIdle = async (req, res) => {
  try {
    const id = req.user.id;
    let data = await transactions.findAll({
      where: {
        buyerId: id,
        status: {
          [Op.or]: ["Waiting Approve", "On The Way", "Order"],
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
            attributes: {
              include: ["id"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    // const path = "http://localhost:5001/img/";
    // data = JSON.parse(JSON.stringify(data));
    // let product = data.map((x) => {
    //   return {
    //     product: x.product.map((x) => {
    //       return {
    //         ...x,
    //         img: path + x.img,
    //       };
    //     }),
    //   };
    // });
    // product = product[0].product.map((x) => {
    //   return {
    //     ...x,
    //   };
    // });
    // data = data.map((x) => {
    //   return {
    //     ...x,
    //     product,
    //   };
    // });

    res.status(200).send({
      message: "Success",
      data: {
        transactions: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransactionsAdmin = async (req, res) => {
  try {
    const data = await transactions.findAll({
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
            attributes: {
              include: ["id"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      message: "Success",
      data: {
        transactions: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const data = await transactions.findOne({
      where: {
        id: id,
        buyerId: buyerId,
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
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: [
          "sellerId",
          "buyerId",
          "productId",
          "price",
          "createdAt",
          "updatedAt",
        ],
      },
    });
    const total = await order.count({
      where: {
        transactionId: id,
      },
    });
    res.status(200).send({
      message: "Success",
      data: {
        transactions: data,
        total,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.editTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const transactionData = await transactions.findOne({
      where: {
        id,
        buyerId: buyerId,
      },
    });
    if (!transactionData) {
      return res.status(400).send({
        status: "fail",
        message: "transaction not found",
        data: {
          transaction: "transaction details not found",
        },
      });
    }
    const data = req.body;
    await transactions.update(data, {
      where: { id },
    });
    res.send({
      status: "successfully",
      message: "transaction successfully edit",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const transactionData = await transactions.findOne({
      where: {
        id,
        buyerId: buyerId,
      },
    });
    if (!transactionData) {
      return res.status(400).send({
        status: "fail",
        message: "transaction not found",
        data: {
          transaction: "transaction details not found",
        },
      });
    }
    await transactions.destroy({
      where: { id },
    });
    res.send({
      status: "success",
      message: "transaction successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
