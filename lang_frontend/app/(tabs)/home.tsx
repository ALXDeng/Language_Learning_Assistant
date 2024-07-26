import {
  View,
  Text,
  Button,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useAuthContext } from "@/hooks/useAuthContext";
import axios from "axios";
import ChatButton from "@/components/ChatButton.tsx/ChatButton";
import { CONST_URL } from "@/constants/const_url";
export default function Home() {
  const { user } = useAuthContext();
  const [chats, setChats] = useState([]);

  function openChat(chat_id) {
    console.log("Opening Chat: ", chat_id);
    router.push(`/(chat)/${chat_id}`);
  }
  //Use Effect to fetch chats
  useEffect(() => {
    function getChats() {
      axios
        .get(`${CONST_URL}/api/chats`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        })
        .then((res) => {
          setChats(res.data);
        })
        .catch((err) => {
          console.log("Error fetching chats: ", err);
        });
    }

    getChats();
  }, []);

  //Function to create a new chat
  async function createNewChat() {
    axios
      .post(
        `${CONST_URL}/api/chats/`,
        {
          title: "New Chat",
          language: "Chinese",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      )
      .then((res) => {
        // console.log(res.data);
        setChats([...chats, res.data]);
      })
      .catch((err) => {
        console.log("Error creating chat: ", err);
      });
  }

  async function deleteChat(chat_id) {
    axios
      .delete(`${CONST_URL}/api/chats/${chat_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      })
      .then((res) => {
        console.log("Chat Deleted: ", res.data);
        setChats(chats.filter((chat) => chat._id !== chat_id));
      })
      .catch((err) => {
        console.log("Error deleting chat: ", err);
      });
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-indigo-600 p-6 rounded-b-xl shadow-lg">
        <Text className="text-3xl text-white font-extrabold">Home Page</Text>
        <TouchableOpacity
          className="mt-4 bg-red-500 p-3 rounded-lg"
          onPress={() => {
            AsyncStorage.clear();
          }}
        >
          <Text className="text-white text-center font-semibold">
            Clear Async Storage
          </Text>
        </TouchableOpacity>
      </View>
      <View>
        <Button title="Create New Chat" onPress={createNewChat} />
      </View>
      <View className="flex-1">
        <ScrollView>
          {chats.map((chat) => (
            <ChatButton
              key={chat._id}
              chat_name={chat.title}
              chat_id={chat._id}
              chat_language={chat.language}
              date_created={chat.createdAt}
              openChat={openChat}
              deleteChat={deleteChat}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
