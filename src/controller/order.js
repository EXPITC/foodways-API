const { order, transactions, products } = require("../../models");
const Op = require("Sequelize").Op;

exports.addOrder = async (req, res) => {
  try {
    const data = req.body;
    const { transactionId, productId, qty } = data;
    let add = await order.findOne({
      where: {
        transactionId,
        productId,
      },
      attributes: {
        include: ["id"],
      },
    });
    const dataProduct = await products.findOne({
      where: { id: productId },
    });
    const dataTransaction = await transactions.findOne({
      where: { id: transactionId },
    });
    if (add) {
      await order.update(
        {
          ...add,
          qty: add.qty + qty,
        },
        {
          where: {
            id: add.id,
          },
        }
      );
      await transactions.update(
        {
          price: qty * dataProduct.price + dataTransaction.price,
        },
        {
          where: { id: transactionId },
        }
      );
      return res.status(200).send({
        status: "success add",
        data: {
          order: {
            add,
          },
        },
      });
    }
    const newAdd = await order.create({
      ...data,
      status: "pending",
      buyerId: req.user.id,
    });
    await transactions.update(
      {
        price: qty * dataProduct.price + dataTransaction.price,
      },
      {
        where: { id: transactionId },
      }
    );
    res.status(200).send({
      status: "success add",
      data: {
        order: {
          newAdd,
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
exports.orderCount = async (req, res) => {
  try {
    const transaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: {
          [Op.or]: ["Waiting Approve", "On The Way", "Order"],
        },
      },
    });
    let data = [];
    if (transaction) {
      data = await order.findAll({
        where: {
          buyerId: req.user.id,
          transactionId: transaction.id,
        },
      });
    }
    let total = 0;
    total = data.map((x) => {
      return x.qty;
    });
    total = total.reduce((a, b) => a + b, 0);
    res.status(200).send({
      status: "success add",
      total,
      id: transaction?.id,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const data = await order.findAll({
      where: { buyerId: buyerId },
      attributes: {
        include: ["id"],
      },
    });
    res.status(200).send({
      status: "success",
      data: {
        order: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getOrdersAdmin = async (req, res) => {
  try {
    const data = await order.findAll({
      attributes: {
        include: ["id"],
      },
    });
    res.status(200).send({
      status: "success",
      data: {
        order: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const data = await order.findOne({
      where: { id, buyerId: buyerId },
      attributes: {
        include: ["id"],
      },
    });
    if (!data) {
      return res.status(400).send({
        status: "failed",
        message: "order details not found",
      });
    }
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getOrderProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await order.findOne({
      where: {
        productId: id,
      },
    });
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const data = await order.findOne({
      where: { id, buyerId: buyerId },
    });
    if (!data) {
      return res.status(400).send({
        status: "failed",
        message: "order details not found",
      });
    }
    const newData = req.body;
    await order.update(newData, { where: { id } });
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.lessOrder = async (req, res) => {
  try {
    const data = req.body;
    const { transactionId, productId, qty } = data;
    let less = await order.findOne({
      where: {
        transactionId,
        productId,
      },
      attributes: {
        include: ["id"],
      },
    });
    const dataProduct = await products.findOne({
      where: { id: productId },
    });
    const dataTransaction = await transactions.findOne({
      where: { id: transactionId },
    });
    if (less) {
      await order.update(
        {
          ...less,
          qty: less.qty - qty,
        },
        {
          where: {
            id: less.id,
          },
        }
      );
      await transactions.update(
        {
          price: dataTransaction.price - qty * dataProduct.price,
        },
        {
          where: { id: transactionId },
        }
      );
      if (less.qty - qty == 0) {
        await order.destroy({
          where: {
            transactionId,
            productId,
          },
        });
        const x = await transactions.findOne({
          where: { id: transactionId },
          include: {
            model: products,
            as: "product",
            through: {
              model: order,
            },
            attributes: {
              exclude: ["createdAt", "updatedAt"],
            },
          },
        });
        if (x?.product < 1) {
          await transactions.destroy({
            where: { id: transactionId },
          });
        }
      }
      return res.status(200).send({
        status: "success less",
        data: {
          order: {
            less,
          },
        },
      });
    }
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.deletedOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const orderData = await order.findOne({
      where: {
        id,
        buyerId: buyerId,
      },
    });
    if (!orderData) {
      return res.status(400).send({
        status: "fail",
        message: "order not found",
        data: {
          order: "order details not found",
        },
      });
    }
    const { productId, transactionId, qty } = orderData;
    const dataProduct = await products.findOne({
      where: { id: productId },
    });
    const dataTransaction = await transactions.findOne({
      where: { id: transactionId },
    });
    await transactions.update(
      {
        price: dataTransaction.price - qty * dataProduct.price,
      },
      {
        where: { id: transactionId },
      }
    );
    await order.destroy({
      where: { id },
    });
    let x = await transactions.findOne({
      where: { id: transactionId },
      include: {
        model: products,
        as: "product",
        through: {
          model: order,
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });
    if (x?.product < 1) {
      await transactions.destroy({
        where: { id: transactionId },
      });
    }
    res.send({
      status: "success",
      message: "order successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
