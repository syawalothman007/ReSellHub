export const MAX_PRODUCT_IMAGES = 5;

export const getProductImages = (product) => {
  if (!product) return [];

  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    return product.imageUrls.filter(Boolean);
  }

  return product.imageUrl ? [product.imageUrl] : [];
};

export const getProductThumbnail = (product) => getProductImages(product)[0] || "";

export const isValidImageFile = (file) => file && file.type.startsWith("image/");
