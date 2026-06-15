import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const userId = (req.headers["x-replit-user-id"] as string) || "unknown";
    cb(null, `${userId}_resume.pdf`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted."));
    }
  },
});

router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  const userId = req.headers["x-replit-user-id"] as string | undefined;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

  const resumeUrl = `/api/resume/${userId}`;
  const resumeFilename = req.file.originalname;

  try {
    await db
      .insert(candidatesTable)
      .values({
        userId,
        resumeUrl,
        resumeFilename,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: candidatesTable.userId,
        set: { resumeUrl, resumeFilename, uploadedAt: new Date(), updatedAt: new Date() },
      });

    res.json({ resumeUrl, filename: resumeFilename });
  } catch (err) {
    req.log.error({ err }, "[upload] Failed to save resume record");
    res.status(500).json({ error: "Failed to save resume record" });
  }
});

router.get("/resume/:userId", (req, res) => {
  const { userId } = req.params;
  const filePath = path.join(uploadDir, `${userId}_resume.pdf`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.sendFile(filePath);
});

export default router;
