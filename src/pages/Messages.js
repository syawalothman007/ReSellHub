import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { showToast } from "../utils/toast";

function Messages() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});

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
        showToast(error.message, "error");
        setLoading(false);
      }
    );

    return () => unsubscribeChats();
  }, [user]);

  // 🔹 Fetch participant profiles dynamically
  useEffect(() => {
    if (chats.length === 0 || !user) return;

    const fetchProfiles = async () => {
      const uidsToFetch = chats
        .map((chat) => chat.participants?.find((p) => p !== user.uid))
        .filter((uid) => uid && !profiles[uid]);

      if (uidsToFetch.length === 0) return;

      const newProfiles = { ...profiles };
      let updated = false;

      await Promise.all(
        uidsToFetch.map(async (uid) => {
          try {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
              newProfiles[uid] = userSnap.data();
            } else {
              newProfiles[uid] = { fullName: "Deleted User" };
            }
            updated = true;
          } catch (e) {
            newProfiles[uid] = { fullName: "User" };
            updated = true;
          }
        })
      );

      if (updated) {
        setProfiles(newProfiles);
      }
    };

    fetchProfiles();
  }, [chats, user, profiles]);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "New chat";

    return timestamp.toDate().toLocaleString([], {
      month: "short",
      day: "numeric",
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

  return (
    <div className="messages-page">
      <style>
        {`
          .messages-page {
            padding: var(--space-xl) var(--space-lg);
            background: var(--bg-default);
            min-height: 100vh;
          }
          .page-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .messages-header {
            margin-bottom: var(--space-xl);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .messages-header h1 {
            color: var(--primary-dark);
            font-family: var(--font-title);
            font-size: 2.2rem;
            margin: 0;
            display: flex;
            align-items: center;
            gap: var(--space-sm);
          }
          .count-badge {
            background: var(--primary-light);
            color: var(--primary-dark);
            font-size: 0.9rem;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
          }
          .chat-list {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
          }
          .chat-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: var(--space-lg);
            display: flex;
            align-items: center;
            gap: var(--space-lg);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            cursor: pointer;
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
          }
          .chat-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: var(--primary-light);
          }
          .chat-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--primary);
            opacity: 0;
            transition: opacity var(--transition-fast);
          }
          .chat-card:hover::after {
            opacity: 1;
          }
          .avatar-container {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 700;
            font-size: 1.15rem;
            border: 2px solid var(--border);
            flex-shrink: 0;
          }
          .avatar-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .chat-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .chat-meta {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            flex-wrap: wrap;
          }
          .chat-username {
            font-weight: 700;
            font-size: 1.05rem;
            color: var(--text-dark);
          }
          .product-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            background: #f3f4f6;
            color: #4b5563;
            border: 1px solid #e5e7eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
          }
          .chat-last-message {
            margin: 0;
            color: var(--text-muted);
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .chat-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: var(--space-xs);
            flex-shrink: 0;
          }
          .chat-time {
            color: var(--text-muted);
            font-size: 0.8rem;
          }
          .unread-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-light);
          }
          /* Skeleton Loader */
          .skeleton-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: var(--space-lg);
            display: flex;
            align-items: center;
            gap: var(--space-lg);
            border: 1px solid var(--border);
            height: 90px;
          }
          .skeleton-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: pulse 1.5s infinite;
          }
          .skeleton-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .skeleton-line {
            height: 16px;
            border-radius: 4px;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: pulse 1.5s infinite;
            width: 40%;
          }
          .skeleton-line.long {
            width: 70%;
          }
          @keyframes pulse {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          /* Empty State */
          .empty-state {
            text-align: center;
            padding: var(--space-3xl) var(--space-xl);
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-md);
            max-width: 500px;
            margin: var(--space-2xl) auto;
          }
          .empty-icon {
            font-size: 4rem;
            margin-bottom: var(--space-xs);
          }
          .empty-state h3 {
            font-family: var(--font-title);
            font-size: 1.5rem;
            color: var(--text-dark);
            margin: 0;
          }
          .empty-state p {
            color: var(--text-muted);
            margin: 0 0 var(--space-md);
            font-size: 1rem;
            line-height: 1.5;
          }
        `}
      </style>

      <div className="page-container">
        {/* PAGE HEADER */}
        <div className="messages-header">
          <h1>
            Inbox
            {!loading && chats.length > 0 && (
              <span className="count-badge">{chats.length}</span>
            )}
          </h1>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="chat-list">
            <div className="skeleton-card"><div className="skeleton-avatar" /><div className="skeleton-info"><div className="skeleton-line" /><div className="skeleton-line long" /></div></div>
            <div className="skeleton-card"><div className="skeleton-avatar" /><div className="skeleton-info"><div className="skeleton-line" /><div className="skeleton-line long" /></div></div>
            <div className="skeleton-card"><div className="skeleton-avatar" /><div className="skeleton-info"><div className="skeleton-line" /><div className="skeleton-line long" /></div></div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && chats.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <h3>No Conversations Yet</h3>
            <p>You haven't started any chats yet. Browse items on the homepage and message sellers to start negotiating.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Explore Marketplace
            </button>
          </div>
        )}

        {/* CHAT CARDS LIST */}
        {!loading && chats.length > 0 && (
          <div className="chat-list">
            {chats.map((chat) => {
              const otherUid = chat.participants?.find((p) => p !== user.uid);
              const otherProfile = profiles[otherUid] || {};
              const displayName = otherProfile.fullName || "Loading...";
              const avatarUrl = otherProfile.profileImageUrl;

              return (
                <div
                  key={chat.id}
                  className="chat-card"
                  onClick={() => navigate(`/messages/${chat.id}`)}
                >
                  {/* AVATAR */}
                  <div className="avatar-container">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} />
                    ) : (
                      getInitials(displayName)
                    )}
                  </div>

                  {/* INFO */}
                  <div className="chat-info">
                    <div className="chat-meta">
                      <span className="chat-username">{displayName}</span>
                      {chat.productTitle && (
                        <span className="product-badge" title={chat.productTitle}>
                          🏷️ {chat.productTitle}
                        </span>
                      )}
                    </div>
                    <p className="chat-last-message">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="chat-right">
                    <span className="chat-time">
                      {formatDate(chat.lastUpdated)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
