import { parseRecipes } from "./parse.js";
import { retry } from "./utils.js";
const API_URL = "http://localhost:3001/recipes";
async function handleResponse(res) {
    if (!res.ok)
        throw new Error(`Сервер вернул ошибку: ${res.status}`);
    return await res.json();
}
export async function fetchRecipes() {
    return retry(async () => {
        const res = await fetch(API_URL);
        const data = await handleResponse(res);
        return parseRecipes(data);
    });
}
export async function createRecipeAPI(draft) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id: crypto.randomUUID() })
    });
    return handleResponse(res);
}
export async function deleteRecipeAPI(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok)
        throw new Error("Не удалось удалить рецепт");
}
export async function updateRecipeAPI(id, patch) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
    });
    return handleResponse(res);
}
