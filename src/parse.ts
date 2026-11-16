import type { Recipe, Review, Category } from "./types.js";
import { CATEGORIES } from "./types.js";

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.includes(value as Category);
}

function isReview(value: unknown): value is Review {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    typeof item.likes === "number" &&
    typeof item.isLiked === "boolean"
  );
}

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    isCategory(item.category) &&
    typeof item.servings === "number" &&
    typeof item.cookingTime === "number" &&
    Array.isArray(item.ingredients) && item.ingredients.every(x => typeof x === "string") &&
    typeof item.instructions === "string" &&
    typeof item.favorite === "boolean" &&
    Array.isArray(item.reviews) && item.reviews.every(isReview)
  );
}

export function parseRecipes(data: unknown): Recipe[] {
  if (!Array.isArray(data) || !data.every(isRecipe)) {
    throw new Error("Некорректный формат данных от сервера");
  }
  return data;
}