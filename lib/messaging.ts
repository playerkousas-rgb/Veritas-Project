// Verity Message Service - Street Talk Protocol
import * as SecureStore from 'expo-secure-store';
import { getIdentity } from './identity';
import { getTrustedPeers, saveTrustedPeer } from './storage';
import { signData, verifySignature } from './crypto';

const MESSAGES_KEY = 'veritas_messages';
const REQUESTS_KEY = 'veritas_requests';
const CONVERSATION_STATES_KEY = 'veritas_conversation_states';

export interface VerityMessage {
  id: string;
  fromUIN: string;
  toUIN: string;
  content: string;
  timestamp: number;
  signature: string;
  isRead: boolean;
}

export interface ConversationState {
  otherUIN: string;
  isUnlocked: boolean; // True if they replied
  lastMessageAt: number;
  isBlocked: boolean; // True if user deleted/ignored
  canSendMessage: boolean; // False if waiting for reply
}

export type MessageCategory = 'friends' | 'requests';

// Check if user can send message to another user
export async function canSendMessageTo(
  targetUIN: string
): Promise<{ canSend: boolean; reason?: string }> {
  const identity = await getIdentity();
  if (!identity) return { canSend: false, reason: 'No identity' };
  
  // Check if target is a trusted peer
  const peers = await getTrustedPeers();
  const isFriend = peers.some(p => p.uin === targetUIN);
  
  if (isFriend) {
    return { canSend: true };
  }
  
  // Check conversation state for stranger
  const states = await getConversationStates();
  const state = states.find(s => s.otherUIN === targetUIN);
  
  if (!state) {
    // First contact - can send ONE message
    return { canSend: true };
  }
  
  if (state.isBlocked) {
    return { canSend: false, reason: '對方已忽略你的訊息' };
  }
  
  if (!state.isUnlocked) {
    return { canSend: false, reason: '等待對方回覆中...' };
  }
  
  return { canSend: true };
}

// Send a message
export async function sendMessage(
  toUIN: string,
  content: string
): Promise<VerityMessage> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity');
  
  const check = await canSendMessageTo(toUIN);
  if (!check.canSend) {
    throw new Error(check.reason || 'Cannot send message');
  }
  
  // Create message with signature
  const messageData = `${identity.uin}:${toUIN}:${content}:${Date.now()}`;
  const signature = await signData(messageData);
  
  const message: VerityMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fromUIN: identity.uin,
    toUIN,
    content,
    timestamp: Date.now(),
    signature,
    isRead: false,
  };
  
  // Store message
  const peers = await getTrustedPeers();
  const isFriend = peers.some(p => p.uin === toUIN);
  
  if (isFriend) {
    await storeFriendMessage(message);
  } else {
    await storeRequestMessage(message);
    // Update conversation state - lock sending
    await updateConversationState(toUIN, {
      canSendMessage: false,
      lastMessageAt: Date.now(),
    });
  }
  
  return message;
}

// Receive and process incoming message
export async function receiveMessage(
  message: VerityMessage
): Promise<{ category: MessageCategory; needsReply: boolean }> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity');
  
  // Verify signature (mock - in production would resolve UIN to public key)
  // const isValid = await verifySignature(...)
  
  // Check if sender is a friend
  const peers = await getTrustedPeers();
  const isFriend = peers.some(p => p.uin === message.fromUIN);
  
  if (isFriend) {
    await storeFriendMessage(message);
    return { category: 'friends', needsReply: false };
  }
  
  // Stranger message - goes to requests
  await storeRequestMessage(message);
  return { category: 'requests', needsReply: true };
}

// Reply to a message (unlocks conversation)
export async function replyToMessage(
  originalMessage: VerityMessage,
  replyContent: string
): Promise<VerityMessage> {
  const identity = await getIdentity();
  if (!identity) throw new Error('No identity');
  
  // Send reply
  const reply = await sendMessage(originalMessage.fromUIN, replyContent);
  
  // Unlock conversation for both parties
  await updateConversationState(originalMessage.fromUIN, {
    isUnlocked: true,
    canSendMessage: true,
    lastMessageAt: Date.now(),
  });
  
  return reply;
}

// Ignore/block a stranger
export async function ignoreStranger(uin: string): Promise<void> {
  await updateConversationState(uin, {
    isBlocked: true,
    isUnlocked: false,
  });
  
  // Delete their messages
  await deleteMessagesFrom(uin);
}

// Delete messages from a user
async function deleteMessagesFrom(uin: string): Promise<void> {
  const requests = await getRequests();
  const filtered = requests.filter(m => m.fromUIN !== uin);
  await SecureStore.setItemAsync(REQUESTS_KEY, JSON.stringify(filtered));
}

// Storage functions
async function storeFriendMessage(message: VerityMessage): Promise<void> {
  const messages = await getFriendMessages();
  messages.push(message);
  await SecureStore.setItemAsync(MESSAGES_KEY, JSON.stringify(messages));
}

async function storeRequestMessage(message: VerityMessage): Promise<void> {
  const requests = await getRequests();
  requests.push(message);
  await SecureStore.setItemAsync(REQUESTS_KEY, JSON.stringify(requests));
}

export async function getFriendMessages(): Promise<VerityMessage[]> {
  const stored = await SecureStore.getItemAsync(MESSAGES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function getRequests(): Promise<VerityMessage[]> {
  const stored = await SecureStore.getItemAsync(REQUESTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function getConversationStates(): Promise<ConversationState[]> {
  const stored = await SecureStore.getItemAsync(CONVERSATION_STATES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

async function updateConversationState(
  uin: string,
  updates: Partial<ConversationState>
): Promise<void> {
  const states = await getConversationStates();
  const index = states.findIndex(s => s.otherUIN === uin);
  
  if (index !== -1) {
    states[index] = { ...states[index], ...updates };
  } else {
    states.push({
      otherUIN: uin,
      isUnlocked: false,
      lastMessageAt: Date.now(),
      isBlocked: false,
      canSendMessage: true,
      ...updates,
    });
  }
  
  await SecureStore.setItemAsync(CONVERSATION_STATES_KEY, JSON.stringify(states));
}

// Decay protocol - clean up old unresponded messages
export async function runMessageDecay(): Promise<void> {
  const requests = await getRequests();
  const states = await getConversationStates();
  
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  // Filter out old unresponded requests
  const validRequests = requests.filter(msg => {
    const state = states.find(s => s.otherUIN === msg.fromUIN);
    if (!state || !state.isUnlocked) {
      return now - msg.timestamp < twentyFourHours;
    }
    return true;
  });
  
  await SecureStore.setItemAsync(REQUESTS_KEY, JSON.stringify(validRequests));
}
