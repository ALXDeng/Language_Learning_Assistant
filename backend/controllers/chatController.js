// import the required dependencies
require("dotenv").config();
const OpenAI = require("openai");
const { assist_dict, intro } = require("../assistant_keys.js");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

const secretKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

const getChats = async (req, res) => {
  const user_id = req.user._id;
  const chats = await Chat.find({ user_id }).sort({ createdAt: -1 });
  res.status(200).json(chats);
};

const createChat = async (req, res) => {
  const { title, language } = req.body;
  console.log(req.body);

  try {
    //finding appropriate assistant id
    const assistant_id = assist_dict[language];
    console.log(assistant_id);

    //retrieving the appropriate assistant
    const assistant = await openai.beta.assistants.retrieve(assistant_id);
    //error checking
    if (!assistant) {
      return res.status(404).json({ error: "Assistant not found" });
    }

    //creating a new thread
    const thread = await openai.beta.threads.create();
    //error checking
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    //naming the thread
    thread_id = thread.id;

    //retrieve the user id
    const user_id = req.user._id;

    //creating a chat in the database
    const chat = await Chat.create({
      title,
      language,
      user_id,
      thread_id,
      assistant_id,
    });

    const message = await Message.create({
      role: "assistant",
      content: intro[language],
    });

    //saving the chat in the database
    chat.messages.push(message);
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteChat = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Chat not found" });
  }
  const chat = await Chat.findOneAndDelete({ _id: id });
  res.status(200).json(chat);
};

const getChat = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const chat = await Chat.findById(id).populate("messages");
  // console.log(chat);
  res.status(200).json(chat);
};

module.exports = {
  getChats,
  createChat,
  deleteChat,
  getChat,
};
