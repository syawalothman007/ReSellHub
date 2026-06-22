import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function MyProducts() {
  const [products, setProducts] = useState([]);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!auth.currentUser) return;

      const snapshot = await getDocs(collection(db, "products"));

      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.userId === auth.currentUser.uid);

      setProducts(data);
    };

    fetchProducts();
  }, [auth.currentUser]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "products", id));

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{
      padding: "30px",
      background: "#f9f9f9",
      minHeight: "100vh"
    }}>
      <div style={{
        maxWidth: "800px",
        margin: "auto"
      }}>
        <h1 style={{
          color: "#2e7d32",
          marginBottom: "20px"
        }}>
          My Products
        </h1>

        {products.length === 0 && (
          <p style={{ color: "#777" }}>No products Listed.</p>
        )}

        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "white",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
              transition: "0.2s"
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.01)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt=""
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />
              )}

              <div>
                <h3 style={{ margin: 0 }}>{product.name}</h3>

                <p style={{
                  margin: "5px 0",
                  color: "#2e7d32",
                  fontWeight: "bold"
                }}>
                  RM {product.price}
                </p>

                <p style={{ margin: 0, fontSize: "12px", color: "#777" }}>
                  {product.category}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
  
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/edit/${product.id}`);
                }}
                style={{
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product.id);
                }}
                style={{
                  background: "#d32f2f",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Delete
              </button>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyProducts;