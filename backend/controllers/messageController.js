require("dotenv").config();
const OpenAI = require("openai");
const Chat = require("../models/chatModel");
const Message = require("../models/messageModel");
const fs = require("fs");
const User = require("../models/userModel");
const multer = require("multer");
const upload = multer({ dest: "uploads/audio" });
const path = require("path");

const secretKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: secretKey,
});

async function pollRunStatus(threadId, runId) {
  const maxAttempts = 70;
  const pollingInterval = 1000; // 2 seconds
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        runId
      );
      // console.log(runStatus.status)
      if (runStatus.status === "completed") {
        // console.log(attempts);
        return runStatus;
      } else if (runStatus.status === "failed") {
        console.error(`Run failed: ${JSON.stringify(runStatus)}`);
        throw new Error("Run failed");
      } else if (runStatus.status === "cancelled") {
        // console.log(attempts);
        throw new Error("Run cancelled");
      }
    } catch (error) {
      console.error(`Error polling run status: ${error.message}`);
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, pollingInterval));
    attempts++;
  }
  const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  throw new Error("Max polling attempts reached");
}
async function executeThread(threadId, role, content, assistantId) {
  try {
    // Create a message in the thread
    await openai.beta.threads.messages.create(threadId, {
      role: role,
      content: content,
    });

    // Start the run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Poll for the run status
    const runStatus = await pollRunStatus(threadId, run.id, assistantId);
    console.log("Run completed successfully");
    run_id = run.id;
    return { runStatus, run_id };
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    throw error; // Re-throw the error to handle it outside the function
  }
}

//functioon for transcribing audio with whisper
async function transcribeAudioWithWhisper(audioFilePath) {
  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    const fileStream = fs.createReadStream(audioFilePath);

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-1",
      });

      if (transcription && transcription.text) {
        return transcription.text;
      } else {
        throw new Error("No transcription text returned");
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      fileStream.close(); // Ensure the stream is properly closed after an error

      if (error.cause && error.cause.code === 'ECONNRESET') {
        attempts++;
        console.error(`Retry ${attempts}/${maxRetries} due to network error.`);
        if (attempts >= maxRetries) {
          throw new Error("Transcription failed after maximum retries due to network issues.");
        }
      } else {
        throw error; // For other types of errors, rethrow immediately
      }
    }
  }
}

//combined function for uploading a message and getting a response
const createMessageandResponse = async (req, res) => {
  const { role, content, chat_id } = req.body;
  const user_id = req.user._id;
  const chat = await Chat.findById(chat_id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  thread_id = chat.thread_id;
  assistant_id = chat.assistant_id;

  //adding a message to the thread
  try {
    executeThread(thread_id, role, content, assistant_id)
      .then(async ({ runStatus, run_id }) => {
        // get the latest message from the thread
        const messages = await openai.beta.threads.messages.list(thread_id);

        let lastMessage = messages.data
          .filter(
            (message) =>
              message.run_id === run_id && message.role === "assistant"
          )
          .pop();
        lastMessage = lastMessage.content[0].text.value;

        if (!lastMessage) {
          return res.status(404).json({ error: "Assistant message not found" });
        }

        // Create a message document from this message
        const message = await Message.create({ role, content });
        if (!message) {
          return res.status(400).json({ error: "Something went wrong" });
        }
        message_assistant = await Message.create({
          role: "assistant",
          content: lastMessage,
        });

        // Add the messages to the chat
        chat.messages.push(message);
        chat.messages.push(message_assistant);
        await chat.save();
        //return the entire chat back to the frontend
        res.status(200).json({ latest_message: message_assistant });
      })
      .catch((error) => {
        console.error(`An error occurred: ${error.message}`);
        res.status(400).json({ error: error.message });
      });
  } catch (err) {
    res.status(400).json({ error: err });
  }

  await chat.save();
};

//single function for just creating a new message
const createMessage = async (req, res) => {
  const { role, content, chat_id } = req.body;
  const user_id = req.user._id;

  const chat = await Chat.findById(chat_id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  try {
    // Create a message document from this message
    const message = await Message.create({
      role: role,
      content: content,
    });
    if (!message) {
      return res.status(400).json({ error: "Message Creation Failed" });
    }
    chat.messages.push(message);
    await chat.save();
    res.status(200).json({ message });
  } catch (error) {
    console.error("Error during message creation", error);
    res.status(400).json({ error: error.message });
  }
};

const transcribeandCreate = async (req, res) => {
  const { role, chat_id } = req.body;
  const user_id = req.user._id;
  const audioFile = req.file.path;
  const chat = await Chat.findById(chat_id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Transcribe the audio file using Whisper API
    const transcription = await transcribeAudioWithWhisper(audioFile);

    if (!transcription) {
      return res.status(404).json({ error: "No transcription text returned" });
    }

    // Create a message document from this message
    const message = await Message.create({
      role: "user",
      content: transcription,
    });
    if (!message) {
      return res.status(400).json({ error: "Message Creation Failed" });
    }

    chat.messages.push(message);
    await chat.save();
    res.status(200).json({ message });
  } catch (error) {
    console.error("Error during transcription:", error);
    res.status(400).json({ error: error.message });
  }
};

const createResponse = async (req, res) => {
  const { role, content, chat_id } = req.body;
  const user_id = req.user._id;
  const chat = await Chat.findById(chat_id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  thread_id = chat.thread_id;
  assistant_id = chat.assistant_id;

  //adding a message to the thread
  try {
    executeThread(thread_id, role, content, assistant_id)
      .then(async ({ runStatus, run_id }) => {
        // get the latest message from the thread
        const messages = await openai.beta.threads.messages.list(thread_id);

        let lastMessage = messages.data
          .filter(
            (message) =>
              message.run_id === run_id && message.role === "assistant"
          )
          .pop();
        lastMessage = lastMessage.content[0].text.value;

        if (!lastMessage) {
          return res.status(404).json({ error: "Assistant message not found" });
        }

        // Create a message document from this message
        message_assistant = await Message.create({
          role: "assistant",
          content: lastMessage,
        });

        // Add the messages to the chat
        chat.messages.push(message_assistant);
        await chat.save();
        //return the entire chat back to the frontend
        res.status(200).json({ latest_message: message_assistant });
      })
      .catch((error) => {
        console.log("we run into an error here")
        console.error(`An error occurred: ${error.message}`);
        res.status(400).json({ error: error.message });
      });
  } catch (err) {
    res.status(400).json({ error: err });
  }

  await chat.save();
};

const createAndTranscribe = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const { role, chat_id } = req.body;
  const user_id = req.user._id;
  const audioFile = req.file.path;

  const chat = await Chat.findById(chat_id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  try {
    // Transcribe the audio file using Whisper API
    const transcription = await transcribeAudioWithWhisper(audioFile);

    // Proceed with creating the message using the transcription as content
    const thread_id = chat.thread_id;
    const assistant_id = chat.assistant_id;

    executeThread(thread_id, role, transcription, assistant_id)
      .then(async ({ runStatus, run_id }) => {
        // Get the latest message from the thread
        const messages = await openai.beta.threads.messages.list(thread_id);

        let lastMessage = messages.data
          .filter(
            (message) =>
              message.run_id === run_id && message.role === "assistant"
          )
          .pop();
        lastMessage = lastMessage.content[0].text.value;

        if (!lastMessage) {
          return res.status(404).json({ error: "Assistant message not found" });
        }

        // Create a message document from this message
        const message = await Message.create({ role, content: transcription });
        if (!message) {
          return res.status(400).json({ error: "Something went wrong" });
        }
        message_assistant = await Message.create({
          role: "assistant",
          content: lastMessage,
        });

        // Add the messages to the chat
        chat.messages.push(message);
        chat.messages.push(message_assistant);
        await chat.save();
        res.status(200).json({ latest_message: message_assistant });
      })
      .catch((error) => {
        console.error(`An error occurred: ${error.message}`);
        res.status(400).json({ error: error.message });
      });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const transcribeOnly = async (req, res) => {
  const user_id = req.user._id;
  const audioFile = req.file.path;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Transcribe the audio file using Whisper API
    const transcription = await transcribeAudioWithWhisper(audioFile);

    if (!transcription) {
      return res.status(404).json({ error: "No transcription text returned" });
    }

    res.status(200).json({ transcription });
  } catch (error) {
    console.error("Error during transcription:", error);
    res.status(400).json({ error: error.message });
  }
};

const textToSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    const userID = req.user._id;

    // Ensure text is provided
    if (!text) {
      return res.status(400).send("No text provided");
    }

    // Generate a unique filename for each request
    const timestamp = Date.now();
    const speechFile = path.resolve(
      `./uploads/audio/tts/speech-${userID}-${timestamp}.mp3`
    );

    const response = await openai.audio.speech.create({
      model: "tts-1-1106",
      voice: "nova",
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);

    // Send the path or URL of the generated audio file
    res.status(200).json({
      audioUrl: `./uploads/audio/tts/speech-${userID}-${timestamp}.mp3`,
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).send("Error generating speech");
  }
};

module.exports = {
  createMessageandResponse,
  createAndTranscribe,
  transcribeandCreate,
  createResponse,
  createMessage,
  transcribeOnly,
  textToSpeech,
};
