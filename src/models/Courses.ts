import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/database.ts";

interface CourseAttributes {
  id?: number;
  title: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Course extends Model<CourseAttributes> implements CourseAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
}

Course.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "courses",  // must match exactly what migration created
    timestamps: true,
  }
);

export default Course;