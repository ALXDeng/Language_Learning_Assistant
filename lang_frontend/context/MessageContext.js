import { createContext, useReducer } from "react";

export const MessagesContext = createContext();

export const messageReducer = (state, action) => {
  switch (action.type) {
    case "SET_MESSAGES":
      return {
        messages: action.payload,
      };
    case "CREATE_MESSAGE":
      return {
        messages: [...state.messages, action.payload],
      };
    case "DELETE_MESSAGE":
      return {
        messages: state.messages.filter(
          (message) => message._id !== action.payload._id
        ),
      };
    default:
      return state;
  }
};

export const MessagesContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messageReducer, {
    messages: null,
  });

  return (
    <MessagesContext.Provider value={{ ...state, dispatch }}>
      {children}
    </MessagesContext.Provider>
  );
};
