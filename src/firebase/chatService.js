import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

const buildChatId = ({ buyerId, sellerId, productId }) =>
  `${productId}_${buyerId}_${sellerId}`;

export const getOrCreateChat = async ({
  buyerId,
  sellerId,
  productId,
  productTitle,
}) => {
  const chatId = buildChatId({ buyerId, sellerId, productId });
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    return chatSnap.id;
  }

  await setDoc(chatRef, {
    buyerId,
    sellerId,
    productId,
    productTitle,
    participants: [buyerId, sellerId],
    lastMessage: "",
    lastUpdated: serverTimestamp(),
  });

  return chatId;
};

export const sendMessage = async ({ chatId, senderId, text }) => {
  const trimmedText = text.trim();

  if (!trimmedText) return;

  const chatRef = doc(db, "chats", chatId);
  const messageRef = doc(collection(db, "chats", chatId, "messages"));
  const batch = writeBatch(db);

  batch.set(messageRef, {
    senderId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  batch.update(chatRef, {
    lastMessage: trimmedText,
    lastUpdated: serverTimestamp(),
  });

  await batch.commit();
};
