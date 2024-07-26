import React from "react";
import { View, Text } from "react-native";

export function UserMessage({ message }) {
  return (
    <View className="self-end bg-blue-500 p-3 m-2 rounded-lg max-w-xs">
      <Text className="text-white">{message.content}</Text>
    </View>
  );
}
