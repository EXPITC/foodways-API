const { users, restos } = require("../../models");
require("dotenv").config();

const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { deleteUser } = require("./user");
const path = "http://localhost:5001/img/";

exports.register = async (req, res) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(4).required(),
    fullname: joi.string().min(3).required(),
    role: joi.string().required(),
    phone: joi.string().optional(),
    gender: joi.string().optional(),
    location: joi.string().optional(),
    image: joi.string().optional(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(401).send({
      err: error.details[0].message,
    });
  }
  try {
    const { email } = req.body;
    const isUser = await users.findOne({
      where: { email },
    });

    if (isUser?.id) {
      return res.status(201).send({
        status: "failed",
        message: "acc already exists",
      });
    }

    const salt = await bcrypt.genSalt(8);
    const hashPass = await bcrypt.hash(req.body.password, salt);

    const response = await users.create({
      fullname: req.body.fullname,
      email: email.toLowerCase(),
      password: hashPass,
      role: req.body.role,
      gender: req.body.gender,
      phone: req.body.phone,
      location: req.body.location,
      image: "LOFI.jpg",
    });

    const isCreated = await users.findOne({
      where: { email },
    });
    const userData = {
      id: isCreated?.id,
      status: isCreated?.role,
    };
    const { role, id, location, phone, image } = isCreated;
    const token = jwt.sign(userData, process.env.JWT_TOKEN);

    res.status(200).send({
      status: "success",
      message: "successfully register",
      data: {
        user: {
          fullname: response.fullname,
          email: email.toLowerCase(),
          id,
          role,
          token,
          location,
          phone,
          image: path + image,
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

exports.login = async (req, res) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(4).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(401).send({
      err: error.details[0].message,
    });
  }

  try {
    const { email, password } = req.body;
    let userAcc = await users.findOne({
      where: {
        email: email.toLowerCase(),
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: {
        model: restos,
        as: "restos",
        attributes: {
          exclude: ["createdAt", "updatedAt", "ownerId", "id"],
        },
      },
    });
    const sendErr = () => {
      return res.status(400).send({
        status: "failed",
        message: "email or password wrong",
      });
    };

    if (!userAcc) return sendErr();
    userAcc = JSON.parse(JSON.stringify(userAcc));
    const valid = await bcrypt.compare(password, userAcc.password);
    if (!valid) return sendErr();

    const userData = {
      id: userAcc.id,
      status: userAcc.role,
    };

    const token = jwt.sign(userData, process.env.JWT_TOKEN);

    let resto = userAcc?.restos;
    if (resto) {
      resto = {
        ...resto,
        img: path + userAcc?.restos.img,
      };
    }
    delete userAcc.password;

    res.status(200).send({
      status: "login",
      token,
      ...userAcc,
      image: path + userAcc.image,
      resto,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.auth = async (req, res) => {
  try {
    const { id } = req.user;
    let userAcc = await users.findOne({
      where: { id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      include: {
        model: restos,
        as: "restos",
        attributes: {
          exclude: ["createdAt", "updatedAt", "ownerId"],
        },
      },
    });
    const sendErr = () => {
      return res.status(400).send({
        status: "failed",
        message: "invalid login",
      });
    };

    if (!userAcc) return sendErr();

    userAcc = JSON.parse(JSON.stringify(userAcc));

    const userData = {
      id: userAcc.id,
      status: userAcc.role,
    };

    const token = jwt.sign(userData, process.env.JWT_TOKEN);

    let resto = userAcc?.restos;
    if (resto) {
      resto = {
        ...resto,
        img: path + userAcc?.restos.img,
      };
    }
    delete userAcc.password;
    delete userAcc.restos;

    res.status(200).send({
      status: "login",
      token,
      ...userAcc,
      image: path + userAcc.image,
      resto,
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
