import { NavLink } from "react-router-dom";

/**
 * AdminNav
 * A shared horizontal navigation bar rendered inside every Admin page.
 * Uses NavLink so React Router automatically applies the "active" class
 * when the current URL matches the link's path (exact match only).
 */
function AdminNav() {
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
    </nav>
  );
}

export default AdminNav;
