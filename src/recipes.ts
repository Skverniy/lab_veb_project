import type { Recipe, RecipeFilter } from "./types.js";

export function filterRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  const query = filter.query.trim().toLowerCase();
  return recipes.filter((recipe) => {
    const matchesQuery = recipe.title.toLowerCase().includes(query);
    const matchesCategory = filter.category === "Все" || recipe.category === filter.category;
    const matchesFavorite = !filter.favoritesOnly || recipe.favorite;
    return matchesQuery && matchesCategory && matchesFavorite;
  });
}