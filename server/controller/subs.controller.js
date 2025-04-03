import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { fileUpload } from "../utils/fileUpload.js";
import { getContent } from "../utils/genContent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoFile = req.files.video;
    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const uploadPath = path.join(uploadDir, videoFile.name);

  
    await videoFile.mv(uploadPath);

    const response = await fileUpload(uploadPath, req.files.video);  //we pass 'uploadPath' and the video file data to 'fileUpload'
    const genContent = await getContent(response);   //the 'response' (containing the file URI) is passed to 'getContent'
    console.log(getContent)
    return res.status(200).json({ subs: genContent });   //// return the generated subtitles to the client
    
  } catch (error) {
    console.error("Error uploading video:", error);
    return res
      .status(500)
      .json({ error: "Internal server error: " + error.message });
  }
};