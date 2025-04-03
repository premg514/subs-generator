import express from "express";
import { configDotenv } from "dotenv";
import fileUpload from "express-fileupload";
import cors from "cors";
import subRoutes from "./routes/subs.routes.js";

const app = express();

configDotenv(); //configure the env
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173/", // Allow frontend origin
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use("/api/subs", subRoutes); // Use routes for the "/api/subs" endpoint

app.listen(process.env.PORT, () => {
  //access the PORT from the .env
  console.log("server started");
});
