import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getProductThumbnail } from "../utils/productImages";
import { getProductCategory } from "../utils/categories";
import { showToast } from "../utils/toast";

function Saved() {
  const [savedProducts, setSavedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaved = async () => {
      if (!auth.currentUser) return;

      try {
        setIsLoading(true);
        // 🔹 get saved records
        const q = query(
          collection(db, "savedProducts"),
          where("userId", "==", auth.currentUser.uid)
        );

        const snapshot = await getDocs(q);

        const savedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 🔹 get actual product details
        const productsSnapshot = await getDocs(collection(db, "products"));

        const allProducts = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const merged = savedData
          .map((s) => {
            const product = allProducts.find((p) => p.id === s.productId);
            return product ? { ...product, savedId: s.id } : null;
          })
          .filter(Boolean);

        setSavedProducts(merged);
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaved();
  }, [auth.currentUser]);

  // 🔹 remove saved
  const handleRemove = async (savedId) => {
    const confirmRemove = window.confirm(
      "Remove this item from saved list?"
    );

    if (!confirmRemove) return;

    try {
      await deleteDoc(doc(db, "savedProducts", savedId));

      setSavedProducts((prev) =>
        prev.filter((item) => item.savedId !== savedId)
      );
      showToast("Removed from saved list!", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <div className="saved-products-page">
      <style>
        {`
          .saved-products-page {
            padding: var(--space-xl) var(--space-lg);
            background: var(--bg-default);
            min-height: 100vh;
          }
          .page-container {
            max-width: 1000px;
            margin: 0 auto;
          }
          .saved-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-xl);
            gap: var(--space-md);
            flex-wrap: wrap;
          }
          .header-left h1 {
            color: var(--primary-dark);
            font-family: var(--font-title);
            font-size: 2.2rem;
            margin: 0 0 var(--space-xs);
            display: flex;
            align-items: center;
            gap: var(--space-sm);
          }
          .header-left p {
            color: var(--text-muted);
            margin: 0;
            font-size: 1.05rem;
          }
          .count-badge {
            background: var(--primary-light);
            color: var(--primary-dark);
            font-size: 0.9rem;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 20px;
            vertical-align: middle;
            display: inline-block;
          }
          .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: var(--space-xl);
          }
          .product-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            overflow: hidden;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            cursor: pointer;
            transition: all var(--transition-normal);
          }
          .product-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-light);
          }
          .card-image-wrap {
            position: relative;
            aspect-ratio: 4 / 3;
            overflow: hidden;
            background: #f3f4f6;
          }
          .card-image-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--transition-normal);
          }
          .product-card:hover .card-image-wrap img {
            transform: scale(1.05);
          }
          .badge-overlay-container {
            position: absolute;
            top: 12px;
            left: 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .card-badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: var(--radius-sm);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: fit-content;
          }
          .badge-condition {
            background: white;
            color: var(--text-dark);
          }
          .badge-category {
            background: var(--primary-dark);
            color: white;
          }
          .card-content {
            padding: var(--space-md);
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 8px;
          }
          .card-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--text-dark);
            margin: 0;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .card-price {
            font-size: 1.3rem;
            font-weight: 800;
            color: var(--primary-dark);
            margin: 0;
          }
          .card-meta-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: auto;
            padding-top: var(--space-xs);
          }
          .meta-pill {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
            background: #f3f4f6;
            color: #4b5563;
            border: 1px solid #e5e7eb;
          }
          .card-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 1px solid var(--border);
            background: #fafafa;
          }
          .action-btn {
            border: none;
            background: transparent;
            padding: 12px 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all var(--transition-fast);
            color: #4b5563;
          }
          .action-btn svg {
            width: 16px;
            height: 16px;
          }
          .action-btn.view-btn:hover {
            background: #eff6ff;
            color: #2563eb;
          }
          .action-btn.delete-btn:hover {
            background: #fef2f2;
            color: #dc2626;
          }
          /* Loading Skeleton */
          .skeleton-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 340px;
          }
          .skeleton-image {
            height: 180px;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: pulse 1.5s infinite;
          }
          .skeleton-text {
            margin: var(--space-md) var(--space-md) 0;
            height: 20px;
            border-radius: 4px;
            background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
            background-size: 200% 100%;
            animation: pulse 1.5s infinite;
          }
          .skeleton-text.short {
            width: 50%;
            margin-bottom: var(--space-md);
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
        <div className="saved-header">
          <div className="header-left">
            <h1>
              Saved Items
              {!isLoading && savedProducts.length > 0 && (
                <span className="count-badge">{savedProducts.length} {savedProducts.length === 1 ? 'Item' : 'Items'}</span>
              )}
            </h1>
            <p>Your wishlist of saved items you are tracking or planning to buy.</p>
          </div>
        </div>

        {/* LOADING STATE (SKELETON) */}
        {isLoading && (
          <div className="products-grid">
            <div className="skeleton-card"><div className="skeleton-image" /><div className="skeleton-text" /><div className="skeleton-text short" /></div>
            <div className="skeleton-card"><div className="skeleton-image" /><div className="skeleton-text" /><div className="skeleton-text short" /></div>
            <div className="skeleton-card"><div className="skeleton-image" /><div className="skeleton-text" /><div className="skeleton-text short" /></div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && savedProducts.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">💔</span>
            <h3>Your Wishlist is Empty</h3>
            <p>You haven't saved any items yet. Browse products on the marketplace to add them to your wishlist.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Browse Products
            </button>
          </div>
        )}

        {/* WISHLIST CARD GRID */}
        {!isLoading && savedProducts.length > 0 && (
          <div className="products-grid">
            {savedProducts.map((product) => {
              const productThumbnail = getProductThumbnail(product);
              const category = getProductCategory(product);

              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="card-image-wrap">
                    <img
                      src={productThumbnail || "https://via.placeholder.com/300?text=No+Image"}
                      alt={product.name}
                    />
                    <div className="badge-overlay-container">
                      {product.condition && (
                        <span className="card-badge badge-condition">{product.condition}</span>
                      )}
                      {category && (
                        <span className="card-badge badge-category">{category}</span>
                      )}
                    </div>
                  </div>

                  <div className="card-content">
                    <h3 className="card-title">{product.name}</h3>
                    <p className="card-price">RM {Number(product.price || 0).toFixed(2)}</p>

                    <div className="card-meta-row">
                      {product.material && (
                        <span className="meta-pill">🪵 {product.material}</span>
                      )}
                      {product.weight && (
                        <span className="meta-pill">⚖️ {product.weight} kg</span>
                      )}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                      aria-label="View product"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>

                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(product.savedId);
                      }}
                      aria-label="Remove from saved"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
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

export default Saved;
