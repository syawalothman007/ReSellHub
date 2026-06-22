import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";

function Messages() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setChats([]);
        setLoading(false);
        navigate("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribeChats = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const aTime = a.lastUpdated?.toMillis?.() || 0;
            const bTime = b.lastUpdated?.toMillis?.() || 0;
            return bTime - aTime;
          });

        setChats(data);
        setLoading(false);
      },
      (error) => {
        alert(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribeChats();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "New chat";

    return timestamp.toDate().toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        }}
      >
        <h1 style={{ color: "#2e7d32", marginBottom: "20px" }}>
          Messages
        </h1>

        {loading && (
          <p style={{ color: "#777" }}>Loading conversations...</p>
        )}

        {!loading && chats.length === 0 && (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "25px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              color: "#777",
            }}
          >
            <h3 style={{ color: "#333", marginTop: 0 }}>
              No conversations yet
            </h3>
            <p>Start from a product page by clicking Chat Seller.</p>
          </div>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => navigate(`/messages/${chat.id}`)}
            style={{
              background: "white",
              padding: "16px",
              marginBottom: "14px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
              border: "1px solid #eef2ee",
              transition: "0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.01)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 6px" }}>
                  {chat.productTitle || "Product chat"}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: chat.lastMessage ? "#555" : "#777",
                  }}
                >
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>

              <span
                style={{
                  color: "#777",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(chat.lastUpdated)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Messages;
