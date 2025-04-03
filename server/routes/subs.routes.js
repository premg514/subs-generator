import express from "express"
import { uploadFile } from "../controller/subs.controller.js"    // import the uploadFile function from the controller folder

const router = express.Router()

router.post("/",uploadFile)    // define a POST route that calls the uploadFile function

export default router     // export the router to use in the main server.js file