export function filterRecipes(recipes, filter) {
    const query = filter.query.trim().toLowerCase();
    return recipes.filter((recipe) => {
        const matchesQuery = recipe.title.toLowerCase().includes(query);
        const matchesCategory = filter.category === "Все" || recipe.category === filter.category;
        const matchesFavorite = !filter.favoritesOnly || recipe.favorite;
        return matchesQuery && matchesCategory && matchesFavorite;
    });
}
export function createRecipe(draft) {
    return { ...draft, id: crypto.randomUUID(), favorite: false, reviews: [] };
}
export function toggleFavorite(recipes, id) {
    return recipes.map((recipe) => recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe);
}
export function deleteRecipe(recipes, id) {
    return recipes.filter((recipe) => recipe.id !== id);
}
export function addReview(recipes, recipeId, text) {
    return recipes.map(recipe => {
        if (recipe.id !== recipeId)
            return recipe;
        const newReview = { id: crypto.randomUUID(), text, likes: 0, isLiked: false };
        return { ...recipe, reviews: [...recipe.reviews, newReview] };
    });
}
export function toggleReviewLike(recipes, recipeId, reviewId) {
    return recipes.map(recipe => {
        if (recipe.id !== recipeId)
            return recipe;
        const updatedReviews = recipe.reviews.map(rev => {
            if (rev.id !== reviewId)
                return rev;
            return {
                ...rev,
                isLiked: !rev.isLiked,
                likes: rev.isLiked ? rev.likes - 1 : rev.likes + 1
            };
        });
        return { ...recipe, reviews: updatedReviews };
    });
}
