import { useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { NavLink, useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";

/**
 * AdminNav
 * A shared horizontal navigation bar rendered inside every Admin page.
 * Uses NavLink so React Router automatically applies the "active" class
 * when the current URL matches the link's path (exact match only).
 */
function AdminNav() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleAdminLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      showToast("Successfully logged out!", "success");
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(error.message, "error");
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="admin-nav">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) =>
          `admin-nav-btn ${isActive ? "admin-nav-btn--active" : ""}`
        }
      >
        📊 Dashboard
      </NavLink>

      <NavLink
        to="/admin/users"
        className={({ isActive }) =>
          `admin-nav-btn ${isActive ? "admin-nav-btn--active" : ""}`
        }
      >
        👥 Users
      </NavLink>

      <NavLink
        to="/admin/products"
        className={({ isActive }) =>
          `admin-nav-btn ${isActive ? "admin-nav-btn--active" : ""}`
        }
      >
        📦 Products
      </NavLink>

      <button
        type="button"
        className="admin-nav-btn admin-nav-logout-btn"
        onClick={handleAdminLogout}
        disabled={isLoggingOut}
      >
        🚪 {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
    </nav>
  );
}

export default AdminNav;
