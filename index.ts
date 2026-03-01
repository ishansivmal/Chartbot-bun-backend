import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();
const port: number = 5000;

// Add types for request and response
//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post("/age", (req: Request, res: Response) => {
  const age: number = req.body.age;
  console.log(`Received age: ${age}`);
  res.send(`Your age is ${age}`);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});