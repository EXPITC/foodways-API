"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class restos extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // // define association here
      restos.belongsTo(models.users, {
        as: "owner",
        foreignKey: {
          name: "ownerId",
        },
      });
      restos.belongsTo(models.users, {
        as: "owners",
        foreignKey: {
          name: "id",
        },
      });
    }
  }
  restos.init(
    {
      ownerId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      img: DataTypes.STRING,
      loc: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "restos",
    }
  );
  return restos;
};
