import { Text, View, SafeAreaView, ScrollView, Button } from "react-native";
import { Link, router, Redirect } from "expo-router";
import { useAuthContext } from "../hooks/useAuthContext";
import Onboarding from "./(auth)/onboarding";
import Home from "./(tabs)/home";
import { HelloWave } from "@/components/HelloWave";

//Let this be our onboarding screen
export default function Index() {
  const { user } = useAuthContext();

  if (user) return <Redirect href="/(tabs)/home" />;

  return (
    <SafeAreaView>
      <ScrollView>
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-2xl">Onboarding Page!!!</Text>
          <Button
            title="Continue with Email"
            onPress={() => {
              router.replace("(auth)/sign-in");
            }}
          ></Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
