import { useState, useEffect } from "react";
import { db, storage } from "../firebase/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { MAX_PRODUCT_IMAGES, isValidImageFile } from "../utils/productImages";
import { PRODUCT_CATEGORIES } from "../utils/categories";
import { showToast } from "../utils/toast";

function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [material, setMaterial] = useState("");
  const [condition, setCondition] = useState("");
  const [reason, setReason] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [hasPhone, setHasPhone] = useState(true);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const previews = images.map((image) => URL.createObjectURL(image));
    setImagePreviews(previews);

    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [images]);

  const handleImageChange = (event) => {
    const selectedImages = Array.from(event.target.files || []);

    if (selectedImages.length > MAX_PRODUCT_IMAGES) {
      showToast(`Please select up to ${MAX_PRODUCT_IMAGES} images.`, "error");
      event.target.value = "";
      return;
    }

    if (!selectedImages.every(isValidImageFile)) {
      showToast("Please select image files only.", "error");
      event.target.value = "";
      return;
    }

    setImages(selectedImages);
  };

  const handleAdd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().phone) {
        showToast("Please complete your profile first.", "error");
        navigate("/profile");
        return;
      }

      const phone = userSnap.data().phone;

      const imageUrls = await Promise.all(
        images.map(async (image, index) => {
          const imageRef = ref(
            storage,
            `products/${Date.now()}_${index}_${auth.currentUser.uid}_${image.name}`
          );

          await uploadBytes(imageRef, image);
          return getDownloadURL(imageRef);
        })
      );

      await addDoc(collection(db, "products"), {
        name,
        price,
        category,
        material,
        condition,
        reason,
        weight,
        description,
        imageUrls,
        userId: auth.currentUser.uid,
        phone,
        address,
      });

      showToast("Product added successfully!", "success");
      navigate("/");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    name &&
    price &&
    category &&
    material &&
    condition &&
    reason &&
    weight &&
    description &&
    address &&
    images.length > 0;

  if (!hasPhone) {
    return (
      <div className="add-product-page">
        <style>
          {`
            .add-product-page {
              padding: var(--space-xl) var(--space-lg);
              background: var(--bg-default);
              min-height: 100vh;
            }
            .missing-phone-card {
              max-width: 500px;
              margin: 10vh auto;
              text-align: center;
              padding: var(--space-2xl);
              background: var(--bg-card);
              border-radius: var(--radius-lg);
              box-shadow: var(--shadow-lg);
            }
          `}
        </style>
        <div className="missing-phone-card">
          <h2 style={{ color: "var(--text-dark)", marginBottom: "20px" }}>Profile Incomplete</h2>
          <p style={{ color: "var(--text)", marginBottom: "30px" }}>
            You need to add a phone number to your profile before you can list products. This allows buyers to contact you via WhatsApp.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/profile")}>
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-page">
      <style>
        {`
          .add-product-page {
            padding: var(--space-xl) var(--space-lg);
            background: var(--bg-default);
            min-height: 100vh;
          }
          .page-header {
            max-width: 800px;
            margin: 0 auto var(--space-xl);
            text-align: center;
          }
          .page-header h1 {
            color: var(--primary-dark);
            font-family: var(--font-title);
            font-size: 2.2rem;
            margin-bottom: var(--space-xs);
          }
          .page-header p {
            color: var(--text-muted);
            font-size: 1.05rem;
          }
          .form-container {
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--space-xl);
          }
          .form-section {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            padding: var(--space-2xl);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border);
            transition: box-shadow var(--transition-normal);
          }
          .form-section:hover {
             box-shadow: var(--shadow-md);
          }
          .form-section-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: var(--space-lg);
            padding-bottom: var(--space-sm);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--space-lg);
          }
          @media (min-width: 600px) {
            .form-grid.two-cols {
              grid-template-columns: 1fr 1fr;
            }
          }
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .form-group label {
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--text-dark);
          }
          .form-control {
            width: 100%;
            padding: 12px 14px;
            border-radius: var(--radius-md);
            border: 1.5px solid var(--border);
            background: #fff;
            color: var(--text);
            font-size: 1rem;
            transition: all var(--transition-fast);
          }
          .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
          }
          .form-control:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
          textarea.form-control {
            resize: vertical;
            min-height: 100px;
          }
          .input-with-icon {
            position: relative;
            display: flex;
            align-items: center;
          }
          .input-with-icon .input-icon {
            position: absolute;
            left: 14px;
            color: var(--text-muted);
            pointer-events: none;
            font-weight: 600;
          }
          .input-with-icon .form-control {
            padding-left: 44px;
          }
          .upload-area {
            border: 2px dashed var(--border);
            border-radius: var(--radius-md);
            padding: var(--space-2xl);
            text-align: center;
            background: #f9fafb;
            cursor: pointer;
            position: relative;
            transition: all var(--transition-fast);
          }
          .upload-area:hover, .upload-area:focus-within {
            border-color: var(--primary);
            background: var(--primary-light);
          }
          .upload-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }
          .upload-icon {
            font-size: 2.5rem;
            margin-bottom: var(--space-sm);
            display: block;
          }
          .upload-text {
            color: var(--text-dark);
            font-weight: 600;
            margin-bottom: 4px;
            display: block;
          }
          .upload-subtext {
            color: var(--text-muted);
            font-size: 0.85rem;
          }
          .image-preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: var(--space-md);
            margin-top: var(--space-lg);
          }
          .image-preview-item {
            position: relative;
            aspect-ratio: 1;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
          }
          .image-preview-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .submit-container {
            display: flex;
            justify-content: flex-end;
            margin-top: var(--space-md);
          }
          .submit-btn {
            width: 100%;
            padding: 16px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          @media (min-width: 600px) {
            .submit-btn {
              width: auto;
              min-width: 200px;
            }
          }
        `}
      </style>

      <div className="page-header">
        <h1>List an Item</h1>
        <p>Give your unused items a second life and contribute to a sustainable future.</p>
      </div>

      <form className="form-container" onSubmit={handleAdd}>
        {/* SECTION 1: Product Information */}
        <section className="form-section">
          <h2 className="form-section-title">📦 Product Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                className="form-control"
                placeholder="e.g. Ikea Nordkisa Bamboo Wardrobe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>Select a Category</option>
                {PRODUCT_CATEGORIES.map((productCategory) => (
                  <option key={productCategory} value={productCategory}>
                    {productCategory}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-control"
                placeholder="Describe your item, its features, and any flaws..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: Pricing & Condition */}
        <section className="form-section">
          <h2 className="form-section-title">🏷️ Pricing & Condition</h2>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label htmlFor="price">Selling Price</label>
              <div className="input-with-icon">
                <span className="input-icon">RM</span>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                className="form-control"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>Select</option>
                <option>New</option>
                <option>Like New</option>
                <option>Used</option>
                <option>Worn</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="reason">Reason for Selling</label>
              <select
                id="reason"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>Select</option>
                <option>Upgrade</option>
                <option>Not Used</option>
                <option>Moving</option>
                <option>Declutter</option>
                <option>Others</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 3: Sustainability Info */}
        <section className="form-section">
          <h2 className="form-section-title">🌱 Sustainability Profile</h2>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label htmlFor="material">Primary Material</label>
              <select
                id="material"
                className="form-control"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>Select</option>
                <option>Plastic</option>
                <option>Metal</option>
                <option>Wood</option>
                <option>Glass</option>
                <option>Fabric</option>
                <option>Rubber</option>
                <option>Leather</option>
                <option>Iron</option>
                <option>Others</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight(KG)</label>
              <div className="input-with-icon">
                <span className="input-icon" style={{ fontSize: '18px' }}>⚖️</span>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 1.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Contact & Location */}
        <section className="form-section">
          <h2 className="form-section-title">📍 Pickup Location</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                className="form-control"
                rows="3"
                maxLength="160"
                placeholder="Example: Block A, Jalan SS 15/4, Subang Jaya, Selangor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSubmitting}
                required
                style={{
                  borderColor: address ? "var(--primary)" : "var(--border)",
                  boxShadow: address ? "0 0 0 3px var(--primary-light)" : "none",
                }}
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginTop: "4px"
              }}>
                <span>{address ? "Address provided" : "Required before publishing"}</span>
                <span>{address.length}/160</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Images */}
        <section className="form-section">
          <h2 className="form-section-title">📸 Product Images</h2>
          <div className="form-grid">
            <div className="upload-area">
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="upload-input"
              />
              <span className="upload-icon">📁</span>
              <span className="upload-text">Drag & drop your images here</span>
              <span className="upload-subtext">or click to browse from your device. Up to {MAX_PRODUCT_IMAGES} images.</span>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={preview} className="image-preview-item">
                    <img src={preview} alt={`Product preview ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <div className="submit-container">
          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: '22px', height: '22px', borderWidth: '3px' }} />
                Publishing...
              </>
            ) : (
              <>
                Publish Listing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
