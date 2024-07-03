const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const {
  getChats,
  createChat,
  deleteChat,
  getChat,
} = require("../controllers/chatController");

const router = express.Router();

router.use(requireAuth);
router.get("/", getChats);
router.post("/", createChat);
router.delete("/:id", deleteChat);
router.get("/:id", getChat);


module.exports = router;
