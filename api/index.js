const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post("/extract-file", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const mimeType = file.mimetype;
    const buffer = file.buffer;

    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return res.send({ text: data.text });
    }

    if (mimeType === "text/plain") {
      const text = buffer.toString("utf-8");
      return res.send({ text });
    }

    return res
      .status(400)
      .send({ error: "Unsupported file type. Please upload PDF or TXT." });
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).send({ error: "Failed to extract text from file" });
  }
});

app.get("/", (req, res) => {
  return res.status(200).send("I am a file parser server");
});

app.listen(5000, () => console.log("Server running on port 5000"));
