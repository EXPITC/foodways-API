const { products, users } = require("../../models");

exports.getProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    let data = await products.findAll({
      where: {
        sellerId: sellerId,
      },
      include: {
        model: users,
        as: "seller",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
    });

    const path = "http://localhost:5001/img/";
    data = JSON.parse(JSON.stringify(data));
    data = data.map((x) => {
      return {
        ...x,
        img: path + x.img,
      };
    });
    res.status(200).send({
      status: "success",
      data: {
        products: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getProductsAll = async (req, res) => {
  try {
    const data = await products.findAll({
      include: {
        model: users,
        as: "seller",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      status: "success",
      data: {
        products: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const data = await products.findOne({
      where: {
        id,
        sellerId: sellerId,
      },
      include: {
        model: users,
        as: "seller",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
    });
    if (!data) {
      return res.status(200).send({
        status: "failed",
        message: "product details not found",
      });
    }
    res.status(200).send({
      status: "success",
      data: {
        products: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const data = req.body;
    const response = await products.create({
      ...data,
      img: req.file.filename,
      sellerId: req.user.id,
    });

    res.status(200).send({
      status: "success",
      message: "products successfully added",
      data: {
        products: {
          response,
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

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const productData = await products.findOne({
      where: {
        id,
        sellerId: sellerId,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    if (!productData) {
      return res.status(400).send({
        status: "fail",
        message: "product not found",
        data: {
          product: "product details not found",
        },
      });
    }

    const fs = require("fs");
    const path = `./uploads/img/${productData.img}`;
    try {
      fs.unlinkSync(path);
    } catch (error) {
      console.log(error);
    }

    await products.destroy({
      where: { id },
    });
    res.send({
      status: "success",
      message: "product successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const sellerId = req.user.id;
    const productData = await product.findOne({
      where: { id },
    });
    const fs = require("fs");
    const path = `./uploads/img/${productData.img}`;

    if (req.body?.img != productData.img) {
      try {
        fs.unlinkSync(path);
      } catch (error) {
        console.log(error);
      }
    }

    await products.update(data, {
      where: {
        id,
        sellerId: sellerId,
      },
    });

    res.send({
      status: "success",
      message: "products successfully update",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
