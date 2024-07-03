const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const multer = require("multer");
const {
  createMessageandResponse,
  createAndTranscribe,
  transcribeandCreate,
  createResponse,
  createMessage,
  transcribeOnly,
  textToSpeech,
} = require("../controllers/messageController");

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/audio/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploadAudio = multer({ storage: audioStorage });

const router = express.Router();

router.use(requireAuth);
router.post("/", createMessage);
router.post(
  "/createandtranscribe",
  uploadAudio.single("audio"),
  createAndTranscribe
);
router.post("/transcribe", uploadAudio.single("audio"), transcribeandCreate);
router.post("/transcribeonly", uploadAudio.single("audio"), transcribeOnly);
router.post("/response", createResponse);
router.post("/texttospeech", textToSpeech);

module.exports = router;
