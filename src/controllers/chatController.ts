import { type Request, type Response } from "express";

declare module 'express-session' {
  interface SessionData {
    adminGreeted?: boolean;
  }
}

import User from "../models/User";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🛠️ This function runs when AI decides to query database
async function query_database(filter: any): Promise<string> {
  try {
    const options: any = {
      attributes: ["id", "name", "email", "age", "createdAt", "updatedAt"]
    };

    if (filter.where) options.where = filter.where;
    if (filter.order) options.order = filter.order;
    if (filter.limit) options.limit = filter.limit;

    const users = await User.findAll(options);

    if (!users.length) return "No users found.";

    return users.map(u => {
      const user = u.get({ plain: true }) as any;
      return `ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | Age: ${user.age} | Created: ${user.createdAt} | Updated: ${user.updatedAt}`;
    }).join("\n");

  } catch (error: any) {
    return `Database error: ${error.message}`;
  }
}

// 🤖 Main chatbot function
export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Please send a message" });
      return;
    }

    const messages: any[] = [
      {
        role: "system",
        content: `You are a helpful database assistant. 
        You have access to a users database with columns: id, name, email, age, createdAt, updatedAt.
        When user asks about data, ALWAYS use the query_database tool to get accurate data.
        Never guess or make up data. Always query first, then answer.`
      },
      {
        role: "user",
        content: message
      }
    ];

    // 🛠️ Define the tool for AI
    const tools: any[] = [
      {
        type: "function",
        function: {
          name: "query_database",
          description: "Query the users database. Use this whenever user asks about users data.",
          parameters: {
            type: "object",
            properties: {
              where: {
                type: "object",
                description: "Filter conditions e.g { name: 'John' } or { age: 25 }"
              },
              order: {
                type: "array",
                description: "Sort order e.g [['age', 'DESC']] for oldest first"
              },
              limit: {
                type: "number",
                description: "How many results to return e.g 1 for only one user"
              }
            }
          }
        }
      }
    ];

    // 🔁 Step 1 - First AI response (AI decides if it needs to query)
    let response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      tools,
      tool_choice: "auto", // AI decides when to use tool
      max_tokens: 1024
    });

    let aiMessage = response.choices[0].message;

    // 🔁 Step 2 - If AI wants to use a tool, run it
    while (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      
      // Add AI's decision to messages
      messages.push(aiMessage);

      // Run each tool AI requested
      for (const toolCall of aiMessage.tool_calls) {
        const filter = JSON.parse(toolCall.function.arguments);
        
        console.log("🤖 AI is querying database with:", filter);
        
        // Actually query the database
        const dbResult = await query_database(filter);

        // Add database result back to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: dbResult
        });
      }

      // 🔁 Step 3 - Ask AI again with the database results
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024
      });

      aiMessage = response.choices[0].message;
    }

    // ✅ Final answer from AI
    let finalAnswer = aiMessage.content || "Sorry, I couldn't generate a response.";

    // Add welcome message for first time
    if (!req.session?.adminGreeted) {
      finalAnswer = `\n${finalAnswer}`;
      if (req.session) req.session.adminGreeted = true;
    }

    res.json({
      question: message,
      answer: finalAnswer,
      usedAI: true,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error("❌ Chat error:", error?.message || error);
    res.status(500).json({ error: "Something went wrong", details: error?.message });
  }
};
```

---

## 🔵 What Changed Simply:

| Old Way | New Way |
|---|---|
| You fetch ALL data always | AI decides what to fetch |
| You send data to AI | AI queries itself using tool |
| Wasteful | Only gets what it needs ✅ |

---

## 🧠 Simple Flow Now:
```
