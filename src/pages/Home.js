import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getAuth } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getProductThumbnail } from "../utils/productImages";
import { getCategoryOptions, getProductCategory } from "../utils/categories";
import { analyzeProductImage } from "../firebase/aiImageSearch";
import { showToast } from "../utils/toast";

function Home() {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [aiSearchResult, setAiSearchResult] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchError, setAiSearchError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [savedIds, setSavedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const imageInputRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleSave = useCallback(async (productId) => {
    try {
      await addDoc(collection(db, "savedProducts"), {
        userId: auth.currentUser.uid,
        productId,
      });

      setSavedIds((prev) => [...prev, productId]);
      showToast("Product saved to your wishlist!", "success");
    } catch (error) {
      showToast(error.message || "Failed to save product.", "error");
    }
  }, [auth.currentUser]);

  useEffect(() => {
    const auth = getAuth();
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
    };

    const fetchSavedProducts = async () => {
      if (!auth.currentUser) return;
      const snapshot = await getDocs(collection(db, "savedProducts"));
      const ids = snapshot.docs
        .map(doc => doc.data())
        .filter(item => item.userId === auth.currentUser.uid)
        .map(item => item.productId);
      setSavedIds(ids);
    };

    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchSavedProducts()]);
      } catch (err) {
        console.error("Error loading products data:", err);
        showToast("Error loading products.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const categoryOptions = useMemo(
    () => getCategoryOptions(products.map((product) => getProductCategory(product))),
    [products]
  );

  const normalizedSearch = appliedSearch.trim().toLowerCase();
  const aiKeywords = useMemo(
    () => aiSearchResult?.keywords?.map((keyword) => keyword.toLowerCase()) || [],
    [aiSearchResult]
  );

  const getSearchableProductText = useCallback((product) => {
    return [
      product.name,
      product.description,
      product.category,
      getProductCategory(product),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchableProductText = getSearchableProductText(p);
      const matchName = aiSearchResult
        ? aiKeywords.some((keyword) => searchableProductText.includes(keyword))
        : normalizedSearch
          ? p.name.toLowerCase().includes(normalizedSearch)
          : true;
      const matchCategory = filterCategory
        ? getProductCategory(p) === filterCategory
        : true;

      return matchName && matchCategory;
    });
  }, [products, normalizedSearch, filterCategory, aiSearchResult, aiKeywords, getSearchableProductText]);

  const handleSearchSubmit = useCallback((event) => {
    event.preventDefault();
    setAiSearchResult(null);
    setAiSearchError("");
    setAppliedSearch(searchInput.trim());
  }, [searchInput]);

  const handleResetFilters = useCallback(() => {
    setSearchInput("");
    setAppliedSearch("");
    setAiSearchResult(null);
    setAiSearchError("");
    setFilterCategory("");
  }, []);

  const handleImageSearchClick = useCallback(() => {
    if (!isAiSearching) {
      imageInputRef.current?.click();
    }
  }, [isAiSearching]);

  const handleImageSearchChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsAiSearching(true);
    setAiSearchError("");

    try {
      const result = await analyzeProductImage(file);
      const searchTerms = [...result.keywords];

      if (result.productType && !searchTerms.includes(result.productType)) {
        searchTerms.unshift(result.productType);
      }

      setAiSearchResult({
        ...result,
        keywords: searchTerms,
      });
      setAppliedSearch(searchTerms.join(" "));
      setSearchInput(searchTerms.join(", "));
      showToast("AI image analysis completed!", "success");
    } catch (error) {
      setAiSearchResult(null);
      const errMsg = error.message || "AI image search failed. Please try another image.";
      setAiSearchError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setIsAiSearching(false);
    }
  }, []);

  const resultsSummary = useMemo(() => {
    const count = filteredProducts.length;
    const productLabel = count === 1 ? "product" : "products";
    const resultLabel = count === 1 ? "result" : "results";

    if (aiSearchResult) {
      return `Matching Products: ${count}`;
    }

    if (filterCategory && appliedSearch) {
      return `Showing ${count} ${filterCategory} ${productLabel} for "${appliedSearch}"`;
    }

    if (appliedSearch) {
      return `Showing ${count} ${resultLabel} for "${appliedSearch}"`;
    }

    if (filterCategory) {
      return `Showing ${count} ${filterCategory} ${productLabel}`;
    }

    return `Showing ${count} ${productLabel}`;
  }, [filteredProducts.length, filterCategory, appliedSearch, aiSearchResult]);

  // --- SKELETON RENDER ---
  if (isLoading) {
    return (
      <div className="home-page">
        <style>
          {`
            .home-page {
              max-width: 1200px;
              margin: 0 auto;
              padding: var(--space-lg);
            }
            .hero-banner-skeleton {
              height: 220px;
              border-radius: var(--radius-lg);
              margin-bottom: var(--space-xl);
            }
            .filter-section-skeleton {
              height: 120px;
              border-radius: var(--radius-lg);
              margin-bottom: var(--space-xl);
            }
          `}
        </style>
        <div className="skeleton hero-banner-skeleton" />
        <div className="skeleton filter-section-skeleton" />
        <div className="grid-auto-fill">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card" style={{ height: "350px", border: "1px solid var(--border)" }}>
              <div className="skeleton skeleton-rect" style={{ height: "190px" }} />
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="skeleton skeleton-title" style={{ width: "70%" }} />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text short" />
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="skeleton" style={{ width: "60px", height: "20px" }} />
                  <div className="skeleton" style={{ width: "70px", height: "32px", borderRadius: "var(--radius-md)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <style>
        {`
          .home-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--space-lg);
          }

          .hero-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-xl);
            margin-bottom: var(--space-xl);
            padding: var(--space-2xl) var(--space-xl);
            background: linear-gradient(135deg, var(--primary-dark) 0%, #047857 100%);
            border-radius: var(--radius-lg);
            color: white;
            position: relative;
            overflow: hidden;
            box-shadow: var(--shadow-md);
          }

          .hero-banner::before {
            content: '';
            position: absolute;
            top: -20%;
            left: -10%;
            width: 300px;
            height: 300px;
            border-radius: var(--radius-full);
            background: rgba(16, 185, 129, 0.15);
            filter: blur(40px);
          }

          .hero-content {
            position: relative;
            z-index: 2;
            max-width: 600px;
          }

          .hero-title {
            font-family: var(--font-title);
            font-size: 2.75rem;
            font-weight: 800;
            color: white;
            line-height: 1.15;
            margin-bottom: var(--space-sm);
          }

          .hero-title span {
            color: var(--primary);
          }

          .hero-tagline {
            font-size: 1.15rem;
            color: #d1fae5;
            font-weight: 500;
          }

          .hero-logo-container {
            position: relative;
            z-index: 2;
            flex-shrink: 0;
          }

          .hero-logo {
            width: 120px;
            height: 120px;
            object-fit: contain;
            filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
            animation: float 6s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }

          .search-filter-section {
            background: var(--bg-card);
            padding: var(--space-lg);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-premium);
            border: 1px solid var(--border);
            margin-bottom: var(--space-xl);
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
          }

          .search-form {
            display: flex;
            gap: 12px;
            width: 100%;
          }

          .search-input-wrapper {
            flex-grow: 1;
            position: relative;
            display: flex;
            align-items: center;
          }

          .search-icon-bg {
            position: absolute;
            left: 16px;
            color: var(--text-light);
            font-size: 16px;
            pointer-events: none;
          }

          .search-input-wrapper .form-control {
            padding-left: 44px;
          }

          .camera-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: var(--radius-md);
            border: 1.5px solid var(--border);
            background: var(--bg-card);
            color: var(--primary);
            font-size: 18px;
            cursor: pointer;
            transition: all var(--transition-fast);
            flex-shrink: 0;
          }

          .camera-btn:hover {
            border-color: var(--primary);
            background-color: var(--primary-light);
            transform: scale(1.05);
          }

          .camera-btn:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
            color: var(--text-light);
          }

          .search-btn {
            height: 48px;
            padding: 0 var(--space-lg);
          }

          .filter-controls {
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
            border-top: 1px solid var(--border);
            padding-top: var(--space-md);
            flex-wrap: wrap;
          }

          .category-tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .category-tab {
            padding: 8px 16px;
            background: #f3f4f6;
            border-radius: var(--radius-full);
            color: var(--text-muted);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all var(--transition-fast);
            border: 1.5px solid transparent;
            user-select: none;
          }

          .category-tab:hover {
            background: #e5e7eb;
            color: var(--text);
          }

          .category-tab.active {
            background: var(--primary-light);
            color: var(--primary-dark);
            border-color: var(--primary);
          }

          .reset-btn {
            font-size: 13px;
            padding: 8px 14px;
          }

          .ai-result-panel {
            background: var(--primary-light);
            border: 1.5px dashed var(--primary);
            border-radius: var(--radius-md);
            padding: var(--space-md);
            margin-bottom: var(--space-lg);
            display: flex;
            flex-direction: column;
            gap: 6px;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .ai-result-title {
            font-family: var(--font-title);
            color: var(--primary-dark);
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
          }

          .ai-result-item {
            font-size: 14px;
            color: var(--text-muted);
          }

          .ai-result-item strong {
            color: var(--text);
          }

          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--space-lg);
          }

          .section-title {
            font-family: var(--font-title);
            font-size: 24px;
            font-weight: 700;
          }

          .section-count {
            font-size: 13.5px;
            color: var(--text-muted);
            font-weight: 700;
            background: #edf2f0;
            padding: 4px 12px;
            border-radius: var(--radius-full);
          }

          /* Card designs */
          .product-card {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            transition: all var(--transition-normal);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          .product-card:hover {
            transform: translateY(-6px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary);
          }

          .product-image-container {
            width: 100%;
            height: 190px;
            overflow: hidden;
            background: #f3f4f6;
            position: relative;
          }

          .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--transition-slow);
          }

          .product-card:hover .product-image {
            transform: scale(1.06);
          }

          .product-badge-group {
            position: absolute;
            top: 12px;
            left: 12px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            z-index: 10;
          }

          .product-badge {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 4px 8px;
            border-radius: var(--radius-sm);
            box-shadow: var(--shadow-sm);
            backdrop-filter: blur(8px);
          }

          .product-badge-condition {
            background: rgba(255, 255, 255, 0.95);
            color: var(--text);
          }

          .product-details {
            padding: var(--space-md);
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex-grow: 1;
          }

          .product-name {
            font-family: var(--font-title);
            font-size: 16.5px;
            font-weight: 700;
            color: var(--text);
            line-height: 1.35;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            height: 44px;
            transition: color var(--transition-fast);
          }

          .product-card:hover .product-name {
            color: var(--primary);
          }

          .product-price-category {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .product-price {
            font-size: 18px;
            font-weight: 800;
            color: var(--primary-dark);
            margin: 0;
          }

          .product-category-label {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 600;
            background-color: var(--bg-app);
            padding: 2px 8px;
            border-radius: var(--radius-sm);
          }

          .product-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid var(--border);
            padding-top: 12px;
            margin-top: auto;
          }

          .save-btn {
            border: none;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: var(--radius-md);
            font-weight: 700;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all var(--transition-fast);
          }

          .save-btn:active {
            transform: scale(0.95);
          }

          .save-btn.saved {
            background: var(--primary);
            color: white;
          }

          .save-btn.unsaved {
            background: #f3f4f6;
            color: var(--text-muted);
          }

          .save-btn.unsaved:hover {
            background: #e5e7eb;
            color: var(--text);
          }

          @media (max-width: 768px) {
            .hero-banner {
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: var(--space-md);
              padding: var(--space-xl) var(--space-md);
            }

            .hero-title {
              font-size: 2.15rem;
            }

            .search-form {
              flex-direction: column;
            }

            .search-btn {
              width: 100%;
            }

            .filter-controls {
              flex-direction: column;
              align-items: stretch;
            }

            .category-tabs {
              width: 100%;
            }

            .reset-btn {
              width: 100%;
            }
          }
        `}
      </style>

      {/* HERO BANNER */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">
            Find items, save the <span>environment</span>
          </h1>
          <p className="hero-tagline">
            Join the sustainability journey by giving quality goods a second life.
          </p>
        </div>
        <div className="hero-logo-container">
          <img
            src={logo}
            alt="ReSellHub logo badge"
            className="hero-logo"
          />
        </div>
      </div>

      {/* SEARCH AND FILTERS CARD */}
      <div className="search-filter-section">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <span className="search-icon-bg">🔍</span>
            <input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="form-control"
            />
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageSearchChange}
            style={{ display: "none" }}
          />

          {/* AI SEARCH ICON BUTTON */}
          <button
            type="button"
            aria-label="AI image search"
            title="AI image search"
            onClick={handleImageSearchClick}
            disabled={isAiSearching}
            className="camera-btn"
          >
            {isAiSearching ? <span className="ai-search-spinner" /> : "📷"}
          </button>

          <button
            type="submit"
            disabled={isAiSearching}
            className="btn btn-primary search-btn"
          >
            Search
          </button>
        </form>

        <div className="filter-controls">
          {/* CATEGORIES PILL SCROLL */}
          <div className="category-tabs">
            <button
              onClick={() => setFilterCategory("")}
              className={`category-tab ${filterCategory === "" ? "active" : ""}`}
            >
              All Categories
            </button>
            {categoryOptions.map((productCategory) => (
              <button
                key={productCategory}
                onClick={() => setFilterCategory(productCategory)}
                className={`category-tab ${filterCategory === productCategory ? "active" : ""}`}
              >
                {productCategory}
              </button>
            ))}
          </div>

          {(appliedSearch || filterCategory || aiSearchResult) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline reset-btn"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR MESSAGE PANEL */}
      {aiSearchError && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          ⚠️ {aiSearchError}
        </div>
      )}

      {/* AI ANALYSIS RESULTS CARD */}
      {aiSearchResult && (
        <div className="ai-result-panel">
          <h3 className="ai-result-title">
            🤖 AI Search Insights
          </h3>
          <div className="ai-result-item">
            <strong>Detected Product:</strong> {aiSearchResult.productType || "Unknown"}
          </div>
          <div className="ai-result-item">
            <strong>Detected Category:</strong> {aiSearchResult.category || "Unknown"}
          </div>
          <div className="ai-result-item">
            <strong>Key terms used:</strong> {aiSearchResult.keywords.join(", ")}
          </div>
          <div className="ai-result-item">
            <strong>Match summary:</strong> Found {filteredProducts.length} items
          </div>
        </div>
      )}

      {/* HEADER SECTION SUMMARY */}
      <div className="section-header">
        <h2 className="section-title">Explore Listings</h2>
        <span className="section-count">
          {resultsSummary}
        </span>
      </div>

      {/* PRODUCTS DISPLAY GRID */}
      <div className="grid-auto-fill">
        {filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1 / -1", margin: "20px auto" }}>
            <span className="empty-state-icon">📦</span>
            <h3 className="empty-state-title">No products found</h3>
            <p className="empty-state-desc">
              {aiSearchResult
                ? "We couldn't locate items corresponding to the AI image search input."
                : "No items match your active search terms or category selections."}
            </p>
            <button
              onClick={handleResetFilters}
              className="btn btn-primary"
            >
              Reset Filter Options
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const productThumbnail = getProductThumbnail(product);

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="product-card"
              >
                <div className="product-image-container">
                  {productThumbnail ? (
                    <img
                      src={productThumbnail}
                      alt={product.name}
                      className="product-image"
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#9ca3af", fontSize: "40px" }}>
                      🖼️
                    </div>
                  )}

                  {product.condition && (
                    <div className="product-badge-group">
                      <span className="product-badge product-badge-condition">
                        ✨ {product.condition}
                      </span>
                    </div>
                  )}
                </div>

                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>

                  <div className="product-price-category">
                    <p className="product-price">RM {product.price}</p>
                    <span className="product-category-label">
                      {getProductCategory(product)}
                    </span>
                  </div>

                  {/* Save Button */}
                  <div className="product-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!savedIds.includes(product.id)) {
                          handleSave(product.id);
                        }
                      }}
                      disabled={savedIds.includes(product.id)}
                      className={`save-btn ${savedIds.includes(product.id) ? "saved" : "unsaved"}`}
                    >
                      {savedIds.includes(product.id) ? "✅ Saved" : "❤️ Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Home;
