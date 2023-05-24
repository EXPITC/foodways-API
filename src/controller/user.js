const { users, restos, products } = require("../../models");
const { deleteImg } = require("../utils/cloudinary/deleteImg");

exports.addUser = async (req, res) => {
  try {
    const data = req.body;
    const response = await users.create({
      ...data,
      location: "‑6.200000 106.816666",
    });

    res.status(200).send({
      status: "success",
      message: "user successfully added",
      data: {
        user: {
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

exports.getUsers = async function (_req, res) {
  try {
    const usersData = await users.findAll({
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
    });

    res.status(200).send({
      status: "success",
      massage: "users successfully retrieved",
      data: {
        users: {
          usersData,
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

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await users.findOne({
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
      where: { id },
    });
    userData
      ? res.status(200).send({
          status: "success",
          message: "user successfully retrieved",
          data: {
            user: userData,
          },
        })
      : res.status(400).send({
          status: "fail",
          message: "user not found",
          data: {
            user: "user details not found",
          },
        });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.profileMe = async (req, res) => {
  try {
    const { id } = req.user;
    const userData = await users.findOne({
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
      where: { id },
    });
    userData?.id
      ? res.status(200).send({
          status: "success",
          message: "user successfully retrieved",
          data: {
            user: userData,
          },
        })
      : res.status(400).send({
          status: "fail",
          message: "user not found",
          data: {
            user: "user details not found",
          },
        });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.updateUser = async (req, res) => {
  try {
    // console.log("update user hit");
    const { id } = req.user;
    let data = req.body;

    const user = await users.findOne({
      where: { id },
    });

    const isNewImage =
      req.file?.filename !== undefined &&
      req?.uploadImg?.url !== undefined &&
      req.uploadImg.url !== user.img;

    if (isNewImage) {
      data = {
        ...data,
        img: req.uploadImg.url,
      };
    }

    await users.update(data, {
      where: { id },
    });

    if (isNewImage) {
      try {
        await deleteImg(user.img);
      } catch (error) {
        console.error(error);
      }
    }

    res.send({
      status: "success",
      message: "user successfully update",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.updateUserData = async (req, res) => {
  try {
    // console.log("Hit update user data");
    const { id } = req.user;
    const data = req.body;
    // console.log(data);
    await users.update(
      {
        ...data,
      },
      {
        where: { id },
      }
    );

    res.send({
      status: "success",
      message: "user successfully update",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await users.findOne({
      where: { id },
    });
    if (!userData) {
      return res.status(400).send({
        status: "fail",
        message: "user not found",
        data: {
          user: "user details not found",
        },
      });
    }
    await users.destroy({
      where: { id },
    });
    res.send({
      status: "success",
      message: "user successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getUserResto = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await users.findOne({
      where: { id },
      include: {
        model: resto,
        as: "resto",
        attributes: {
          exclude: ["ownerId", "createdAt", "updatedAt"],
        },
      },
    });
    if (!userData) {
      return res.send({
        status: "failed",
        message: "acc was not found",
      });
    }
    if (userData.role == "costumer") {
      return res.send({
        status: "failed",
        message: "acc was costumer",
      });
    }

    res.send({
      status: "success",
      data: {
        userData,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getUserRestos = async (_req, res) => {
  try {
    const userData = await users.findAll({
      where: { role: "owner" },
      include: {
        model: resto,
        as: "restos",
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });
    if (!userData) {
      return res.send({
        status: "failed",
        message: "acc was not found",
      });
    }

    res.send({
      status: "success",
      data: {
        userData,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
