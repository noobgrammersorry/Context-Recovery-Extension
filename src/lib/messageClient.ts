import type {
  ExtensionMessage,
  ExtensionMessageResponse,
  ExtensionMessageResponseMap
} from "~src/types/messages"

export async function sendExtensionMessage<K extends ExtensionMessage["type"]>(
  message: Extract<ExtensionMessage, { type: K }>
): Promise<ExtensionMessageResponse<ExtensionMessageResponseMap[K]>> {
  return chrome.runtime.sendMessage(message)
}
