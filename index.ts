import express, { type Request, type Response } from "express";
import cors from "cors";
import sequelize from "./config/database.ts";
import userRoutes from "./src/routes/userRoutes";
import chatRoutes from "./src/routes/chatRoutes";

const app = express();
const port: number = 5000;

// 🔧 Middleware
app.use(cors());           // Allow frontend to connect
app.use(express.json());   // Parse JSON request bodies

// 🏠 Home route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// 🛣️ User routes — all start with /api/users
app.use("/api/users", userRoutes);

// 🤖 Chat routes — all start with /api/chat
app.use("/api/chat", chatRoutes);

// 🚀 Start server and connect to database
const startServer = async () => {
  try {
    await sequelize.authenticate();  // Test database connection
    console.log("✅ Database connected successfully!");

    await sequelize.sync();          // Create tables if they don't exist
    console.log("✅ Tables synced!");

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
  }
};

startServer();