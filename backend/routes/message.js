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
    console.log("Setting Destination", file);
    cb(null, "uploads/audio/");
  },
  filename: function (req, file, cb) {
    console.log("Setting Filename", file);
    cb(null, file.originalname);
  },
});
// const audioStorage = multer.memoryStorage();

const uploadAudio = multer({ storage: audioStorage });
// const uploadAudio = multer({ dest: "uploads/audio" });
const router = express.Router();

router.use(requireAuth);
router.post("/", createMessageandResponse);
router.post(
  "/createandtranscribe",
  uploadAudio.single("audio"),
  createAndTranscribe
);
router.post("/transcribe", uploadAudio.single("audio"), transcribeandCreate);
router.post(
  "/transcribeonly",
  (req, res, next) => {
    console.log("Route /transcribeonly hit");
    next();
  },
  uploadAudio.single("audio"),
  (req, res, next) => {
    console.log("Multer middleware executed");
    next();
  },
  transcribeOnly
);
router.post("/response", createResponse);
router.post("/texttospeech", textToSpeech);

module.exports = router;
