import express from "express";
import { configDotenv } from "dotenv";
import fileUpload from "express-fileupload";
import cors from "cors";
import subRoutes from "./routes/subs.routes.js";

const app = express();

configDotenv(); //configure the env
app.use(fileUpload()); //it will parse the mutipart data
app.use(express.json()); // Enable JSON parsing for request bodies
app.use(
  cors({
    origin: "https://prems-subs-generator.vercel.app", // ✅ Allow frontend requests
    methods: "GET, POST",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true, // ✅ Needed if using authentication
  })
);

app.use("/api/subs", subRoutes); // Use routes for the "/api/subs" endpoint

app.listen(process.env.PORT, () => {
  //access the PORT from the .env
  console.log("server started");
});
