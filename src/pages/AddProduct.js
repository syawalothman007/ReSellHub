import { useState, useEffect } from "react";
import { db, storage } from "../firebase/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState(""); // ✅ NEW
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [condition, setCondition] = useState(""); // ✅ NEW
  const [reason, setReason] = useState(""); // ✅ NEW
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [hasPhone, setHasPhone] = useState(true);
  const [address, setAddress] = useState("");

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const checkProfile = async () => {
      if (!auth.currentUser) return;

      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().phone) {
        setHasPhone(false);
      }
    };

    checkProfile();
  }, [auth.currentUser]);

  const handleAdd = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().phone) {
        alert("Please complete your profile first.");
        navigate("/profile");
        return;
      }

      const phone = userSnap.data().phone;

      let imageUrl = "";

      if (image) {
        const imageRef = ref(storage, `products/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "products"), {
        name,
        price,
        originalPrice, // ✅ NEW
        category,
        material,
        condition, // ✅ NEW
        reason, // ✅ NEW
        weight,
        description,
        imageUrl,
        userId: auth.currentUser.uid,
        phone,
        address, // ✅ NEW
      });

      alert("Product added!");
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  const isFormValid =
    name &&
    price &&
    originalPrice &&
    category &&
    material &&
    condition &&
    reason &&
    weight &&
    description &&
    address &&
    image;

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginBottom: "15px",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    marginBottom: "6px",
  };

  const addressBoxStyle = {
    background: "#f3faf4",
    border: "1px solid #d8eadb",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "18px",
  };

  if (!hasPhone) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <h2>Please complete your profile first</h2>
        <button onClick={() => navigate("/profile")}>
          Go to Profile
        </button>
      </div>
    );
  }

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
          Add Product
        </h1>

        <label>Product Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        <label>Selling Price (RM)</label>
        <input value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />

        <label>Original Price (RM)</label>
        <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} style={inputStyle} />

        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option value="">Select</option>
          <option>Electronics</option>
          <option>Furniture</option>
          <option>Clothing</option>
          <option>Others</option>
        </select>

        <label>Material</label>
        <select value={material} onChange={(e) => setMaterial(e.target.value)} style={inputStyle}>
          <option value="">Select</option>
          <option>Plastic</option>
          <option>Metal</option>
          <option>Wood</option>
          <option>Glass</option>
          <option>Fabric</option>
          <option>Others</option>
        </select>

        <label>Condition</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} style={inputStyle}>
          <option value="">Select</option>
          <option>New</option>
          <option>Like New</option>
          <option>Used</option>
          <option>Worn</option>
        </select>

        <label>Reason for Selling</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} style={inputStyle}>
          <option value="">Select</option>
          <option>Upgrade</option>
          <option>Not Used</option>
          <option>Moving</option>
          <option>Declutter</option>
          <option>Others</option>
        </select>

        <label>Weight (kg)</label>
        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />

        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, height: "80px" }} />

        <div style={addressBoxStyle}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}>
            <span
              aria-hidden="true"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#2e7d32",
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
              }}
            >
              &#9906;
            </span>
            <div>
              <label htmlFor="product-address" style={{ ...labelStyle, marginBottom: "2px" }}>
                Pickup Address
              </label>
              <p style={{
                color: "#5f6f62",
                fontSize: "13px",
                margin: 0,
              }}>
                Share where buyers can collect the item.
              </p>
            </div>
          </div>

          <textarea
            id="product-address"
            rows="4"
            maxLength="160"
            placeholder="Example: Block A, Jalan SS 15/4, Subang Jaya, Selangor"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={{
              ...inputStyle,
              minHeight: "96px",
              resize: "vertical",
              marginBottom: "8px",
              background: "white",
              borderColor: address ? "#8bc48f" : "#c8ddcc",
              boxShadow: address
                ? "0 0 0 3px rgba(46, 125, 50, 0.08)"
                : "none",
            }}
          />

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            color: "#6b776d",
            fontSize: "12px",
          }}>
            <span>{address ? "Address added" : "Required before publishing"}</span>
            <span>{address.length}/160</span>
          </div>
        </div>

        <label>Product Image</label>
        <input type="file" onChange={(e) => setImage(e.target.files[0])} style={{ marginBottom: "20px" }} />

        <button
          onClick={handleAdd}
          disabled={!isFormValid}
          style={{
            width: "100%",
            padding: "12px",
            background: isFormValid ? "#2e7d32" : "#aaa",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isFormValid ? "pointer" : "not-allowed",
          }}
        >
          Add Product
        </button>
      </div>
    </div>
  );
}

export default AddProduct;
