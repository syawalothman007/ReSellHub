export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Sports & Outdoors",
  "Books & Education",
  "Automotive",
  "Hobbies & Collectibles",
  "Others",
];

const LEGACY_CATEGORY_MAP = {
  "computers & accessories": "Electronics",
  "mobile phones & tablets": "Electronics",
  "gaming & consoles": "Electronics",
  "fashion & accessories": "Fashion",
  "beauty & personal care": "Fashion",
  "home & furniture": "Home & Living",
  furniture: "Home & Living",
  "home appliances": "Home & Living",
  "fitness equipment": "Sports & Outdoors",
  books: "Books & Education",
  collectibles: "Hobbies & Collectibles",
  "collectibles & hobbies": "Hobbies & Collectibles",
  "musical instruments": "Hobbies & Collectibles",
};

const normalizeCategoryKey = (category) => (category || "").trim().toLowerCase();

export const mapCategoryToBroadCategory = (category) => {
  const trimmedCategory = (category || "").trim();
  const categoryKey = normalizeCategoryKey(trimmedCategory);

  if (!trimmedCategory) {
    return "Others";
  }

  const broadCategory = PRODUCT_CATEGORIES.find(
    (productCategory) => normalizeCategoryKey(productCategory) === categoryKey
  );

  if (broadCategory) {
    return broadCategory;
  }

  return LEGACY_CATEGORY_MAP[categoryKey] || "Others";
};

export const getProductCategory = (product) =>
  mapCategoryToBroadCategory(product?.category);

export const getCategoryOptions = (extraCategories = []) =>
  PRODUCT_CATEGORIES.filter((category) =>
    [...PRODUCT_CATEGORIES, ...extraCategories.map(mapCategoryToBroadCategory)].includes(category)
  );

export const getEditCategoryOptions = (currentCategory) =>
  getCategoryOptions(currentCategory ? [currentCategory] : []);
