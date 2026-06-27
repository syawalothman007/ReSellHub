import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getOrCreateChat } from "../firebase/chatService";
import { getProductImages } from "../utils/productImages";
import { getProductCategory } from "../utils/categories";
import { showToast } from "../utils/toast";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() };
        const productImages = getProductImages(productData);

        setProduct(productData);
        setSelectedImage(productImages[0] || "");
      } else {
        showToast("Product not found.", "error");
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
      showToast("Please login first to chat with the seller.", "error");
      navigate("/login");
      return;
    }

    if (!product.userId) {
      showToast("Seller information is missing for this product.", "error");
      return;
    }

    if (currentUser.uid === product.userId) {
      showToast("You cannot chat with yourself about your own product.", "error");
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
      showToast(error.message || "Failed to start chat.", "error");
    } finally {
      setIsStartingChat(false);
    }
  };

  const productImages = product ? getProductImages(product) : [];
  const mainImage = selectedImage || productImages[0];

  return (
    <div className="product-detail-page">
      <style>
        {`
          .product-detail-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--space-xl) var(--space-lg);
          }
          
          .product-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--space-2xl);
            background: var(--bg-card);
            padding: var(--space-2xl);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-premium);
            border: 1px solid var(--border);
          }
          
          @media (min-width: 900px) {
            .product-container {
              grid-template-columns: 1fr 1fr;
            }
          }
          
          .gallery-section {
            display: flex;
            flex-direction: column;
            gap: var(--space-md);
          }
          
          .main-image-container {
            width: 100%;
            height: 500px;
            background: #f9fafb;
            border-radius: var(--radius-md);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
          }
          
          .main-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: var(--radius-md);
          }
          
          .thumbnail-list {
            display: flex;
            gap: var(--space-sm);
            overflow-x: auto;
            padding-bottom: var(--space-xs);
            scrollbar-width: thin;
          }
          
          .thumbnail-btn {
            flex: 0 0 80px;
            height: 80px;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all var(--transition-fast);
            background: #f9fafb;
            padding: 0;
          }
          
          .thumbnail-btn.active {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-light);
          }
          
          .thumbnail-btn img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .info-section {
            display: flex;
            flex-direction: column;
          }
          
          .product-title {
            font-family: var(--font-title);
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: var(--space-xs);
            line-height: 1.2;
          }
          
          .product-price {
            font-size: 2rem;
            font-weight: 800;
            color: var(--primary-dark);
            margin-bottom: var(--space-lg);
          }
          
          .specs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-md);
            margin-bottom: var(--space-xl);
            background: #f9fafb;
            padding: var(--space-lg);
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
          }
          
          .spec-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .spec-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          .spec-value {
            font-weight: 600;
            color: var(--text);
            font-size: 1.05rem;
          }
          
          .section-subtitle {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: var(--space-sm);
            color: var(--text-dark);
          }
          
          .product-description {
            color: var(--text);
            line-height: 1.7;
            margin-bottom: var(--space-xl);
            white-space: pre-wrap;
          }
          
          .product-address {
            color: var(--text);
            line-height: 1.5;
            margin-bottom: var(--space-xl);
          }
          
          .action-buttons {
            display: flex;
            gap: var(--space-md);
            flex-wrap: wrap;
            margin-top: auto;
          }
          
          .action-buttons .btn {
            flex: 1;
            min-width: 200px;
            padding: 16px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .skeleton-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--space-2xl);
          }
          
          @media (min-width: 900px) {
            .skeleton-container {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}
      </style>

      {!product ? (
        <div className="product-container skeleton-container">
          <div className="skeleton" style={{ height: '500px', borderRadius: 'var(--radius-md)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="skeleton" style={{ height: '50px', width: '80%' }} />
            <div className="skeleton" style={{ height: '40px', width: '40%' }} />
            <div className="skeleton" style={{ height: '120px', width: '100%', borderRadius: 'var(--radius-md)' }} />
            <div className="skeleton" style={{ height: '20px', width: '100%' }} />
            <div className="skeleton" style={{ height: '20px', width: '90%' }} />
            <div className="skeleton" style={{ height: '20px', width: '95%' }} />
          </div>
        </div>
      ) : (
        <div className="product-container">
          <div className="gallery-section">
            {mainImage && (
              <div className="main-image-container">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="main-image"
                />
              </div>
            )}
            
            {productImages.length > 1 && (
              <div className="thumbnail-list">
                {productImages.map((imageUrl, index) => (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`thumbnail-btn ${imageUrl === mainImage ? "active" : ""}`}
                    aria-label={`Show product image ${index + 1}`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} thumbnail ${index + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="info-section">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-price">RM {product.price}</p>

            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-label">Category</span>
                <span className="spec-value">{getProductCategory(product)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Condition</span>
                <span className="spec-value">{product.condition || "Not specified"}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Material</span>
                <span className="spec-value">{product.material || "N/A"}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Weight</span>
                <span className="spec-value">{product.weight ? `${product.weight} kg` : "N/A"}</span>
              </div>
              <div className="spec-item" style={{ gridColumn: "1 / -1" }}>
                <span className="spec-label">Reason for Selling</span>
                <span className="spec-value">{product.reason || "Not specified"}</span>
              </div>
            </div>

            <div className="product-description-container">
              <h3 className="section-subtitle">Description</h3>
              <p className="product-description">
                {product.description || "No description provided."}
              </p>
            </div>

            {product.address && (
              <div className="product-address-container">
                <h3 className="section-subtitle">Location</h3>
                <p className="product-address">{product.address}</p>
              </div>
            )}

            <div className="action-buttons">
              <button
                onClick={handleChatSeller}
                disabled={isStartingChat}
                className="btn btn-primary"
              >
                {isStartingChat ? (
                  <>
                    <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    Opening...
                  </>
                ) : (
                  <>
                    💬 Chat Seller
                  </>
                )}
              </button>

              <button
                onClick={handleContact}
                className="btn btn-outline"
              >
                📱 WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
