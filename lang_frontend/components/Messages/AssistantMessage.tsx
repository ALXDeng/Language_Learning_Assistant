import React from "react";
import { View, Text } from "react-native";

export function AssistantMessage({ message }) {
  return (
    <View className="self-start bg-gray-300 p-3 m-2 rounded-lg max-w-xs">
      <Text className="text-gray-800">{message.content}</Text>
    </View>
  );
}
