import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Redirect, router } from "expo-router";
import { CONST_URL } from "@/constants/const_url";

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { dispatch } = useAuthContext();

  const login = (email, password) => {
    setIsLoading(true);
    setError(null);

    axios
      .post(
        `${CONST_URL}/api/user/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log(response.data); // axios automatically parses JSON

        // Save the user to local storage
        AsyncStorage.setItem("user", JSON.stringify(response.data));

        // Update the authContext
        dispatch({ type: "LOGIN", payload: response.data });

        setIsLoading(false);
        console.log("new user added", response.data);
        router.replace("(tabs)/home");
      })
      .catch((error) => {
        // Handle any errors
        console.log("error", error);
        setError(error.response ? error.response.data.error : error.message);
        setIsLoading(false);
      });
  };

  return { login, isLoading, error };
};
