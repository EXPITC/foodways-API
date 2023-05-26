const S = require("sequelize");
require("dotenv").config();

const db = {};
// after root should be password bcoz i don't have password so leave it empty
const Sequelize = new S(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.HOST,
    dialect: "postgresql",
    dialectModule: require("pg"),
    // Disbale this dialect options for local dev
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
    logging: console.info,
    freezeTableName: true,
    pool: {
      max: 5,
      min: 0,
      acquired: 30000,
      idle: 10000,
    },
  }
);

db.Sequelize = Sequelize;

module.exports = db;
