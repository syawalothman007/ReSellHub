import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getOrCreateChat } from "../firebase/chatService";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [product, setProduct] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        alert("Product not found");
        navigate("/");
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // 🔹 CONTACT SELLER (WHATSAPP)
  const handleContact = () => {
    const message = `Hi, I'm interested in your product: ${product.name}`;
    const url = `https://wa.me/${product.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleChatSeller = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Please login first to chat with the seller.");
      navigate("/login");
      return;
    }

    if (!product.userId) {
      alert("Seller information is missing for this product.");
      return;
    }

    if (currentUser.uid === product.userId) {
      alert("You cannot chat with yourself about your own product.");
      return;
    }

    try {
      setIsStartingChat(true);

      const chatId = await getOrCreateChat({
        buyerId: currentUser.uid,
        sellerId: product.userId,
        productId: product.id,
        productTitle: product.name,
      });

      navigate(`/messages/${chatId}`);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsStartingChat(false);
    }
  };

  // 🔹 LOADING
  if (!product) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <p>Loading product...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        background: "#f9f9f9",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "auto",
          background: "white",
          padding: "25px",
          borderRadius: "15px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        {/* 🔥 IMAGE CONTAINER (PRO VERSION) */}
        {product.imageUrl && (
          <div
            style={{
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <img
              src={product.imageUrl}
              alt=""
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        {/* 🔥 TITLE */}
        <h1 style={{ marginBottom: "10px" }}>{product.name}</h1>

        {/* 🔥 PRICE */}
        <p
          style={{
            fontSize: "22px",
            color: "#2e7d32",
            fontWeight: "bold",
          }}
        >
          RM {product.price}
        </p>

        {/* 🔥 DETAILS */}
        <div style={{ marginTop: "15px" }}>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Material:</strong> {product.material}</p>
          <p><strong>Weight:</strong> {product.weight} kg</p>
        </div>

        {/* 🔥 DESCRIPTION */}
        <div style={{ marginTop: "20px" }}>
          <h3>Description</h3>
          <p style={{ color: "#555", lineHeight: "1.6" }}>
            {product.description || "No description provided."}
          </p>
        </div>
        <div className="mb-3">
          <strong>Address:</strong>
          <p>{product.address}</p>
        </div>
        {/* 🔥 CONTACT BUTTONS */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "25px",
          }}
        >
          <button
            onClick={handleChatSeller}
            disabled={isStartingChat}
            style={{
              padding: "12px 20px",
              background: isStartingChat ? "#aaa" : "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isStartingChat ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isStartingChat ? "Opening Chat..." : "Chat Seller"}
          </button>

          <button
            onClick={handleContact}
            style={{
              padding: "12px 20px",
              background: "#f5f5f5",
              color: "#2e7d32",
              border: "1px solid #c8ddcc",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Contact Seller
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
