const mongoose = require("mongoose");
const Message = require("./messageModel");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    user_id: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    thread_id: {
      type: String,
      required: false,
    },
    assistant_id: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
