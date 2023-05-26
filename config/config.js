require("dotenv").config();

module.exports = {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.HOST,
    dialect: "postgresql",
    port: process.env.PORTDB,
  },
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.HOST,
    dialect: "postgresql",
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
    port: process.env.PORTDB,
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.HOST,
    dialect: "postgresql",
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
    port: process.env.PORTDB,
  },
};
