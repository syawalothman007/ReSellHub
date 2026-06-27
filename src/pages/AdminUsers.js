import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { showToast } from "../utils/toast";
import AdminNav from "./AdminNav";
import "./Admin.css";

function AdminUsers() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // 1. Authenticate and verify Admin Role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        showToast("Access Denied: Please log in first.", "error");
        navigate("/");
        setAuthLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === "admin") {
          setAuthLoading(false);
          fetchUsers();
        } else {
          showToast("Access Denied: Admin role required.", "error");
          navigate("/");
          setAuthLoading(false);
        }
      } catch (err) {
        console.error("Error verifying admin role:", err);
        showToast("Error verifying authorization.", "error");
        navigate("/");
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // 2. Fetch all users
  const fetchUsers = async () => {
    try {
      setDataLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setDataLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Failed to load users.", "error");
      setDataLoading(false);
    }
  };

  // 3. Handle Delete User Document
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName || "this user"}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      showToast(`User ${userName} deleted successfully.`, "success");
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Failed to delete user. Please check permissions.", "error");
    }
  };

  // 4. Filter users by search term
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const name = (user.fullName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  if (authLoading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner" />
        <p className="admin-loading-text">Verifying Admin Status...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-title-area">
          <h1>Manage Users</h1>
          <p>View and manage registered accounts in ReSellHub</p>
        </div>
        <div className="admin-badge">
          <span className="admin-badge-dot" />
          <span>Admin Console</span>
        </div>
      </header>

      {/* Admin Module Navigation */}
      <AdminNav />

      {/* Toolbar (Search) */}
      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <span className="admin-search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: "600" }}>
          Total Users: {filteredUsers.length}
        </div>
      </div>

      {/* Main Table Area */}
      {dataLoading ? (
        <div className="admin-loading-container" style={{ minHeight: "200px" }}>
          <div className="admin-spinner" />
          <p className="admin-loading-text">Loading users...</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <img
                        src={user.profileImageUrl || "https://via.placeholder.com/40"}
                        alt={user.fullName || "User"}
                        className="admin-profile-img"
                      />
                    </td>
                    <td>
                      <strong>{user.fullName || "Unnamed User"}</strong>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{user.email || "N/A"}</td>
                    <td>
                      <span className={`admin-role-badge ${user.role === "admin" ? "admin" : ""}`}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="admin-actions-cell">
                      <button
                        className="admin-btn-action view"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                      <button
                        className="admin-btn-action delete"
                        onClick={() => handleDelete(user.id, user.fullName)}
                        disabled={user.id === auth.currentUser?.uid} // Prevent deleting oneself
                        style={{ opacity: user.id === auth.currentUser?.uid ? 0.5 : 1, cursor: user.id === auth.currentUser?.uid ? "not-allowed" : "pointer" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
              &times;
            </button>
            
            <div className="admin-modal-header">
              <img
                src={selectedUser.profileImageUrl || "https://via.placeholder.com/64"}
                alt="Profile"
              />
              <div>
                <h2>{selectedUser.fullName || "Unnamed User"}</h2>
                <p style={{ color: "var(--text-muted)" }}>{selectedUser.email}</p>
              </div>
            </div>

            <div className="admin-modal-body">
              <div className="admin-modal-detail-row">
                <strong>User ID:</strong>
                <span style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{selectedUser.id}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Role:</strong>
                <span style={{ textTransform: "capitalize" }}>{selectedUser.role || "User"}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Phone:</strong>
                <span>{selectedUser.phone || "Not provided"}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Gender:</strong>
                <span style={{ textTransform: "capitalize" }}>{selectedUser.gender || "Not provided"}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Birth Date:</strong>
                <span>{selectedUser.birthDate || "Not provided"}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Address:</strong>
                <span>{selectedUser.address || "Not provided"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
