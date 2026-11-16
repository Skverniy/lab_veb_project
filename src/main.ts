import type { NewRecipe, RecipeFilter, Recipe } from "./types.js";
import { fetchRecipes, createRecipeOnServer, setFavorite, deleteRecipeOnServer, updateRecipeOnServer } from "./api.js";
import { type LoadState, errorMessage } from "./state.js";
import { filterRecipes } from "./recipes.js";
import { debounce } from "./debounce.js";
import { withRetry } from "./retry.js";
import { isCategory } from "./parse.js";
import {
  searchInput, categoryFilter, favoritesOnly, recipeForm,
  recipeList, formMessage, retryButton, renderRecipes, renderMessage
} from "./ui.js";

let state: LoadState = { status: "loading" };
let controller: AbortController | undefined;

function getFilter(): RecipeFilter {
  const categoryValue = categoryFilter.value;
  return {
    query: searchInput.value,
    category: isCategory(categoryValue) ? categoryValue : "Все",
    favoritesOnly: favoritesOnly.checked
  };
}

// Утилита для обновления состояния
function updateRecipes(change: (list: Recipe[]) => Recipe[]): void {
  if (state.status !== "success") return;
  state = { status: "success", recipes: change(state.recipes) };
  render();
}

function render(): void {
  retryButton.hidden = state.status !== "error";

  if (state.status === "loading") {
    renderMessage("Загрузка рецептов...");
  } else if (state.status === "error") {
    renderMessage(state.message, true);
  } else if (state.status === "success") {
    renderRecipes(filterRecipes(state.recipes, getFilter()));
  }
}

async function init(): Promise<void> {
  state = { status: "loading" };
  render();
  try {
    const recipes = await withRetry(() => fetchRecipes(searchInput.value), 3, 1000);
    state = { status: "success", recipes };
    render();
  } catch (error: unknown) {
    state = { status: "error", message: errorMessage(error) };
    render();
  }
}

async function search(): Promise<void> {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  try {
    const recipes = await fetchRecipes(searchInput.value, signal);
    state = { status: "success", recipes };
    render();
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return; // Игнорируем отмененные запросы
    }
    state = { status: "error", message: errorMessage(error) };
    render();
  }
}

// --- СЛУШАТЕЛИ ---
searchInput.addEventListener("input", debounce(() => void search(), 300));
categoryFilter.addEventListener("change", render);
favoritesOnly.addEventListener("change", render);
retryButton.addEventListener("click", () => void init());

recipeList.addEventListener("click", async (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;
  
  const id = button.dataset.id;
  const action = button.dataset.action;
  if (!id || !action || state.status !== "success") return;

  try {
    if (action === "favorite") {
      const current = state.recipes.find(r => r.id === id);
      if (!current) return;
      const updated = await setFavorite(id, current.favorite);
      updateRecipes((list) => list.map(r => r.id === id ? { ...r, favorite: updated.favorite } : r));
    } 
    else if (action === "delete") {
      await deleteRecipeOnServer(id);
      updateRecipes((list) => list.filter(r => r.id !== id));
    }
    else if (action === "like-review") {
      const reviewId = button.dataset.reviewId;
      const current = state.recipes.find(r => r.id === id);
      const review = current?.reviews.find(r => r.id === reviewId);
      
      if (review && current) {
        const newLikes = review.isLiked ? review.likes - 1 : review.likes + 1;
        const updatedReviews = current.reviews.map(r => r.id === reviewId ? { ...r, isLiked: !r.isLiked, likes: newLikes } : r);
        const updated = await updateRecipeOnServer(id, { reviews: updatedReviews });
        updateRecipes((list) => list.map(r => r.id === id ? updated : r));
      }
    }
    else if (action === "add-review") {
      const text = prompt("Введите ваш отзыв:");
      const current = state.recipes.find(r => r.id === id);
      
      if (text && text.trim() && current) {
        const newRev = { id: crypto.randomUUID(), text: text.trim(), likes: 0, isLiked: false };
        const updatedReviews = [...current.reviews, newRev];
        const updated = await updateRecipeOnServer(id, { reviews: updatedReviews });
        updateRecipes((list) => list.map(r => r.id === id ? updated : r));
      }
    }
  } catch (error: unknown) {
    formMessage.textContent = `Не удалось выполнить действие: ${errorMessage(error)}`;
    formMessage.className = "error";
  }
});

recipeForm.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();

  const titleInput = document.querySelector<HTMLInputElement>("#recipe-title");
  const categoryInput = document.querySelector<HTMLSelectElement>("#recipe-category");
  const servingsInput = document.querySelector<HTMLInputElement>("#recipe-servings");
  const timeInput = document.querySelector<HTMLInputElement>("#recipe-time");
  const ingredientsInput = document.querySelector<HTMLTextAreaElement>("#recipe-ingredients");
  const instructionsInput = document.querySelector<HTMLTextAreaElement>("#recipe-instructions");

  if (!titleInput || !categoryInput || !servingsInput || !timeInput || !ingredientsInput || !instructionsInput) return;

  const title = titleInput.value.trim();
  const category = categoryInput.value;
  const servings = Number(servingsInput.value);
  const cookingTime = Number(timeInput.value);
  const ingredients = ingredientsInput.value.split(",").map(i => i.trim()).filter(Boolean);
  const instructions = instructionsInput.value.trim();

  if (!title || !instructions || ingredients.length === 0) {
    formMessage.textContent = "Заполните все поля формы.";
    return;
  }
  
  // Замена "as Category" на строгую проверку
  if (!isCategory(category)) {
    formMessage.textContent = "Выберите категорию из списка.";
    return;
  }

  if (!Number.isFinite(servings) || servings < 1 || servings > 30) {
    formMessage.textContent = "Количество порций должно быть от 1 до 30.";
    return;
  }
  if (!Number.isFinite(cookingTime) || cookingTime < 1 || cookingTime > 600) {
    formMessage.textContent = "Время должно быть от 1 до 600 минут.";
    return;
  }

  const draft: NewRecipe = {
    title, category, servings, cookingTime, ingredients, instructions,
    favorite: false,
    reviews: []
  };

  try {
    const created = await createRecipeOnServer(draft);
    updateRecipes((list) => [created, ...list]);
    recipeForm.reset();
    formMessage.textContent = "Рецепт добавлен.";
    formMessage.className = "success";
  } catch (error: unknown) {
    formMessage.textContent = `Не удалось сохранить рецепт: ${errorMessage(error)}`;
    formMessage.className = "error";
  }
});

void init();