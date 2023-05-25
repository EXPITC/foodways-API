const { restos, users, products } = require("../../models");
const resto = require("../../models/resto");
const { deleteImg } = require("../utils/cloudinary/deleteImg");

exports.addResto = async (req, res) => {
  try {
    const data = req.body;
    const { id } = req.user;
    const check = await restos.findOne({
      where: { ownerId: id },
      attributes: {
        exclude: ["updatedAt", "ownerId"],
      },
    });

    if (check) {
      return res.status(409).send({
        status: "fail",
        message: "resto already exists, one owner just allowed have one resto",
        check,
      });
    }

    const response = await restos.create({
      ...data,
      img: req.uploadImg.url,
      ownerId: id,
    });

    res.status(200).send({
      status: "success",
      message: "resto successfully added",
      data: {
        resto: {
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

exports.getRestos = async (_req, res) => {
  try {
    const data = await restos.findAll({
      include: {
        model: users,
        as: "owner",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    if (!data) throw Error({ message: "resto cant be found." });

    res.send({
      message: "success",
      data: {
        restos: data,
      },
    });
  } catch (e) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + e.message,
    });
  }
};
exports.getRestoId = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await restos.findOne({
      where: { id },
      include: {
        model: users,
        as: "owner",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    if (!data) {
      return res.status(400).send({
        status: "fail",
        message: "resto not found",
        data: {
          resto: "resto details not found",
        },
      });
    }

    const menu = await products.findAll({
      where: { sellerId: data.ownerId },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.send({
      message: "success",
      data: {
        resto: { data, menu },
      },
    });
  } catch (e) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + e.message,
    });
  }
};
exports.getResto = async (req, res) => {
  try {
    const id = req.user.id;
    const data = await restos.findOne({
      where: {
        ownerId: id,
      },
      include: {
        model: users,
        as: "owner",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    if (!data) {
      return res.status(400).send({
        status: "fail",
        message: "resto not found",
        data: {
          resto: "resto details not found",
        },
      });
    }
    const menu = await products.findAll({
      where: { sellerId: id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.send({
      message: "success",
      data: {
        resto: { data, menu },
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getRestoUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await restos.findOne({
      where: {
        ownerId: id,
      },
      include: {
        model: users,
        as: "owner",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    if (!data) {
      return res.status(400).send({
        status: "fail",
        message: "resto not found",
        data: {
          resto: "resto details not found",
        },
      });
    }
    // const menu =  await products.findAll({
    //     where: { sellerId: id },
    //     attributes: {
    //         exclude: ['createdAt','updatedAt']
    //     }
    // })

    res.send({
      message: "success",
      data: {
        resto: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.deleteResto = async (req, res) => {
  try {
    const id = req.user.id;
    const restoData = await restos.findOne({
      ownerId: id,
    });
    if (!restoData) {
      return res.status(400).send({
        status: "fail",
        message: "resto not found",
        data: {
          resto: "resto details not found",
        },
      });
    }
    await restos.destroy({
      where: { ownerId: id },
    });
    res.send({
      status: "success",
      message: "resto successfully destroy",
    });
  } catch (error) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.editResto = async (req, res) => {
  try {
    const id = req.user.id;

    const restoData = await restos.findOne({
      where: { ownerId: id },
    });
    if (!restoData) {
      return res.status(400).send({
        status: "fail",
        message: "resto not found",
        data: {
          resto: "resto details not found",
        },
      });
    }

    let data = req.body;

    const isNewImage =
      req.file?.filename !== undefined &&
      req?.uploadImg?.url !== undefined &&
      req.uploadImg.url !== restoData.img;

    if (isNewImage) {
      data = {
        ...data,
        img: req.uploadImg.url,
      };
    }

    await restos.update(data, {
      where: { ownerId: id },
    });

    if (isNewImage) {
      try {
        await deleteImg(restoData.img);
      } catch (error) {
        console.log(error);
      }
    }
    res.send({
      status: "success",
      message: "resto successfully update",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
