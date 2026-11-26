import snowScene from "../../assets/original/snow-hills-conifers.svg";
import type { DeviceScreen } from "../state/deviceReducer";

// Replace these paths with the home teammate's final per-screen backgrounds.
// The white peer post card intentionally does not use a scene image.
export const sceneBackgroundByScreen: Record<DeviceScreen, string> = {
  avatar_picker: snowScene,
  home: snowScene,
  conversation: snowScene,
  matching: snowScene,
  peer_reveal: snowScene,
  encounter: snowScene,
  empty: snowScene,
  support_sent: snowScene,
  letter: snowScene,
};
