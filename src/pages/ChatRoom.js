import { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/firebase";
import { sendMessage } from "../firebase/chatService";

function ChatRoom() {
  const { chatId } = useParams();
  const auth = getAuth();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [user, setUser] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        navigate("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  useEffect(() => {
    if (!user || !chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsubscribeChat = onSnapshot(
      chatRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          alert("Chat not found.");
          navigate("/messages");
          return;
        }

        const chatData = { id: snapshot.id, ...snapshot.data() };

        if (!chatData.participants?.includes(user.uid)) {
          alert("You do not have access to this chat.");
          navigate("/messages");
          return;
        }

        setChat(chatData);
        setLoading(false);
      },
      (error) => {
        alert(error.message);
        setLoading(false);
      }
    );

    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(data);
      },
      (error) => {
        alert(error.message);
      }
    );

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [user, chatId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !user) return;

    try {
      setSending(true);
      await sendMessage({
        chatId,
        senderId: user.uid,
        text: messageText,
      });
      setMessageText("");
    } catch (error) {
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return "";

    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        background: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "auto",
          background: "white",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            background: "#eef7f1",
            borderBottom: "1px solid #dfeade",
            display: "flex",
            justifyContent: "space-between",
            gap: "15px",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 4px", color: "#2e7d32" }}>
              {chat?.productTitle || "Product chat"}
            </h2>
            <p style={{ margin: 0, color: "#777", fontSize: "13px" }}>
              Marketplace conversation
            </p>
          </div>

          <button
            onClick={() => navigate("/messages")}
            style={{
              background: "white",
              color: "#2e7d32",
              border: "1px solid #c8ddcc",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Back
          </button>
        </div>

        <div
          style={{
            height: "430px",
            overflowY: "auto",
            padding: "20px",
            background: "#fbfdfb",
          }}
        >
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#777", marginTop: "120px" }}>
              <h3 style={{ color: "#333" }}>No messages yet</h3>
              <p>Send the first message about this product.</p>
            </div>
          )}

          {messages.map((message) => {
            const isOwnMessage = message.senderId === user.uid;

            return (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: isOwnMessage ? "#2e7d32" : "white",
                    color: isOwnMessage ? "white" : "#333",
                    border: isOwnMessage ? "none" : "1px solid #e4e4e4",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <p style={{ margin: "0 0 4px", lineHeight: "1.4" }}>
                    {message.text}
                  </p>
                  <span
                    style={{
                      display: "block",
                      textAlign: "right",
                      fontSize: "11px",
                      opacity: 0.75,
                    }}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          style={{
            display: "flex",
            gap: "10px",
            padding: "15px",
            borderTop: "1px solid #eee",
          }}
        >
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            maxLength="500"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "auto",
            }}
          />

          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            style={{
              background: sending || !messageText.trim() ? "#aaa" : "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0 18px",
              cursor: sending || !messageText.trim() ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;
