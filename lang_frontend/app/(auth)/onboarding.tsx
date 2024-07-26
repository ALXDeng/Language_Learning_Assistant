import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import React from "react";
import { HelloWave } from "@/components/HelloWave";

export default function onboarding() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl">Edit onboarding screen</Text>
      <Button title="Continue with Email" onPress={() => {}}></Button>
    </View>
  );
}
