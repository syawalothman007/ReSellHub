const CATEGORY_OPTIONS = [
  "Electronics",
  "Computers & Accessories",
  "Mobile Phones & Tablets",
  "Fashion & Accessories",
  "Home & Furniture",
  "Sports & Outdoors",
  "Books & Education",
  "Gaming & Consoles",
  "Beauty & Personal Care",
  "Automotive",
  "Collectibles & Hobbies",
  "Musical Instruments",
  "Others",
];

const sortCategories = (categories) => {
  const uniqueCategories = Array.from(new Set(categories.filter(Boolean)));
  const regularCategories = uniqueCategories
    .filter((category) => category !== "Others")
    .sort((a, b) => a.localeCompare(b));

  return uniqueCategories.includes("Others")
    ? [...regularCategories, "Others"]
    : regularCategories;
};

export const PRODUCT_CATEGORIES = sortCategories(CATEGORY_OPTIONS);

export const getProductCategory = (product) => product.category || "Others";

export const getCategoryOptions = (extraCategories = []) =>
  sortCategories([...PRODUCT_CATEGORIES, ...extraCategories]);

export const getEditCategoryOptions = (currentCategory) =>
  getCategoryOptions(currentCategory ? [currentCategory] : []);
