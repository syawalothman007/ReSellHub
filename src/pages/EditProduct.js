import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProduct(docSnap.data());
      }
    };

    fetchProduct();
  }, [id]);

  const handleUpdate = async () => {
    const docRef = doc(db, "products", id);

    await updateDoc(docRef, product);

    alert("Product updated!");
    navigate("/my-products");
  };

  if (!product) return <p style={{ padding: "30px" }}>Loading...</p>;

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  };

  return (
    <div style={{ padding: "30px", background: "#f9f9f9", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "500px",
        margin: "auto",
        background: "white",
        padding: "25px",
        borderRadius: "15px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
      }}>
        <h1 style={{ color: "#2e7d32", marginBottom: "20px" }}>
          Edit Product
        </h1>

        {/* NAME */}
        <label>Product Name</label>
        <input
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          style={inputStyle}
        />

        {/* PRICE */}
        <label>Price (RM)</label>
        <input
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          style={inputStyle}
        />

        {/* CATEGORY */}
        <label>Category</label>
        <select
          value={product.category}
          onChange={(e) => setProduct({ ...product, category: e.target.value })}
          style={inputStyle}
        >
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          <option value="Clothing">Clothing</option>
          <option value="Others">Others</option>
        </select>

        {/* MATERIAL */}
        <label>Material Type</label>
        <select
          value={product.material}
          onChange={(e) => setProduct({ ...product, material: e.target.value })}
          style={inputStyle}
        >
          <option value="Plastic">Plastic</option>
          <option value="Metal">Metal</option>
          <option value="Wood">Wood</option>
          <option value="Glass">Glass</option>
          <option value="Fabric">Fabric</option>
          <option value="Others">Others</option>
        </select>

        {/* WEIGHT */}
        <label>Weight (kg)</label>
        <input
          type="number"
          value={product.weight}
          onChange={(e) => setProduct({ ...product, weight: e.target.value })}
          style={inputStyle}
        />

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          value={product.description}
          onChange={(e) =>
            setProduct({ ...product, description: e.target.value })
          }
          style={{ ...inputStyle, height: "80px", resize: "none" }}
        />

        {/* BUTTON */}
        <button
          onClick={handleUpdate}
          style={{
            width: "100%",
            padding: "12px",
            background: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Update Product
        </button>
      </div>
    </div>
  );
}

export default EditProduct;