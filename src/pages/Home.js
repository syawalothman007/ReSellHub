import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getAuth } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getProductThumbnail } from "../utils/productImages";
import { getCategoryOptions, getProductCategory } from "../utils/categories";
import { analyzeProductImage } from "../firebase/aiImageSearch";


function Home() {
  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [aiSearchResult, setAiSearchResult] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchError, setAiSearchError] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const [savedIds, setSavedIds] = useState([]);
  const imageInputRef = useRef(null);

  const handleSave = useCallback(async (productId) => {
    try {
      await addDoc(collection(db, "savedProducts"), {
        userId: auth.currentUser.uid,
        productId,
      });

      setSavedIds((prev) => [...prev, productId]);

      alert("Saved!");
      } catch (error) {
        alert(error.message);
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

      const snapshot = await getDocs(
        collection(db, "savedProducts")
      );

      const ids = snapshot.docs
        .map(doc => doc.data())
        .filter(item => item.userId === auth.currentUser.uid)
        .map(item => item.productId);

      setSavedIds(ids);
    };

    fetchProducts();
    
    fetchSavedProducts();
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
    } catch (error) {
      setAiSearchResult(null);
      setAiSearchError(error.message || "AI image search failed. Please try another image.");
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
  
  return (
    <div style={{ padding: "20px", background: "#f9f9f9", minHeight: "100vh" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "25px",
        marginBottom: "40px",
        padding: "30px",
        background: "#e8f5e9",
        borderRadius: "15px"
      }}>
  {/* LOGO */}
  <img
    src={logo}
    alt="logo"
    style={{
      width: "110px",
      height: "110px",
      objectFit: "contain"
    }}
  />

  {/* TEXT */}
  <div style={{ textAlign: "left" }}>
    <h1 style={{
      margin: 0,
      color: "#2e7d32",
      fontSize: "36px",
      fontWeight: "bold",
      letterSpacing: "1px"
    }}>
      ReSellHub
    </h1>

    <p style={{
      marginTop: "8px",
      color: "#555",
      fontSize: "16px"
    }}>
      Give Items a Second Life
    </p>
  </div>
</div>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "24px",
        padding: "16px",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
      }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <input
            placeholder="Search Products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: "12px",
              flex: "1 1 240px",
              minWidth: 0,
              borderRadius: "8px",
              border: "1px solid #d8ded8",
              fontSize: "15px",
              outlineColor: "#2e7d32"
            }}
          />

          <input
            ref={imageInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageSearchChange}
            style={{ display: "none" }}
          />

          <button
            type="button"
            aria-label="AI image search"
            title="AI image search"
            onClick={handleImageSearchClick}
            disabled={isAiSearching}
            style={{
              width: "46px",
              height: "46px",
              padding: 0,
              borderRadius: "8px",
              border: "1px solid #d8ded8",
              background: isAiSearching ? "#edf5ee" : "white",
              color: "#2e7d32",
              fontSize: "20px",
              cursor: isAiSearching ? "not-allowed" : "pointer",
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {isAiSearching ? <span className="ai-search-spinner" /> : "📷"}
          </button>

          <button
            type="submit"
            disabled={isAiSearching}
            style={{
              padding: "12px 22px",
              borderRadius: "8px",
              border: "none",
              background: isAiSearching ? "#8bb98d" : "#2e7d32",
              color: "white",
              fontWeight: "bold",
              cursor: isAiSearching ? "not-allowed" : "pointer",
              flex: "0 0 auto"
            }}
          >
            Search
          </button>
        </form>

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: "12px",
              flex: "1 1 220px",
              minWidth: 0,
              borderRadius: "8px",
              border: "1px solid #d8ded8",
              background: "white",
              fontSize: "15px",
              outlineColor: "#2e7d32"
            }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((productCategory) => (
              <option key={productCategory} value={productCategory}>
                {productCategory}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: "12px 18px",
              borderRadius: "8px",
              border: "1px solid #2e7d32",
              background: "white",
              color: "#2e7d32",
              fontWeight: "bold",
              cursor: "pointer",
              flex: "0 0 auto"
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {aiSearchError && (
        <div style={{
          marginBottom: "16px",
          padding: "14px 16px",
          borderRadius: "8px",
          border: "1px solid #f0b8b8",
          background: "#fff5f5",
          color: "#9b1c1c",
          fontWeight: "600"
        }}>
          {aiSearchError}
        </div>
      )}

      {aiSearchResult && (
        <div style={{
          marginBottom: "16px",
          padding: "16px",
          background: "white",
          borderRadius: "10px",
          border: "1px solid #d8ead9",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
        }}>
          <h3 style={{ margin: "0 0 12px", color: "#2e7d32" }}>
            AI Search Results
          </h3>

          <p style={{ margin: "6px 0" }}>
            <strong>Detected Product:</strong>{" "}
            {aiSearchResult.productType || "Unknown"}
          </p>

          <p style={{ margin: "6px 0" }}>
            <strong>Detected Category:</strong>{" "}
            {aiSearchResult.category || "Unknown"}
          </p>

          <p style={{ margin: "6px 0" }}>
            <strong>Keywords:</strong>{" "}
            {aiSearchResult.keywords.join(", ")}
          </p>

          <p style={{ margin: "6px 0 0" }}>
            <strong>Matching Products:</strong>{" "}
            {filteredProducts.length}
          </p>
        </div>
      )}

      <div style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "16px"
      }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <p style={{
          margin: 0,
          color: "#555",
          fontWeight: "600"
        }}>
          {resultsSummary}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px"
      }}>
      {filteredProducts.length === 0 && (
        <div style={{
          gridColumn: "1 / -1",
          background: "white",
          padding: "24px",
          borderRadius: "10px",
          textAlign: "center",
          color: "#555",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginTop: 0, color: "#333" }}>
            {aiSearchResult ? "No similar products found." : "No products found."}
          </h3>
          {aiSearchResult && (
            <p style={{ marginBottom: 0 }}>
              Try another image or use text search.
            </p>
          )}
        </div>
      )}

      {filteredProducts.map((product) => {
        const productThumbnail = getProductThumbnail(product);

        return (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}

            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}

            style={{
              background: "white",
              borderRadius: "10px",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "0.2s"
            }}
          >
        {productThumbnail && (
          <img
            src={productThumbnail}
            alt={product.name}
            style={{
              width: "100%",
              height: "150px",
              objectFit: "cover"
            }}
          />
        )}

      <div style={{ padding: "10px" }}>
        <h3 style={{ margin: "5px 0" }}>{product.name}</h3>

        <p style={{
          color: "#2e7d32",
          fontWeight: "bold",
          margin: "5px 0"
        }}>
          RM {product.price}
        </p>

        <p style={{
          fontSize: "12px",
          color: "#777"
        }}>
          {getProductCategory(product)}
        </p>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();

            if (!savedIds.includes(product.id)) {
              handleSave(product.id);
            }
          }}
          style={{
            background: savedIds.includes(product.id)
              ? "#2e7d32"
              : "#f5f5f5",
            color: savedIds.includes(product.id)
              ? "white"
              : "#333",
            border: "none",
            padding: "8px 12px",
            borderRadius: "8px",
            cursor: savedIds.includes(product.id)
              ? "default"
              : "pointer",
          }}
        >
          {savedIds.includes(product.id)
            ? "✅ Saved"
            : "❤️ Save"}
        </button>
      </div>
    </div>
        );
      })}
</div>
    </div>
  );
}

export default Home;
