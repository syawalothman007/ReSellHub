import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { showToast } from "../utils/toast";
import { getProductThumbnail } from "../utils/productImages";
import { getProductCategory } from "../utils/categories";
import AdminNav from "./AdminNav";
import "./Admin.css";

function AdminProducts() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

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
          fetchData();
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

  // 2. Fetch all products and users
  const fetchData = async () => {
    try {
      setDataLoading(true);

      // Fetch Users to build a mapping of userId -> fullName
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersMapping = {};
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        usersMapping[doc.id] = data.fullName || "Unnamed User";
      });
      setUserMap(usersMapping);

      // Fetch Products
      const productsSnapshot = await getDocs(collection(db, "products"));
      const productsList = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProducts(productsList);
      setDataLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Failed to load products.", "error");
      setDataLoading(false);
    }
  };

  // 3. Handle Delete Product Document
  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete the product "${productName}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      showToast(`Product "${productName}" deleted successfully.`, "success");
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("Failed to delete product. Please check permissions.", "error");
    }
  };

  // 4. Filter products by search term
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    const name = (product.name || "").toLowerCase();
    const category = getProductCategory(product).toLowerCase();
    return name.includes(term) || category.includes(term);
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
          <h1>Manage Products</h1>
          <p>View and manage active listings across the marketplace</p>
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
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="admin-total-count">
          Total Products: {filteredProducts.length}
        </div>
      </div>

      {/* Main Table Area */}
      {dataLoading ? (
        <div className="admin-loading-container">
          <div className="admin-spinner" />
          <p className="admin-loading-text">Loading products...</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Seller</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <img
                        src={getProductThumbnail(product) || "https://via.placeholder.com/60"}
                        alt={product.name || "Product"}
                        className="admin-product-img"
                      />
                    </td>
                    <td>
                      <strong>{product.name || "Unnamed Product"}</strong>
                    </td>
                    <td className="admin-text-muted">
                      {userMap[product.userId] || "Unknown Seller"}
                    </td>
                    <td>
                      <span className="admin-role-badge">
                        {getProductCategory(product)}
                      </span>
                    </td>
                    <td>
                      <strong>RM {Number(product.price || 0).toFixed(2)}</strong>
                    </td>
                    <td className="admin-actions-cell">
                      <button
                        className="admin-btn-action view"
                        onClick={() => setSelectedProduct(product)}
                      >
                        View
                      </button>
                      <button
                        className="admin-btn-action delete"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="admin-text-muted" style={{ textAlign: "center", padding: "32px" }}>
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {selectedProduct && (
        <div className="admin-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setSelectedProduct(null)}>
              &times;
            </button>
            
            <div className="admin-modal-header">
              <img
                src={getProductThumbnail(selectedProduct) || "https://via.placeholder.com/64"}
                alt="Product"
                className="admin-product-img"
              />
              <div>
                <h2>{selectedProduct.name || "Unnamed Product"}</h2>
                <p className="admin-text-muted">
                  RM {Number(selectedProduct.price || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="admin-modal-body">
              <div className="admin-modal-detail-row">
                <strong>Product ID:</strong>
                <span className="admin-modal-desc-box">{selectedProduct.id}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Seller:</strong>
                <span>{userMap[selectedProduct.userId] || "Unknown"} (ID: {selectedProduct.userId})</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Category:</strong>
                <span>{getProductCategory(selectedProduct)}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Condition:</strong>
                <span style={{ textTransform: "capitalize" }}>{selectedProduct.condition || "Not specified"}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Material:</strong>
                <span style={{ textTransform: "capitalize" }}>{selectedProduct.material || "Not specified"}</span>
              </div>
              <div className="admin-modal-detail-row">
                <strong>Weight:</strong>
                <span>{selectedProduct.weight ? `${selectedProduct.weight} kg` : "Not specified"}</span>
              </div>
              
              {selectedProduct.description && (
                <div style={{ marginTop: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px" }} className="admin-text-muted">Description:</strong>
                  <p className="admin-modal-desc-box">
                    {selectedProduct.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
