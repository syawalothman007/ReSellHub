import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { getAuth } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getProductThumbnail } from "../utils/productImages";
import { getCategoryOptions, getProductCategory } from "../utils/categories";


function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const [savedIds, setSavedIds] = useState([]);

  const handleSave = async (productId) => {
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
    };

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

  const categoryOptions = getCategoryOptions(
    products.map((product) => getProductCategory(product))
  );

  const filteredProducts = products.filter((p) => {
  const matchName = p.name.toLowerCase().includes(search.toLowerCase());
  const matchCategory = filterCategory ? getProductCategory(p) === filterCategory : true;
  return matchName && matchCategory;
});
  
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
        gap: "10px",
        marginBottom: "20px"
      }}>
        <input
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px",
            flex: 1,
            borderRadius: "5px",
            border: "1px solid #ccc"
          }}
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "5px"
          }}
        >
          <option value="">Select a category</option>
          {categoryOptions.map((productCategory) => (
            <option key={productCategory} value={productCategory}>
              {productCategory}
            </option>
          ))}
        </select>
      </div>
        <h2>Products</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px"
      }}>
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
