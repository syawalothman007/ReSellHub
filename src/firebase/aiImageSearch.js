import { getGenerativeModel } from "firebase/ai";
import { ai } from "./firebase";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MODEL_NAME = process.env.REACT_APP_GEMINI_MODEL || "gemini-2.5-flash-lite";



const imageSearchModel = getGenerativeModel(
  ai,
  {
    model: MODEL_NAME,
    generationConfig: {
    candidateCount: 1,
    maxOutputTokens: 512,
    temperature: 0.2,
    },
  },
  { timeout: 60000 }
);

const fileToGenerativePart = async (file) => {
  const base64EncodedData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

const normalizeResult = (result) => {
  const keywords = Array.isArray(result.keywords)
    ? result.keywords
        .map((keyword) => String(keyword).trim())
        .filter(Boolean)
    : [];

  return {
    productType: String(result.productType || "").trim(),
    category: String(result.category || "").trim(),
    keywords,
  };
};

export const analyzeProductImage = async (file) => {
  if (!file) {
    throw new Error("Please choose an image to search.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, JPEG, PNG, or WEBP image.");
  }

  const imagePart = await fileToGenerativePart(file);
  const prompt = `
    You are helping a second-hand marketplace.

    Look at the uploaded image.

    Identify the main product.

    Return ONLY valid JSON.

    Example:

    {
      "productType": "Laptop",
      "category": "Electronics",
      "keywords": [
        "laptop",
        "computer",
        "gaming laptop"
      ]
    }

    Rules:

    - No explanation.
    - No markdown.
    - No code block.
    - JSON only.
    `;

  const response = await imageSearchModel.generateContent([prompt, imagePart]);
  let parsedResult;

  try {
    parsedResult = JSON.parse(response.response.text());
  } catch (error) {
    console.error(response.response.text());

    throw new Error(
      "AI returned an unexpected response. Please try another image."
    );
  }
  const normalizedResult = normalizeResult(parsedResult);

  if (!normalizedResult.keywords.length && !normalizedResult.productType) {
    throw new Error("Gemini could not identify a searchable product in this image.");
  }

  return normalizedResult;
};
