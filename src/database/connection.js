const Sequelize = require("sequelize");

const db = {};
// after root should be password bcoz i don't have password so leave it empty
const Sequelize = new Sequelize("foodways_api", "root", "<><><>", {
  host: "localhost",
  dialect: "postgresql",
  logging: console.log,
  freezeTableName: true,
  pool: {
    max: 5,
    min: 0,
    acquired: 30000,
    idle: 10000,
  },
});

db.Sequelize = Sequelize;

module.exports = db;
