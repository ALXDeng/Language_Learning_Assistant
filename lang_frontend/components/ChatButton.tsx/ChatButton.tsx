import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import Icon from "react-native-vector-icons/Ionicons";

export default function ChatButton({
  chat_name,
  chat_id,
  chat_language,
  date_created,
  openChat,
  deleteChat,
}) {
  return (
    <View className="mb-1">
      <TouchableOpacity
        className="flex-row items-center bg-white p-4 shadow-lg rounded-xl"
        onPress={() => openChat(chat_id)}
      >
        <View className="flex-1">
          <Text className="font-extrabold text-lg text-gray-900">
            {chat_name}
          </Text>
          <Text className="text-sm text-gray-500">
            {new Date(date_created).toLocaleDateString()}
          </Text>
        </View>
        <Text className="ml-4 text-sm font-semibold text-indigo-500">
          {chat_language}
        </Text>
        <TouchableOpacity
          className="ml-4 p-2 rounded-full"
          onPress={() => deleteChat(chat_id)}
        >
          <Icon name="trash" size={20} color="#000" />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}
