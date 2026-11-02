import { useColorScheme } from "react-native";
import { chrome } from "./tokens";

export function useChrome() {
  return chrome(useColorScheme() === "dark" ? "dark" : "light");
}
