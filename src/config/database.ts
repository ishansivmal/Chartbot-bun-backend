import { Sequelize } from "sequelize";

// Create a connection to your XAMPP MySQL database
const sequelize = new Sequelize(
  "chartbot",   // 📦 Database name — you need to create this in phpMyAdmin
  "root",       // 👤 Username — XAMPP default is "root"
  "",           // 🔑 Password — XAMPP default is empty (no password)
  {
    host: "localhost",  // 🏠 Where MySQL is running (your computer)
    port: 3306,         // 🚪 MySQL default port in XAMPP
    dialect: "mysql",   // 🗄️ Tell Sequelize we're using MySQL
    logging: true,     // 🔇 Don't print SQL queries in console (set to true to debug)
  }
);

export default sequelize;
