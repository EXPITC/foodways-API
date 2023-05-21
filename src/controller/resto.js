const { restos, users, products } = require("../../models");

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
      img: req.file.filename,
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

exports.getRestos = async (req, res) => {
  try {
    const path = "http://localhost:5001/img/";
    let data = await restos.findAll({
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

    data = JSON.parse(JSON.stringify(data));
    data = data.map((x) => {
      return {
        ...x,
        img: path + x.img,
      };
    });
    res.send({
      message: "success",
      data: {
        restos: data,
      },
    });
  } catch (e) {
    res.status(409).send({
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

    let menu = await products.findAll({
      where: { sellerId: data.ownerId },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    const path = "http://localhost:5001/img/";
    menu = JSON.parse(JSON.stringify(menu));
    menu = menu.map((x) => {
      return {
        ...x,
        img: path + x.img,
      };
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
    const fs = require("fs");
    const path = `./uploads/img/${restoData.img}`;
    if (req.body?.img != restoData.img) {
      try {
        fs.unlinkSync(path);
      } catch (error) {
        console.log(error);
      }
    }
    if (!restoData) {
      return res.status(400).send({
        status: "fail",
        message: "resto not found",
        data: {
          resto: "resto details not found",
        },
      });
    }

    const data = req.body;
    await restos.update(data, {
      where: { ownerId: id },
    });
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
