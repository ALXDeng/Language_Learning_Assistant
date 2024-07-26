import { AuthContextProvider } from "@/context/AuthContext";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(chat)" options={{ headerShown: false }} />
      </Stack>
    </AuthContextProvider>
  );
}

/*
Layout of App:
1. Onboarding 
2. Authentication (auth): sign in or sign up (no tabs)
3. Tabs: Home, Settings, Profile, Flash Cards, 
4. Chat Page: Where you interact


MVP: Home and Chat
1. Home will be a list of chats to choose from
2. Chat will be a chat

Task 1: 
1. get pages loaded and working (onboarding, auth, home, chat)
  - onboarding (continue with email)
  - signin/signup 
  - home chat
2. Styling
*/
