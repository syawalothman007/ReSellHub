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

function Saved() {
  const [savedProducts, setSavedProducts] = useState([]);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSaved = async () => {
      if (!auth.currentUser) return;

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
    };

    fetchSaved();
  }, [auth.currentUser]);

  // 🔹 remove saved
  const handleRemove = async (savedId) => {
  const confirmRemove = window.confirm(
    "Remove this item from saved list?"
    );

    if (!confirmRemove) return;

    await deleteDoc(doc(db, "savedProducts", savedId));

    setSavedProducts((prev) =>
      prev.filter((item) => item.savedId !== savedId)
    );
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#2e7d32", marginBottom: "20px" }}>
        ❤️ Saved Items
      </h1>

      {/* 🔥 EMPTY STATE */}
      {savedProducts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: "50px",
            color: "#777",
          }}
        >
          <h3>No saved items yet</h3>
          <p>Start saving products you’re interested in.</p>
        </div>
      )}

      {/* 🔥 GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {savedProducts.map((product) => {
          const productThumbnail = getProductThumbnail(product);

          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
            style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.03)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            {/* IMAGE */}
            {productThumbnail && (
              <img
                src={productThumbnail}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                }}
              />
            )}

            {/* CONTENT */}
            <div style={{ padding: "10px" }}>
              <h3 style={{ margin: "5px 0" }}>{product.name}</h3>

              <p
                style={{
                  color: "#2e7d32",
                  fontWeight: "bold",
                  margin: "5px 0",
                }}
              >
                RM {product.price}
              </p>

              <p style={{ fontSize: "12px", color: "#777" }}>
                {product.category}
              </p>

              {/* REMOVE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(product.savedId);
                }}
                style={{
                  marginTop: "10px",
                  padding: "6px 10px",
                  background: "#d32f2f",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default Saved;
