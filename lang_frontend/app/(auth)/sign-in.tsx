import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useLogin } from "@/hooks/useLogin";
import { useState } from "react";
import React from "react";
import { router } from "expo-router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, error, isLoading } = useLogin();

  const handleSubmit = async () => {
    await login(email, password);
    // if (!error) {
    //   console.log("error log", error);
    //   router.replace("(tabs)/home");
    // }
  };

  return (
    //convert this to nativewind
    // <View className="flex-1 items-center justify-center bg-white">
    //flex grow in nativewind
    <SafeAreaView className="flex-1 justify-center">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className=" p-4">
          <Text className="text-lg font-bold mb-4">Log in</Text>
          <Text className="mb-2 font-medium">Email</Text>
          <TextInput
            className="bg-gray-200 p-2 mb-4 rounded"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text className="mb-2 font-medium">Password</Text>
          <TextInput
            className="bg-gray-200 p-2 mb-4 rounded"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
          />
          {isLoading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <Button title="Login" onPress={handleSubmit} disabled={isLoading} />
          )}
          {error && <Text className="text-red-500 mt-2">{error}</Text>}

          <Button
            title="Don't have an account? Signup"
            onPress={() => {
              router.replace("(auth)/sign-up");
            }}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
