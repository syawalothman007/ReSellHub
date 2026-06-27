import { useEffect, useState } from "react";
import { db, storage } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { useParams, useNavigate } from "react-router-dom";
import {
  MAX_PRODUCT_IMAGES,
  getProductImages,
  isValidImageFile,
} from "../utils/productImages";
import { PRODUCT_CATEGORIES, getProductCategory } from "../utils/categories";
import { showToast } from "../utils/toast";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const productData = docSnap.data();
        setProduct({
          ...productData,
          category: getProductCategory(productData) || "",
          condition: productData.condition || "",
          reason: productData.reason || "",
          address: productData.address || "",
        });
        setExistingImages(getProductImages(productData));
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const previews = newImages.map((image) => URL.createObjectURL(image));
    setNewImagePreviews(previews);

    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [newImages]);

  const handleNewImagesChange = (event) => {
    const selectedImages = Array.from(event.target.files || []);
    const totalImages = existingImages.length + selectedImages.length;

    if (totalImages > MAX_PRODUCT_IMAGES) {
      showToast(`Products can have up to ${MAX_PRODUCT_IMAGES} images.`, "error");
      event.target.value = "";
      return;
    }

    if (!selectedImages.every(isValidImageFile)) {
      showToast("Please select image files only.", "error");
      event.target.value = "";
      return;
    }

    setNewImages(selectedImages);
  };

  const handleRemoveExistingImage = (imageUrl) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
    setRemovedImageUrls((prev) =>
      prev.includes(imageUrl) ? prev : [...prev, imageUrl]
    );
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setNewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const docRef = doc(db, "products", id);

      const uploadedImageUrls = await Promise.all(
        newImages.map(async (image, index) => {
          const imageRef = storageRef(
            storage,
            `products/${Date.now()}_${index}_${image.name}`
          );

          await uploadBytes(imageRef, image);
          return getDownloadURL(imageRef);
        })
      );

      const imageUrls = [...existingImages, ...uploadedImageUrls].slice(
        0,
        MAX_PRODUCT_IMAGES
      );

      await updateDoc(docRef, {
        ...product,
        imageUrls,
        imageUrl: imageUrls[0] || "",
      });

      await Promise.allSettled(
        removedImageUrls.map((imageUrl) => deleteObject(storageRef(storage, imageUrl)))
      );

      showToast("Product updated successfully!", "success");
      navigate("/my-products");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    product &&
    product.name &&
    product.price &&
    product.category &&
    product.material &&
    product.condition &&
    product.reason &&
    product.weight &&
    product.description &&
    product.address &&
    (existingImages.length + newImages.length) > 0;

  if (!product) {
    return (
      <div className="edit-product-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <span className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      <style>
        {`
          .edit-product-page {
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
          .remove-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: none;
            background: rgba(220, 38, 38, 0.9);
            color: white;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: background var(--transition-fast);
          }
          .remove-btn:hover {
            background: rgb(220, 38, 38);
          }
          .button-group {
            display: flex;
            justify-content: flex-end;
            gap: var(--space-md);
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
          .cancel-btn {
            width: 100%;
            padding: 16px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e5e7eb;
            color: #374151;
            border: 1px solid #d1d5db;
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-fast);
          }
          .cancel-btn:hover {
            background: #d1d5db;
          }
          @media (min-width: 600px) {
            .submit-btn, .cancel-btn {
              width: auto;
              min-width: 160px;
            }
          }
        `}
      </style>

      <div className="page-header">
        <h1>Edit Listing</h1>
        <p>Update your listing details to keep them accurate and attractive for buyers.</p>
      </div>

      <form className="form-container" onSubmit={handleUpdate}>
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
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="form-control"
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
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
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
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
                  value={product.price}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
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
                value={product.condition}
                onChange={(e) => setProduct({ ...product, condition: e.target.value })}
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
                value={product.reason}
                onChange={(e) => setProduct({ ...product, reason: e.target.value })}
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
                value={product.material}
                onChange={(e) => setProduct({ ...product, material: e.target.value })}
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
              <label htmlFor="weight">Weight (KG)</label>
              <div className="input-with-icon">
                <span className="input-icon" style={{ fontSize: '18px' }}>⚖️</span>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  placeholder="e.g. 1.5"
                  value={product.weight}
                  onChange={(e) => setProduct({ ...product, weight: e.target.value })}
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
                value={product.address}
                onChange={(e) => setProduct({ ...product, address: e.target.value })}
                disabled={isSubmitting}
                required
                style={{
                  borderColor: product.address ? "var(--primary)" : "var(--border)",
                  boxShadow: product.address ? "0 0 0 3px var(--primary-light)" : "none",
                }}
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginTop: "4px"
              }}>
                <span>{product.address ? "Address provided" : "Required before publishing"}</span>
                <span>{product.address.length}/160</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Images */}
        <section className="form-section">
          <h2 className="form-section-title">📸 Product Images</h2>
          <div className="form-grid">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="form-group">
                <label>Existing Images</label>
                <div className="image-preview-grid">
                  {existingImages.map((imageUrl) => (
                    <div key={imageUrl} className="image-preview-item">
                      <img src={imageUrl} alt="Existing product layout" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imageUrl)}
                        className="remove-btn"
                        aria-label="Remove image"
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div className="form-group">
              <label>Add New Images</label>
              <div className="upload-area">
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImagesChange}
                  disabled={existingImages.length >= MAX_PRODUCT_IMAGES || isSubmitting}
                  className="upload-input"
                />
                <span className="upload-icon">📁</span>
                <span className="upload-text">Drag & drop new images here</span>
                <span className="upload-subtext">
                  or click to browse. Max {MAX_PRODUCT_IMAGES} images total ({existingImages.length + newImages.length} selected).
                </span>
              </div>
            </div>

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div className="form-group">
                <label>New Image Previews</label>
                <div className="image-preview-grid">
                  {newImagePreviews.map((preview, index) => (
                    <div key={preview} className="image-preview-item">
                      <img src={preview} alt={`New upload preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="remove-btn"
                        aria-label="Remove selected image"
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SUBMIT & CANCEL BUTTONS */}
        <div className="button-group">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/my-products")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: '22px', height: '22px', borderWidth: '3px' }} />
                Saving...
              </>
            ) : (
              <>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
