const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const morgan = require("morgan");
const mammoth = require("mammoth");
const textract = require("textract");

const app = express();
app.use(cors());
app.use(morgan("dev"));

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

    // DOCX support
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      return res.send({ text: result.value });
    }

    // DOC & DOCX fallback support using textract
    if (
      mimeType === "application/msword" || // .doc
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    ) {
      return textract.fromBufferWithMime(mimeType, buffer, (error, text) => {
        if (error) {
          console.error("Extraction error:", error);
          return res.status(500).send({ error: "Failed to extract text from file" });
        }
        res.send({ text });
      });
    }

    return res
      .status(400)
      .send({ error: "Unsupported file type. Please upload PDF, TXT, DOC, or DOCX." });
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).send({ error: "Failed to extract text from file" });
  }
});

app.get("/", (req, res) => {
  return res.status(200).send("I am a file parser server");
});

app.listen(3000, () => console.log("Server running on port 3000"));
