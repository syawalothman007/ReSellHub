import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
    unreadBy: {
      [buyerId]: false,
      [sellerId]: false,
    },
  });

  return chatId;
};

export const sendMessage = async ({ chatId, senderId, text }) => {
  const trimmedText = text.trim();

  if (!trimmedText) return;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    throw new Error("Chat not found.");
  }

  const participants = chatSnap.data().participants || [];
  const receiverId = participants.find((participantId) => participantId !== senderId);

  if (!participants.includes(senderId) || !receiverId) {
    throw new Error("You do not have access to this chat.");
  }

  const messageRef = doc(collection(db, "chats", chatId, "messages"));
const batch = writeBatch(db);

batch.set(messageRef, {
  senderId,
  text: trimmedText,
  createdAt: serverTimestamp(),
});

const unreadBy = {
  ...chatSnap.data().unreadBy,
  [senderId]: false,
  [receiverId]: true,
};

batch.update(chatRef, {
  lastMessage: trimmedText,
  lastUpdated: serverTimestamp(),
  unreadBy,
});

await batch.commit();
};

export const markChatAsRead = async ({ chatId, userId }) => {
  if (!chatId || !userId) return;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) return;

  const unreadBy = {
    ...chatSnap.data().unreadBy,
    [userId]: false,
  };

  await updateDoc(chatRef, {
    unreadBy,
  });
};

export const isChatUnreadForUser = (chat, userId) =>
  Boolean(userId && chat?.unreadBy?.[userId] === true);

export const subscribeToUnreadChats = ({ userId, onChange, onError }) => {
  if (!userId) return () => {};

  const chatsQuery = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId)
  );

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const unreadChatIds = new Set(
        snapshot.docs
          .filter((chatDoc) => isChatUnreadForUser(chatDoc.data(), userId))
          .map((chatDoc) => chatDoc.id)
      );

      onChange(unreadChatIds);
    },
    (error) => {
      onError?.(error);
    }
  );
};
