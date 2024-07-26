import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { useAuthContext } from "@/hooks/useAuthContext";
import { UserMessage } from "@/components/Messages/UserMessage";
import { AssistantMessage } from "@/components/Messages/AssistantMessage";
import axios from "axios";
import { CONST_URL } from "@/constants/const_url";
import Icon from "react-native-vector-icons/Ionicons"; // Import Ionicons
import InputBar from "@/components/InputBar/InputBar";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { Audio } from "expo-av";
import * as Filesystem from "expo-file-system";

export default function Chat() {
  const { id } = useLocalSearchParams();
  const { user } = useAuthContext();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [title, setTitle] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState();
  const [recording, setRecording] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const scrollViewRef = useRef(null);
  const [inputHeight, setInputHeight] = useState(40); // initial height for TextInput
  const [recordingURI, setRecordingURI] = useState(null); // Store the URI of the recording
  const fadeAnim = useRef(new Animated.Value(0)).current; // For red indicator animation
  console.log(user);
  async function handleSendMessage() {
    console.log("Sending message: ", newMessage);
    const userMessage = {
      role: "user",
      content: newMessage,
      createdAt: new Date(), //date and time,
    };
    setIsLoading(true);

    // Step 1: Add the message to the local state
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    // Step 2: Send message to the backend and retrieve a response
    try {
      const res = await axios.post(
        `${CONST_URL}/api/chats/messages/`,
        {
          role: "user",
          chat_id: id,
          content: newMessage,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log("API response: ", res.data);
      setIsLoading(false);
      setNewMessage("");
      setMessages((prevMessages) => [...prevMessages, res.data.latest_message]);
    } catch (err) {
      console.log("Error sending message: ", err);
      setIsLoading(false);
    }
  }

  async function startRecording() {
    try {
      // const permissionStatus = await requestPermission();
      if (permissionResponse.status !== "granted") {
        console.log("Requesting permission...");
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording...");
      // const { recording } = await Audio.Recording.createAsync(
      //   Audio.RecordingOptionsPresets.HIGH_QUALITY
      // );
      // console.log("Recording object: ", recording);
      // setRecording(recording);

      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recordingInstance.startAsync();

      console.log("Recording object: ", recordingInstance);
      setRecording(recordingInstance);

      setIsRecording(true);
      console.log("Recording started");

      // Start the red indicator animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    console.log("Stopping recording...");
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob: ", blob);
      // Send the recording to the backend for transcription
      const formData = new FormData();
      // formData.append("audio", {
      //   uri: uri,
      //   type: "audio/aac",
      //   name: `recording-${user.email}-${new Date().toISOString()}.aac`,
      // });
      formData.append(
        "audio",
        blob,
        `recording-${user.email}-${new Date().toISOString()}.aac`
      );

      // const res = await axios.post(
      //   `${CONST_URL}/api/chats/messages/transcribeonly`,
      //   formData,
      //   {
      //     headers: {
      //       "Content-Type": "multipart/form-data",
      //       Authorization: `Bearer ${user.token}`,
      //     },
      //   }
      // );

      const res = await fetch(
        `${CONST_URL}/api/chats/messages/transcribeonly`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          body: formData,
        }
      );
      if (!res.ok) {
        throw new Error("Failed to transcribe audio");
      }
      const json = await res.json();
      const trans = json.transcription;
      console.log("Transcription response: ", trans);
      setNewMessage(trans);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }

  // Toggle recording state
  async function handleRecord() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  // UseEffect to fetch messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await axios.get(`${CONST_URL}/api/chats/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });
        setMessages(res.data.messages);
        setTitle(res.data.title);
        setInitialLoad(false);
        console.log("List of Messages", res.data.messages);
      } catch (err) {
        console.log("Error fetching messages: ", err);
      }
    }
    fetchMessages();
  }, []);

  // UseEffect to scroll to end when new message is added
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // UseEffect to scroll to end at beginning
  useEffect(() => {
    if (!initialLoad && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  }, [initialLoad]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 p-4">
        <Text className="text-xl font-bold mb-4">{title}</Text>
        <ScrollView className="flex-1 mb-4" ref={scrollViewRef}>
          {messages.map((message) =>
            message.role === "user" ? (
              <UserMessage key={message._id} message={message} />
            ) : (
              <AssistantMessage key={message._id} message={message} />
            )
          )}
          {isLoading && (
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-500">Retrieving Response...</Text>
            </View>
          )}
        </ScrollView>
        <InputBar
          newMessage-={newMessage}
          setNewMessage={setNewMessage}
          inputHeight={inputHeight}
          setInputHeight={setInputHeight}
          handleRecord={handleRecord}
          handleSendMessage={handleSendMessage}
        />
        {isRecording && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              position: "absolute",
              top: 10,
              right: 10,
            }}
          >
            <Icon name="mic" size={30} color="red" />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
