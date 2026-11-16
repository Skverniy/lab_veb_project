import type { Recipe, NewRecipe, Review } from "./types.js";
import { parseRecipes } from "./parse.js";
import { retry } from "./utils.js";

const API_URL = "http://localhost:3001/recipes";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Сервер вернул ошибку: ${res.status}`);
  return await res.json() as T;
}

export async function fetchRecipes(): Promise<Recipe[]> {
  return retry(async () => {
    const res = await fetch(API_URL);
    const data: unknown = await handleResponse(res);
    return parseRecipes(data);
  });
}

export async function createRecipeAPI(draft: NewRecipe): Promise<Recipe> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...draft, id: crypto.randomUUID() })
  });
  return handleResponse<Recipe>(res);
}

export async function deleteRecipeAPI(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Не удалось удалить рецепт");
}

export async function updateRecipeAPI(id: string, patch: Partial<Recipe>): Promise<Recipe> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  return handleResponse<Recipe>(res);
}