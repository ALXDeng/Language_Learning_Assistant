import { View, Text } from "react-native";
import React from "react";
import { TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function InputBar({
  newMessage,
  setNewMessage,
  handleRecord,
  handleSendMessage,
  setInputHeight,
  inputHeight,
}) {
  return (
    <View className="flex-row items-center p-4 rounded-md border-t border-gray-200">
      <TextInput
        className="flex-1 bg-gray-100 p-3 rounded-lg mr-2 border border-gray-400"
        placeholder="Type a message..."
        value={newMessage}
        onChangeText={setNewMessage}
        multiline={true}
        numberOfLines={4}
        onContentSizeChange={(event) => {
          setInputHeight(event.nativeEvent.contentSize.height);
        }}
        style={{ height: Math.max(40, inputHeight) }}
      />
      <TouchableOpacity
        className="bg-black p-3 rounded-lg mr-2"
        onPress={handleRecord}
      >
        <Icon name="mic" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-blue-500 p-3 rounded-lg"
        onPress={handleSendMessage}
      >
        <Text className="text-white font-semibold">Send</Text>
      </TouchableOpacity>
    </View>
  );
}
