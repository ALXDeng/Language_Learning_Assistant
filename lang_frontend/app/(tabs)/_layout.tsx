import { SplashScreen, Stack, Tabs } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function tabsLayout() {
  return (
    //fix this syntax
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{ title: "Home", headerShown: false }}
      />
    </Tabs>
  );
}
