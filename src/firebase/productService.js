import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { PRODUCT_STATUS } from "../utils/productStatus";

export const markProductAsSold = async (productId) => {
  await updateDoc(doc(db, "products", productId), {
    status: PRODUCT_STATUS.SOLD,
  });
};
