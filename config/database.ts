import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  "chartbot",  // database name
  "root",      // username
  "",          // password
  {
    host: "localhost",
    port: 3306,
    dialect: "mysql",
    logging: false,
  }
);

export default sequelize;