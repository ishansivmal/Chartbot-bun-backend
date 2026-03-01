import { type Request, type Response } from "express";
import User from "../models/User";
import Groq from "groq-sdk";

// 🤖 Set up Groq AI (FREE & fast!)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🤖 Main chatbot function
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Please send a message" });
      return;
    }

    // 📊 Step 1: Get database info so AI knows what data we have
    const dbContext = await getDatabaseContext();

    // 🧠 Step 2: Send question + database info to Groq AI
    const answer = await askGroq(message, dbContext);

    // ✅ Step 3: Send AI's answer back to frontend
    res.json({
      question: message,
      answer: answer,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("❌ Chat error:", error?.message || error);
    res.status(500).json({ error: "Something went wrong", details: error?.message });
  }
};

// 📊 Get current data from database so AI can use it
async function getDatabaseContext(): Promise<string> {
  try {
    const userCount = await User.count();
    const users = await User.findAll({ attributes: ["id", "name", "email", "age"] });

    let context = `DATABASE INFO:\n`;
    context += `- Total users: ${userCount}\n`;
    context += `- Users table columns: id, name, email, age, createdAt, updatedAt\n`;

    if (users.length > 0) {
      context += `\nALL USERS DATA:\n`;
      users.forEach((u) => {
        context += `  - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Age: ${u.age}\n`;
      });
    } else {
      context += `\nNo users in the database yet.\n`;
    }

    return context;
  } catch (error) {
    return "Could not fetch database info.";
  }
}

// 🧠 Ask Groq AI the question with database context
async function askGroq(userMessage: string, dbContext: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a helpful chatbot assistant for a database application called "ChartBot".
Your job is to answer questions about the data in the database.
Be friendly, concise, and use emojis.
If the user asks something unrelated to the database, you can still chat normally but remind them you specialize in database queries.

Here is the current database information:
${dbContext}`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: "llama-3.3-70b-versatile",  // Free, fast, and smart model
    temperature: 0.7,                   // A bit creative but still accurate
    max_tokens: 1024,                   // Max length of response
  });

  return chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}
