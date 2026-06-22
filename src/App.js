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
    await signOut(auth);
    setUserName("");
  };

  const getLinkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#2e7d32" : "#333",
    fontWeight: isActive ? "bold" : "500",
    borderBottom: isActive
      ? "2px solid #2e7d32"
      : "none",
    paddingBottom: "2px",
  });

  return (
    <Router>
      {/* NAVBAR */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 30px",
          background: "#eef7f1",
          borderBottom: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <img
            src={logo}
            alt="logo"
            style={{ width: "55px" }}
          />

          <div>
            <h2
              style={{
                margin: 0,
                color: "#2e7d32",
              }}
            >
              ReSellHub
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#777",
              }}
            >
              Give Items a Second Life
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <NavLink
            to="/"
            style={getLinkStyle}
          >
            Home
          </NavLink>

          {!user && (
            <>
              <NavLink
                to="/login"
                style={getLinkStyle}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                style={getLinkStyle}
              >
                Register
              </NavLink>
            </>
          )}

          {user && (
            <>
              <NavLink
                to="/dashboard"
                style={getLinkStyle}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/add"
                style={getLinkStyle}
              >
                Add Product
              </NavLink>

              <NavLink
                to="/my-products"
                style={getLinkStyle}
              >
                My Products
              </NavLink>

              <NavLink
                to="/saved"
                style={getLinkStyle}
              >
                Saved
              </NavLink>

              <NavLink
                to="/messages"
                style={getLinkStyle}
              >
                Messages
              </NavLink>

              {/* USER GREETING */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginLeft: "10px",
                }}
              >
                <NavLink
                  to="/profile"
                  style={{
                    color: "#2e7d32",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  {userName}
                </NavLink>

                <button
                  onClick={handleLogout}
                  style={{
                    background: "#2e7d32",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

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
