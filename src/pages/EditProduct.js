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

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const productData = docSnap.data();
        setProduct({
          ...productData,
          category: getProductCategory(productData),
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
      alert(`Products can have up to ${MAX_PRODUCT_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    if (!selectedImages.every(isValidImageFile)) {
      alert("Please select image files only.");
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

  const handleUpdate = async () => {
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

  const imageGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
    gap: "10px",
    marginBottom: "18px",
  };

  const imageWrapperStyle = {
    position: "relative",
    aspectRatio: "1 / 1",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #dfeade",
    background: "#f5f5f5",
  };

  const removeButtonStyle = {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(211,47,47,0.92)",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    lineHeight: "26px",
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

        <label>Product Name</label>
        <input
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          style={inputStyle}
        />

        <label>Price (RM)</label>
        <input
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          style={inputStyle}
        />

        <label>Category</label>
        <select
          value={product.category}
          onChange={(e) => setProduct({ ...product, category: e.target.value })}
          style={inputStyle}
        >
          <option value="">Select a Category</option>
          {PRODUCT_CATEGORIES.map((productCategory) => (
            <option key={productCategory} value={productCategory}>
              {productCategory}
            </option>
          ))}
        </select>

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

        <label>Weight (kg)</label>
        <input
          type="number"
          value={product.weight}
          onChange={(e) => setProduct({ ...product, weight: e.target.value })}
          style={inputStyle}
        />

        <label>Description</label>
        <textarea
          value={product.description}
          onChange={(e) =>
            setProduct({ ...product, description: e.target.value })
          }
          style={{ ...inputStyle, height: "80px", resize: "none" }}
        />

        <label>Existing Images</label>
        {existingImages.length === 0 ? (
          <p style={{ color: "#777", fontSize: "13px" }}>
            No product images yet.
          </p>
        ) : (
          <div style={imageGridStyle}>
            {existingImages.map((imageUrl, index) => (
              <div key={imageUrl} style={imageWrapperStyle}>
                <img
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(imageUrl)}
                  style={removeButtonStyle}
                  aria-label="Remove image"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        <label>Add Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleNewImagesChange}
          disabled={existingImages.length >= MAX_PRODUCT_IMAGES}
          style={{ marginBottom: "10px" }}
        />
        <p style={{ color: "#777", fontSize: "12px", marginTop: 0 }}>
          {existingImages.length + newImages.length}/{MAX_PRODUCT_IMAGES} images selected.
        </p>

        {newImagePreviews.length > 0 && (
          <div style={imageGridStyle}>
            {newImagePreviews.map((preview, index) => (
              <div key={preview} style={imageWrapperStyle}>
                <img
                  src={preview}
                  alt={`New product ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(index)}
                  style={removeButtonStyle}
                  aria-label="Remove selected image"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

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
