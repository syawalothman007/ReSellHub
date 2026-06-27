import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddProduct from "./pages/AddProduct";
import Register from "./pages/Register";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import MyProducts from "./pages/MyProducts";
import Saved from "./pages/Saved";
import EditProduct from "./pages/EditProduct";
import ForgotPassword from "./pages/ForgotPassword";
import Messages from "./pages/Messages";
import ChatRoom from "./pages/ChatRoom";

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { showToast } from "./utils/toast";

import "./App.css";
import logo from "./assets/icon.jpeg";

import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

function App() {
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // 🔹 Listen to custom window toasts
  useEffect(() => {
    const handleToast = (event) => {
      const { message, type } = event.detail;
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isHiding: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, 3500);
    };

    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  // 🔹 Track login state + fetch profile name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          try {
            const userRef = doc(
              db,
              "users",
              currentUser.uid
            );

            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setUserName(
                userSnap.data().fullName ||
                currentUser.email?.split("@")[0] ||
                "User"
              );
            } else {
              setUserName(
                currentUser.email?.split("@")[0] ||
                "User"
              );
            }
          } catch (error) {
            console.error(error);

            setUserName(
              currentUser.email?.split("@")[0] ||
              "User"
            );
          }
        } else {
          setUserName("");
        }
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserName("");
      setIsMenuOpen(false);
      showToast("Successfully logged out!", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <Router>
      {/* LOCAL STYLES FOR THE RESPONSIVE NAVBAR */}
      <style>
        {`
          .navbar-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 32px;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            position: sticky;
            top: 0;
            z-index: 1000;
          }

          .navbar-brand-section {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
          }

          .navbar-logo-img {
            width: 44px;
            height: 44px;
            object-fit: cover;
            border-radius: var(--radius-sm);
          }

          .navbar-brand-title {
            font-family: var(--font-title);
            font-size: 20px;
            font-weight: 800;
            color: var(--primary);
            margin: 0;
            line-height: 1.1;
          }

          .navbar-brand-tagline {
            font-size: 11px;
            color: var(--text-muted);
            margin: 0;
          }

          .navbar-menu-links {
            display: flex;
            align-items: center;
            gap: 20px;
          }

          .navbar-menu-link {
            text-decoration: none;
            color: var(--text-muted);
            font-weight: 600;
            font-size: 14.5px;
            padding: 6px 0;
            border-bottom: 2px solid transparent;
            transition: all var(--transition-fast);
          }

          .navbar-menu-link:hover {
            color: var(--primary);
          }

          .navbar-menu-link.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
            font-weight: 700;
          }

          .navbar-user-section {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .navbar-username-badge {
            color: var(--primary-dark);
            background-color: var(--primary-light);
            font-weight: 700;
            font-size: 13.5px;
            padding: 6px 12px;
            border-radius: var(--radius-full);
            text-decoration: none;
            transition: all var(--transition-fast);
          }

          .navbar-username-badge:hover {
            background-color: #d1fae5;
          }

          /* Mobile Toggle Hamburger */
          .navbar-toggle-btn {
            display: none;
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            z-index: 1001;
          }

          .navbar-toggle-icon {
            display: block;
            width: 22px;
            height: 2px;
            background: var(--text);
            position: relative;
            transition: background var(--transition-fast);
          }

          .navbar-toggle-icon::before,
          .navbar-toggle-icon::after {
            content: '';
            position: absolute;
            width: 22px;
            height: 2px;
            background: var(--text);
            left: 0;
            transition: transform var(--transition-fast), top var(--transition-fast), bottom var(--transition-fast);
          }

          .navbar-toggle-icon::before { top: -6px; }
          .navbar-toggle-icon::after { bottom: -6px; }

          /* Open State icon transitions */
          .navbar-toggle-btn.open .navbar-toggle-icon {
            background: transparent;
          }
          .navbar-toggle-btn.open .navbar-toggle-icon::before {
            transform: rotate(45deg);
            top: 0;
          }
          .navbar-toggle-btn.open .navbar-toggle-icon::after {
            transform: rotate(-45deg);
            bottom: 0;
          }

          @media (max-width: 992px) {
            .navbar-container {
              padding: 12px 20px;
            }

            .navbar-toggle-btn {
              display: block;
            }

            .navbar-menu-links {
              position: fixed;
              top: 0;
              right: 0;
              width: 260px;
              height: 100vh;
              background: var(--bg-card);
              box-shadow: -8px 0 25px rgba(0, 0, 0, 0.05);
              flex-direction: column;
              align-items: flex-start;
              padding: 80px 24px 24px;
              gap: 16px;
              transform: translateX(100%);
              transition: transform var(--transition-normal);
              z-index: 1000;
            }

            .navbar-menu-links.open {
              transform: translateX(0);
            }

            .navbar-user-section {
              flex-direction: column;
              align-items: flex-start;
              width: 100%;
              border-top: 1px solid var(--border);
              padding-top: 16px;
              margin-top: 8px;
              gap: 12px;
            }

            .navbar-user-section > button {
              width: 100%;
            }
          }
        `}
      </style>

      {/* NAVBAR */}
      <nav className="navbar-container">
        {/* LEFT */}
        <NavLink to="/" className="navbar-brand-section" onClick={closeMenu}>
          <img
            src={logo}
            alt="logo"
            className="navbar-logo-img"
          />
          <div>
            <h2 className="navbar-brand-title">ReSellHub</h2>
            <p className="navbar-brand-tagline">Give Items a Second Life</p>
          </div>
        </NavLink>

        {/* MOBILE MENU TOGGLE */}
        <button
          className={`navbar-toggle-btn ${isMenuOpen ? "open" : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="navbar-toggle-icon" />
        </button>

        {/* RIGHT */}
        <div className={`navbar-menu-links ${isMenuOpen ? "open" : ""}`}>
          <NavLink
            to="/"
            className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
            onClick={closeMenu}
          >
            Home
          </NavLink>

          {!user && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Register
              </NavLink>
            </>
          )}

          {user && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/add"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Add Product
              </NavLink>

              <NavLink
                to="/my-products"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                My Products
              </NavLink>

              <NavLink
                to="/saved"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Saved
              </NavLink>

              <NavLink
                to="/messages"
                className={({ isActive }) => `navbar-menu-link ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                Messages
              </NavLink>

              {/* USER GREETING */}
              <div className="navbar-user-section">
                <NavLink
                  to="/profile"
                  className="navbar-username-badge"
                  onClick={closeMenu}
                >
                  👤 {userName}
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="btn btn-primary"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* GLOBAL TOAST CONTAINER */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.isHiding ? "hide" : ""}`}
          >
            <span className={`toast-icon toast-${toast.type}-icon`}>
              {toast.type === "success" && "💚"}
              {toast.type === "error" && "❤️"}
              {toast.type === "info" && "ℹ️"}
            </span>
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
            </div>
            <button
              onClick={() => {
                setToasts((prev) =>
                  prev.map((t) => (t.id === toast.id ? { ...t, isHiding: true } : t))
                );
                setTimeout(() => {
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }, 300);
              }}
              className="toast-close"
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* ROUTES */}
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/add"
          element={<AddProduct />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/my-products"
          element={<MyProducts />}
        />

        <Route
          path="/saved"
          element={<Saved />}
        />

        <Route
          path="/messages"
          element={<Messages />}
        />

        <Route
          path="/messages/:chatId"
          element={<ChatRoom />}
        />

        <Route
          path="/edit/:id"
          element={<EditProduct />}
        />
        <Route path="/forgot-password" 
        element={<ForgotPassword />} 
        />
      </Routes>
        
    </Router>
  );
}

export default App;
