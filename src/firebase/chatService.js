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
    hiddenBy: {
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

  const chat = chatSnap.data();
  const participants = chat.participants || [];
  const receiverId = participants.find((participantId) => participantId !== senderId);

  if (!participants.includes(senderId) || !receiverId) {
    throw new Error("You do not have access to this chat.");
  }

  const messageRef = doc(collection(db, "chats", chatId, "messages"));
  const batch = writeBatch(db);

  const messagePayload = {
    senderId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[sendMessage] message create", {
      chatId,
      currentUserUid: senderId,
      path: `chats/${chatId}/messages/${messageRef.id}`,
      payload: messagePayload,
    });
  }

  batch.set(messageRef, messagePayload);

  const unreadBy = participants.reduce(
    (unreadState, participantId) => ({
      ...unreadState,
      [participantId]: participantId === receiverId,
    }),
    {}
  );

  const hiddenBy = participants.reduce(
    (hiddenState, participantId) => ({
      ...hiddenState,
      [participantId]: false,
    }),
    {}
  );

  const chatUpdatePayload = {
    lastMessage: trimmedText,
    lastUpdated: serverTimestamp(),
    unreadBy,
    hiddenBy,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[sendMessage] chat update", {
      chatId,
      currentUserUid: senderId,
      path: `chats/${chatId}`,
      payload: chatUpdatePayload,
    });
  }

  batch.update(chatRef, chatUpdatePayload);

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

export const isChatHiddenForUser = (chat, userId) =>
  Boolean(userId && chat?.hiddenBy?.[userId] === true);

export const hideChatForUser = async ({ chatId, userId }) => {
  if (!chatId || !userId) return;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    throw new Error("Chat not found.");
  }

  const chat = chatSnap.data();

  if (!chat.participants?.includes(userId)) {
    throw new Error("You do not have access to this chat.");
  }

  const hiddenBy = chat.participants.reduce(
    (hiddenState, participantId) => ({
      ...hiddenState,
      [participantId]: chat.hiddenBy?.[participantId] === true,
    }),
    {}
  );

  hiddenBy[userId] = true;

  await updateDoc(chatRef, { hiddenBy });
};

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
          .filter((chatDoc) => {
            const chat = chatDoc.data();
            return !isChatHiddenForUser(chat, userId) && isChatUnreadForUser(chat, userId);
          })
          .map((chatDoc) => chatDoc.id)
      );

      onChange(unreadChatIds);
    },
    (error) => {
      onError?.(error);
    }
  );
};
