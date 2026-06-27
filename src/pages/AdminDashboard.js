import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { showToast } from "../utils/toast";
import AdminNav from "./AdminNav";
import "./Admin.css";

// CO₂ Emission Factors (matches src/pages/Dashboard.js exactly)
const emissionFactor = {
  plastic: 6.0,
  iron: 1.9,
  metal: 1.9,
  wood: 0.5,
  glass: 1.2,
  fabric: 2.5,
  rubber: 3.0,
  leather: 17.0,
};

function AdminDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalValue: 0,
    wasteReduced: 0,
    co2Saved: 0,
  });

  useEffect(() => {
    // 1. Monitor Authentication State
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        showToast("Access Denied: Please log in first.", "error");
        navigate("/");
        setLoading(false);
        return;
      }

      try {
        // 2. Fetch User Profile to Verify Admin Role
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === "admin") {
          setLoading(false);
          // User is verified admin -> Fetch statistics
          fetchStatistics();
        } else {
          showToast("Access Denied: Admin role required.", "error");
          navigate("/");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error verifying admin role:", err);
        showToast("Error verifying authorization.", "error");
        navigate("/");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      setError(null);

      // A. Query Total Users using count query (efficient)
      const usersCol = collection(db, "users");
      const usersSnap = await getCountFromServer(usersCol);
      const totalUsers = usersSnap.data().count;

      // B. Query Products to calculate metrics
      const productsCol = collection(db, "products");
      const productsSnap = await getDocs(productsCol);
      const totalProducts = productsSnap.size;

      let totalValue = 0;
      let wasteReduced = 0;
      let co2Saved = 0;

      productsSnap.docs.forEach((doc) => {
        const data = doc.data();
        const price = Number(data.price) || 0;
        const weight = Number(data.weight) || 0;
        const material = (data.material || "").trim().toLowerCase();
        
        // Sum values
        totalValue += price;
        wasteReduced += weight;
        co2Saved += weight * (emissionFactor[material] || 0);
      });

      setStats({
        totalUsers,
        totalProducts,
        totalValue,
        wasteReduced,
        co2Saved,
      });

      setStatsLoading(false);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load marketplace statistics. Please ensure Firestore rules are updated.");
      setStatsLoading(false);
      showToast("Failed to load statistics.", "error");
    }
  };

  // Render Loader during initial Auth Verification
  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner" />
        <p className="admin-loading-text">Verifying Admin Status...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Dashboard Header */}
      <header className="admin-header">
        <div className="admin-header-title-area">
          <h1>Admin Dashboard</h1>
          <p>Real-time overview of users, active listings, and sustainability impact metrics</p>
        </div>
        <div className="admin-badge">
          <span className="admin-badge-dot" />
          <span>Admin Console</span>
        </div>
      </header>

      {/* Admin Module Navigation */}
      <AdminNav />
      {statsLoading ? (
        <div className="admin-loading-container">
          <div className="admin-spinner" />
          <p className="admin-loading-text">Calculating Firestore Metrics...</p>
        </div>
      ) : error ? (
        <div className="admin-loading-container">
          <p className="admin-loading-text admin-error-text">{error}</p>
          <button className="btn btn-primary admin-retry-btn" onClick={fetchStatistics}>
            Retry Calculations
          </button>
        </div>
      ) : (
        <section className="admin-stats-grid">
          {/* Card 1: Total Users */}
          <article className="admin-stat-card">
            <div className="admin-stat-icon-wrapper">👥</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Users</span>
              <span className="admin-stat-value">{stats.totalUsers.toLocaleString()}</span>
              <span className="admin-stat-detail">Registered members on ReSellHub</span>
            </div>
          </article>

          {/* Card 2: Total Products */}
          <article className="admin-stat-card">
            <div className="admin-stat-icon-wrapper">📦</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Total Products</span>
              <span className="admin-stat-value">{stats.totalProducts.toLocaleString()}</span>
              <span className="admin-stat-detail">Active marketplace listings</span>
            </div>
          </article>

          {/* Card 3: Total Marketplace Value */}
          <article className="admin-stat-card">
            <div className="admin-stat-icon-wrapper">💰</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Marketplace Value</span>
              <span className="admin-stat-value">RM {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="admin-stat-detail">Total listing value of items</span>
            </div>
          </article>

          {/* Card 4: Waste Reduced */}
          <article className="admin-stat-card">
            <div className="admin-stat-icon-wrapper">♻️</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">Waste Reduced</span>
              <span className="admin-stat-value">{stats.wasteReduced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
              <span className="admin-stat-detail">Weight of items saved from landfills</span>
            </div>
          </article>

          {/* Card 5: CO₂ Saved */}
          <article className="admin-stat-card">
            <div className="admin-stat-icon-wrapper">🍃</div>
            <div className="admin-stat-info">
              <span className="admin-stat-label">CO₂ Saved</span>
              <span className="admin-stat-value">{stats.co2Saved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg</span>
              <span className="admin-stat-detail">Carbon emissions offset equivalent</span>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}

export default AdminDashboard;
