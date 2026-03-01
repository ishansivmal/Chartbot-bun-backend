import { type Request, type Response } from "express";
import User from "../models/User";

// 📋 Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();  // SELECT * FROM users
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 🔍 Get one user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id as string);  // SELECT * FROM users WHERE id = ?
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ➕ Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, age } = req.body;             // Get data from request body
    const user = await User.create({ name, email, age }); // INSERT INTO users VALUES (...)
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

// ✏️ Update a user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id as string);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await user.update(req.body);  // UPDATE users SET ... WHERE id = ?
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// 🗑️ Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id as string);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await user.destroy();  // DELETE FROM users WHERE id = ?
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
