import { fetchRecipes, createRecipeAPI, deleteRecipeAPI, updateRecipeAPI } from "./api.js";
import { filterRecipes } from "./recipes.js";
import { debounce } from "./utils.js";
import { errorMessage } from "./state.js";
import { searchInput, categoryFilter, favoritesOnly, recipeForm, recipeList, formMessage, renderRecipes, renderMessage } from "./ui.js";
let state = { status: "loading" };
function getFilter() {
    return {
        query: searchInput.value,
        category: categoryFilter.value,
        favoritesOnly: favoritesOnly.checked
    };
}
function render() {
    if (state.status === "loading") {
        renderMessage("Загрузка рецептов...");
    }
    else if (state.status === "error") {
        renderMessage(state.message, true, true, init);
    }
    else if (state.status === "success") {
        renderRecipes(filterRecipes(state.recipes, getFilter()));
    }
}
async function init() {
    state = { status: "loading" };
    render();
    try {
        const recipes = await fetchRecipes();
        state = { status: "success", recipes };
        render();
    }
    catch (error) {
        state = { status: "error", message: errorMessage(error) };
        render();
    }
}
const debouncedRender = debounce(() => {
    if (state.status === "success")
        render();
}, 300);
searchInput.addEventListener("input", debouncedRender);
categoryFilter.addEventListener("change", render);
favoritesOnly.addEventListener("change", render);
recipeList.addEventListener("click", async (event) => {
    if (state.status !== "success")
        return;
    const target = event.target;
    if (!(target instanceof HTMLElement))
        return;
    const button = target.closest("button[data-action]");
    if (!button)
        return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (!id)
        return;
    const recipe = state.recipes.find(r => r.id === id);
    if (!recipe)
        return;
    try {
        if (action === "favorite") {
            const updated = await updateRecipeAPI(id, { favorite: !recipe.favorite });
            state.recipes = state.recipes.map(r => r.id === id ? updated : r);
            render();
        }
        else if (action === "delete") {
            await deleteRecipeAPI(id);
            state.recipes = state.recipes.filter(r => r.id !== id);
            render();
        }
        else if (action === "like-review") {
            const reviewId = button.dataset.reviewId;
            const review = recipe.reviews.find(r => r.id === reviewId);
            if (review) {
                const newLikes = review.isLiked ? review.likes - 1 : review.likes + 1;
                const updatedReviews = recipe.reviews.map(r => r.id === reviewId ? { ...r, isLiked: !r.isLiked, likes: newLikes } : r);
                const updated = await updateRecipeAPI(id, { reviews: updatedReviews });
                state.recipes = state.recipes.map(r => r.id === id ? updated : r);
                render();
            }
        }
        else if (action === "add-review") {
            const text = prompt("Введите ваш отзыв:");
            if (text && text.trim()) {
                const newRev = { id: crypto.randomUUID(), text: text.trim(), likes: 0, isLiked: false };
                const updated = await updateRecipeAPI(id, { reviews: [...recipe.reviews, newRev] });
                state.recipes = state.recipes.map(r => r.id === id ? updated : r);
                render();
            }
        }
    }
    catch (err) {
        alert("Ошибка при обновлении: " + errorMessage(err));
    }
});
recipeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.status !== "success")
        return;
    const titleInput = document.querySelector("#recipe-title");
    const categoryInput = document.querySelector("#recipe-category");
    const servingsInput = document.querySelector("#recipe-servings");
    const timeInput = document.querySelector("#recipe-time");
    const ingredientsInput = document.querySelector("#recipe-ingredients");
    const instructionsInput = document.querySelector("#recipe-instructions");
    if (!titleInput || !categoryInput || !servingsInput || !timeInput || !ingredientsInput || !instructionsInput)
        return;
    const title = titleInput.value.trim();
    const servings = Number(servingsInput.value);
    const cookingTime = Number(timeInput.value);
    const ingredients = ingredientsInput.value.split(",").map(i => i.trim()).filter(Boolean);
    const instructions = instructionsInput.value.trim();
    if (!title || !instructions || ingredients.length === 0) {
        formMessage.textContent = "Заполните все поля.";
        formMessage.className = "error";
        return;
    }
    const draft = {
        title,
        category: categoryInput.value,
        servings,
        cookingTime,
        ingredients,
        instructions,
        favorite: false,
        reviews: []
    };
    try {
        const newRecipe = await createRecipeAPI(draft);
        state.recipes = [newRecipe, ...state.recipes];
        recipeForm.reset();
        formMessage.textContent = "Рецепт добавлен.";
        formMessage.className = "success";
        render();
    }
    catch (err) {
        formMessage.textContent = errorMessage(err);
        formMessage.className = "error";
    }
});
void init();
