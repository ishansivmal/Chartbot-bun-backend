// src/models/Student.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/database.ts";

// 📋 Define what a Student looks like in TypeScript
interface StudentAttributes {
  id?: number;
  name: string;
  age: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 🗄️ Create the Student model
class Student extends Model<StudentAttributes> implements StudentAttributes {
  public id!: number;
  public name!: string;
  public age!: number;
}

// 🏗️ Define the columns
Student.init(
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
    tableName: "Students", // must match exactly what migration created
    timestamps: true,
  }
);

export default Student;