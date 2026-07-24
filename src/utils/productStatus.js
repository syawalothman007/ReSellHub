export const PRODUCT_STATUS = {
  AVAILABLE: "Available",
  SOLD: "Sold",
};

export const isProductSold = (product) => product?.status === PRODUCT_STATUS.SOLD;

export const isProductAvailable = (product) => !isProductSold(product);
