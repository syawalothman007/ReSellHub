import { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/firebase";
import { sendMessage } from "../firebase/chatService";
import { showToast } from "../utils/toast";

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
  const [partnerProfile, setPartnerProfile] = useState(null);

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
          showToast("Chat not found.", "error");
          navigate("/messages");
          return;
        }

        const chatData = { id: snapshot.id, ...snapshot.data() };

        if (!chatData.participants?.includes(user.uid)) {
          showToast("You do not have access to this chat.", "error");
          navigate("/messages");
          return;
        }

        setChat(chatData);
        setLoading(false);
      },
      (error) => {
        showToast(error.message, "error");
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
        showToast(error.message, "error");
      }
    );

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [user, chatId, navigate]);

  // 🔹 Fetch partner's profile name and photo
  useEffect(() => {
    if (!chat || !user) return;

    const fetchPartnerProfile = async () => {
      const partnerUid = chat.participants?.find((uid) => uid !== user.uid);
      if (!partnerUid) return;

      try {
        const userSnap = await getDoc(doc(db, "users", partnerUid));
        if (userSnap.exists()) {
          setPartnerProfile(userSnap.data());
        }
      } catch (e) {
        console.error("Error fetching partner profile:", e);
      }
    };

    fetchPartnerProfile();
  }, [chat, user]);

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
      showToast(error.message, "error");
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

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="chat-room-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
      </div>
    );
  }

  const partnerName = partnerProfile?.fullName || "User";
  const avatarUrl = partnerProfile?.profileImageUrl;

  return (
    <div className="chat-room-page">
      <style>
        {`
          .chat-room-page {
            padding: var(--space-xl) var(--space-lg);
            background: var(--bg-default);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .chat-container {
            width: 100%;
            max-width: 800px;
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 600px;
          }
          .chat-header {
            padding: var(--space-md) var(--space-lg);
            background: #f9fafb;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-md);
          }
          .header-user-info {
            display: flex;
            align-items: center;
            gap: var(--space-md);
            min-width: 0;
          }
          .chat-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 700;
            font-size: 1rem;
            border: 1px solid var(--border);
            flex-shrink: 0;
          }
          .chat-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .user-text {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }
          .partner-name {
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--text-dark);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .product-context {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .back-btn {
            background: white;
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 8px 14px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all var(--transition-fast);
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .back-btn:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
          }
          .messages-area {
            flex: 1;
            overflow-y: auto;
            padding: var(--space-lg);
            background: #fafafa;
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
          }
          .message-row {
            display: flex;
            width: 100%;
          }
          .message-row.own {
            justify-content: flex-end;
          }
          .message-row.partner {
            justify-content: flex-start;
          }
          .message-bubble {
            max-width: 70%;
            padding: 10px 14px;
            border-radius: var(--radius-md);
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            gap: 4px;
            position: relative;
            animation: bubbleFadeIn 0.3s ease-out;
          }
          @keyframes bubbleFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .message-row.own .message-bubble {
            background: var(--primary);
            color: white;
            border-bottom-right-radius: 2px;
          }
          .message-row.partner .message-bubble {
            background: white;
            color: var(--text-dark);
            border: 1px solid var(--border);
            border-bottom-left-radius: 2px;
          }
          .message-text {
            margin: 0;
            line-height: 1.45;
            font-size: 0.95rem;
            word-break: break-word;
          }
          .message-time {
            align-self: flex-end;
            font-size: 0.7rem;
            opacity: 0.75;
          }
          .message-row.partner .message-time {
            color: var(--text-muted);
          }
          .chat-input-form {
            display: flex;
            gap: var(--space-md);
            padding: var(--space-md) var(--space-lg);
            background: white;
            border-top: 1px solid var(--border);
          }
          .chat-input-field {
            flex: 1;
            padding: 12px 14px;
            border-radius: var(--radius-md);
            border: 1.5px solid var(--border);
            outline: none;
            font-size: 0.95rem;
            transition: all var(--transition-fast);
          }
          .chat-input-field:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
          }
          .chat-input-field:disabled {
             background: #f3f4f6;
             cursor: not-allowed;
          }
          .send-btn {
            padding: 0 var(--space-xl);
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          /* Empty Chat State */
          .empty-chat {
            text-align: center;
            margin: auto;
            color: var(--text-muted);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-sm);
            padding: var(--space-2xl);
          }
          .empty-chat-icon {
            font-size: 3rem;
            margin-bottom: var(--space-xs);
          }
          .empty-chat h3 {
            color: var(--text-dark);
            margin: 0;
            font-family: var(--font-title);
          }
          .empty-chat p {
            margin: 0;
            font-size: 0.95rem;
          }
        `}
      </style>

      <div className="chat-container">
        {/* CHAT HEADER */}
        <div className="chat-header">
          <div className="header-user-info">
            <div className="chat-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={partnerName} />
              ) : (
                getInitials(partnerName)
              )}
            </div>
            <div className="user-text">
              <h2 className="partner-name">{partnerName}</h2>
              {chat?.productTitle && (
                <p className="product-context">Inquiring: {chat.productTitle}</p>
              )}
            </div>
          </div>

          <button className="back-btn" onClick={() => navigate("/messages")}>
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* MESSAGES AREA */}
        <div className="messages-area">
          {messages.length === 0 && (
            <div className="empty-chat">
              <span className="empty-chat-icon">👋</span>
              <h3>Say Hello!</h3>
              <p>Start the conversation. Be polite and eco-conscious.</p>
            </div>
          )}

          {messages.map((message) => {
            const isOwnMessage = message.senderId === user.uid;

            return (
              <div
                key={message.id}
                className={`message-row ${isOwnMessage ? "own" : "partner"}`}
              >
                <div className="message-bubble">
                  <p className="message-text">{message.text}</p>
                  <span className="message-time">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* INPUT FORM */}
        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            className="chat-input-field"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            maxLength="500"
            disabled={sending}
            required
          />
          <button
            type="submit"
            className="btn btn-primary send-btn"
            disabled={sending || !messageText.trim()}
          >
            {sending ? (
              <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2.5px' }} />
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatRoom;
