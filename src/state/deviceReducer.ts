import type { Encounter, MatchedEncounter, PetAvatarId } from "../contracts";

export type DeviceScreen =
  | "avatar_picker"
  | "home"
  | "conversation"
  | "matching"
  | "encounter"
  | "empty"
  | "letter";

export interface ConversationBubble {
  id: string;
  role: "user" | "pet";
  text: string;
}

export interface DeviceState {
  screen: DeviceScreen;
  petAvatarId: PetAvatarId | null;
  encounter: MatchedEncounter | null;
  unreadLetters: number;
  conversation: ConversationBubble[];
  showZhihuSuggestion: boolean;
}

export type DeviceAction =
  | { type: "avatar_confirmed"; petAvatarId: PetAvatarId }
  | { type: "talk_started" }
  | { type: "conversation_updated"; bubbles: ConversationBubble[]; showZhihuSuggestion: boolean }
  | { type: "shake_started" }
  | { type: "encounter_received"; encounter: Encounter }
  | { type: "support_delivered" }
  | { type: "go_home" }
  | { type: "open_letter" };

const starterConversation: ConversationBubble[] = [
  { id: "pet-welcome", role: "pet", text: "我在呢，慢慢说也没关系。" },
];

export function createInitialDeviceState(petAvatarId: PetAvatarId | null = null): DeviceState {
  return {
    screen: petAvatarId ? "home" : "avatar_picker",
    petAvatarId,
    encounter: null,
    unreadLetters: 0,
    conversation: starterConversation,
    showZhihuSuggestion: false,
  };
}

export function deviceReducer(state: DeviceState, action: DeviceAction): DeviceState {
  switch (action.type) {
    case "avatar_confirmed":
      return { ...state, petAvatarId: action.petAvatarId, screen: "home" };
    case "talk_started":
      return { ...state, screen: "conversation" };
    case "conversation_updated":
      return {
        ...state,
        screen: "conversation",
        conversation: action.bubbles,
        showZhihuSuggestion: action.showZhihuSuggestion,
      };
    case "shake_started":
      return state.screen === "matching" ? state : { ...state, screen: "matching" };
    case "encounter_received":
      if (action.encounter.status === "empty") {
        return { ...state, encounter: null, screen: "empty" };
      }
      return { ...state, encounter: action.encounter, screen: "encounter" };
    case "support_delivered":
      return { ...state, screen: "letter", unreadLetters: state.unreadLetters + 1 };
    case "open_letter":
      return { ...state, screen: "letter" };
    case "go_home":
      return { ...state, screen: "home" };
  }
}
