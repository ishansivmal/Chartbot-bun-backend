import { type Request, type Response } from "express";

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    adminGreeted?: boolean;
  }
}
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

    // Always use AI to analyze the question and database
    const allUsers = await User.findAll({ attributes: ["id", "name", "email", "age", "createdAt", "updatedAt"] });
    const userList = allUsers.map(u => u.get ? u.get({ plain: true }) : u);
    const dbContext = userList.map(u => `ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Age: ${u.age} | Created: ${(u as any).createdAt ?? ''} | Updated: ${(u as any).updatedAt ?? ''}`).join("\n");

    const aiAnswer = await askGroqWithFullData(message, dbContext);
    let responseText = aiAnswer.trim();
    if (!req.session || !req.session.adminGreeted) {
      responseText = `Welcome, Admin!\n${responseText}`;
      if (req.session) req.session.adminGreeted = true;
    }
    res.json({
      question: message,
      answer: responseText,
      usedAI: true,
      timestamp: new Date(),
    });
  // Use AI to analyze the question and all user data, and return a clear answer
  async function askGroqWithFullData(userMessage: string, dbContext: string): Promise<string> {
    const prompt = `You are a helpful assistant for a user database. You will be given a user question and a list of all users in the database.\n\n- Analyze the question.\n- Filter and compare all user data as needed.\n- Return only the best answer for the question, in a clear and direct way.\n- If the answer is a list, show each user on a new line.\n- If no users match, say so clearly.\n- Do not repeat the full database, only the answer.\n\nUser question: ${userMessage}\n\nAll users:\n${dbContext}`;
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a database expert. Answer clearly and directly based on the user data provided." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 512,
    });
    return chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  }
  // Try to answer directly for simple user queries (by name, email, or age)
  async function tryDirectUserQuery(question: string): Promise<string | null> {
    // Simple keyword-based filtering (name, email, age)
    const nameMatch = question.match(/name:?\s*([\w]+)/i);
    const emailMatch = question.match(/email:?\s*([\w@.]+)/i);
    const ageMatch = question.match(/age:?\s*(\d+)/i);

    let where: any = {};
    if (nameMatch) where.name = nameMatch[1];
    if (emailMatch) where.email = emailMatch[1];
    if (typeof ageMatch?.[1] === 'string') where.age = parseInt(ageMatch[1], 10);

    if (Object.keys(where).length === 0) return null;

    const users = await User.findAll({ where, attributes: ["id", "name", "email", "age", "createdAt", "updatedAt"] });
    if (!users.length) return 'No users found matching your query.';
    // If only one user, show details clearly
    if (users.length === 1) {
      const u = users[0].get ? users[0].get({ plain: true }) : users[0];
      return [
        `ID: ${u.id}`,
        `Name: ${u.name}`,
        `Email: ${u.email}`,
        `Age: ${u.age}`,
        `Created: ${(u as any).createdAt ?? ''}`,
        `Updated: ${(u as any).updatedAt ?? ''}`
      ].join('\n');
    }
    // If multiple users, show a list
    return users.map((u) => {
      const userObj = u.get ? u.get({ plain: true }) : u;
      return `ID: ${userObj.id} | Name: ${userObj.name} | Email: ${userObj.email} | Age: ${userObj.age}`;
    }).join('\n');
  }
  // Step 1: Ask AI to generate a filter/criteria for the database
  async function getAIDatabaseFilter(userMessage: string): Promise<string> {
    const prompt = `You are an assistant for a user database. Given the following question, output a JSON object with the filter or criteria to find the answer.\n\nExample:\nQ: Who is the oldest user?\nA: { "order": [["age", "DESC"]], "limit": 1 }\nQ: Show user with name nimal\nA: { "where": { "name": "nimal" } }\nQ: List all users aged 12\nA: { "where": { "age": 12 } }\n\nQuestion: ${userMessage}\nA:`;
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a database query assistant. Output only a valid JSON object for Sequelize findAll." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 256,
    });
    // Extract JSON from the AI's response
    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : "{}";
  }

  // Step 2: Query the database using the AI's filter/criteria
  async function queryDatabaseWithAIFilter(aiFilter: string): Promise<string> {
    let filter: any = {};
    try {
      filter = JSON.parse(aiFilter);
    } catch (e) {
      // fallback: no filter
      filter = {};
    }
    // Always select relevant fields
    filter.attributes = ["id", "name", "email", "age", "createdAt", "updatedAt"];
    const users = await User.findAll(filter);
    if (!users.length) return "No users found matching your query.";
    // Format only the best match (first result)
    const userObj = users[0] && typeof users[0].get === 'function' ? users[0].get({ plain: true }) : users[0];
    if (!userObj) return "No users found matching your query.";
    return `ID: ${userObj.id} | Name: ${userObj.name} | Email: ${userObj.email} | Age: ${userObj.age} | Created: ${(userObj as any).createdAt ?? ''} | Updated: ${(userObj as any).updatedAt ?? ''}`;
  }
  // Filter user data based on keywords in the question
  async function getFilteredUserContext(question: string): Promise<string> {
    // Simple keyword-based filtering (name, email, age)
    const nameMatch = question.match(/name:?\s*([\w]+)/i);
    const emailMatch = question.match(/email:?\s*([\w@.]+)/i);
    const ageMatch = question.match(/age:?\s*(\d+)/i);

    let where: any = {};
    if (nameMatch) where.name = nameMatch[1];
    if (emailMatch) where.email = emailMatch[1];
    if (typeof ageMatch?.[1] === 'string') where.age = parseInt(ageMatch[1], 10);

    let users;
    if (Object.keys(where).length > 0) {
      users = await User.findAll({ where, attributes: ["id", "name", "email", "age", "createdAt", "updatedAt"] });
    } else {
      users = await User.findAll({ attributes: ["id", "name", "email", "age", "createdAt", "updatedAt"] });
    }

    let context = `Filtered user data (one per line):\n`;
    if (users.length > 0) {
      users.forEach((u) => {
        const userObj = u.get ? u.get({ plain: true }) : u;
        context += `ID: ${userObj.id} | Name: ${userObj.name} | Email: ${userObj.email} | Age: ${userObj.age} | Created: ${(userObj as any).createdAt ?? ''} | Updated: ${(userObj as any).updatedAt ?? ''}\n`;
      });
    } else {
      context += `No users found matching your query.\n`;
    }
    return context;
  }
  } catch (error: any) {
    console.error("❌ Chat error:", error?.message || error);
    res.status(500).json({ error: "Something went wrong", details: error?.message });
  }
};

// 📊 Get current data from database so AI can use it
async function getDatabaseContext(): Promise<string> {
  try {
    const userCount = await User.count();
    const users = await User.findAll({ attributes: ["id", "name", "email", "age", "createdAt", "updatedAt"] });

    let context = `DATABASE INFO:\n`;
    context += `- Total users: ${userCount}\n`;
    context += `- Users table columns: id, name, email, age, createdAt, updatedAt\n`;

    if (users.length > 0) {
      context += `\nALL USERS DATA (one per line):\n`;
      users.forEach((u) => {
        const user = u.get ? u.get({ plain: true }) : u;
        context += `ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | Age: ${user.age} | Created: ${(user as any).createdAt ?? ''} | Updated: ${(user as any).updatedAt ?? ''}\n`;
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
        content: `You are a helpful chatbot assistant for a database application called "ChartBot".\nYour job is to answer questions about the data in the database.\nBe concise and direct. When showing a single user, just output the user info as a single line (fields separated by space), with no extra explanation. When listing multiple users, use one line per user, no extra text.\nIf the user asks something unrelated to the database, you can still chat normally but remind them you specialize in database queries.\n\nHere is the current database information:\n${dbContext}`,
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
