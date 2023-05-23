"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class products extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      products.belongsTo(models.users, {
        as: "seller",
        foreignKey: {
          name: "sellerId",
        },
      });
      products.belongsToMany(models.transactions, {
        as: "transaction",
        through: {
          model: "order",
        },
        foreignKey: "productId",
      });
    }
  }
  products.init(
    {
      title: DataTypes.STRING,
      price: DataTypes.INTEGER,
      img: DataTypes.STRING,
      sellerId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "products",
    }
  );
  return products;
};
