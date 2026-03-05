// src/models/Student.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/database.ts";

interface StudentAttributes {
  id?: number;
  name: string;
  age: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class User extends Model<StudentAttributes> implements StudentAttributes {
  declare id: number;
  declare name: string;
  declare age: number;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: true,
  }
);

export default User;