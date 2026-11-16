import type { Recipe, RecipeDraft, RecipeFilter } from "./types.js";

export function filterRecipes(recipes: Recipe[], filter: RecipeFilter): Recipe[] {
  const query = filter.query.trim().toLowerCase();
  return recipes.filter((recipe) => {
    const matchesQuery = recipe.title.toLowerCase().includes(query);
    const matchesCategory = filter.category === "Все" || recipe.category === filter.category;
    const matchesFavorite = !filter.favoritesOnly || recipe.favorite;
    return matchesQuery && matchesCategory && matchesFavorite;
  });
}

export function createRecipe(draft: RecipeDraft): Recipe {
  return { ...draft, id: crypto.randomUUID(), favorite: false, reviews: [] };
}

export function toggleFavorite(recipes: Recipe[], id: string): Recipe[] {
  return recipes.map((recipe) =>
    recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe
  );
}

export function deleteRecipe(recipes: Recipe[], id: string): Recipe[] {
  return recipes.filter((recipe) => recipe.id !== id);
}


export function addReview(recipes: Recipe[], recipeId: string, text: string): Recipe[] {
  return recipes.map(recipe => {
    if (recipe.id !== recipeId) return recipe;
    const newReview = { id: crypto.randomUUID(), text, likes: 0, isLiked: false };
    return { ...recipe, reviews: [...recipe.reviews, newReview] };
  });
}

export function toggleReviewLike(recipes: Recipe[], recipeId: string, reviewId: string): Recipe[] {
  return recipes.map(recipe => {
    if (recipe.id !== recipeId) return recipe;
    const updatedReviews = recipe.reviews.map(rev => {
      if (rev.id !== reviewId) return rev;
      return {
        ...rev,
        isLiked: !rev.isLiked,
        likes: rev.isLiked ? rev.likes - 1 : rev.likes + 1
      };
    });
    return { ...recipe, reviews: updatedReviews };
  });
}