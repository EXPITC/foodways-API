const { Sequelize } = require("sequelize");
const { products, users, restos } = require("../../models");
const db = require("../database/connection");
const { deleteImg } = require("../utils/cloudinary/deleteImg");

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

exports.getProductsRand10 = async (_req, res) => {
  try {
    let data = await products.findAll({
      include: {
        model: users,
        as: "seller",
        attributes: {
          exclude: [
            "password",
            "createdAt",
            "updatedAt",
            "phone",
            "location",
            "email",
            "fullname",
            "gender",
            "role",
            "img",
          ],
        },
        include: {
          model: restos,
          as: "restos",
          attributes: {
            exclude: ["createdAt", "updatedAt", "ownerId", "id"],
          },
        },
      },
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
      order: db.Sequelize.random(),
      limit: 10,
    });
    data = JSON.parse(JSON.stringify(data));

    data = await Promise.all(
      data.map(async (product) => {
        const loc = product.seller.restos.loc.split(" ");
        const api_address = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc[0]}&lon=${loc[1]}`;

        let response = await fetch(api_address);
        response = await response.json();
        const address =
          response.address.road +
          ", " +
          response.address.suburb +
          ", " +
          response.address.city_district +
          ", " +
          response.address.city;

        return {
          ...product,
          seller: {
            restos: {
              ...product.seller.restos,
              address,
            },
          },
        };
      })
    );

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
    let data = await products.findOne({
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

    data = JSON.parse(JSON.stringify(data));

    res.status(200).send({
      status: "success",
      ...data,
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
      img: req.uploadImg.url,
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
    res.status(500).send({
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

    await products.destroy({
      where: { id },
    });

    try {
      await deleteImg(productData.img);
    } catch (error) {
      console.error(error);
    }

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
    let data = req.body;
    const sellerId = req.user.id;
    const productData = await products.findOne({
      where: { id },
    });

    const isNewImage =
      req.file?.filename !== undefined &&
      req?.uploadImg?.url !== undefined &&
      req.uploadImg.url !== productData.img;

    if (isNewImage) {
      data = {
        ...data,
        img: req.uploadImg.url,
      };
    }

    await products.update(data, {
      where: {
        id,
        sellerId: sellerId,
      },
    });

    if (isNewImage) {
      try {
        await deleteImg(req.uploadImg.url);
      } catch (error) {
        console.error(error);
      }
    }

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
