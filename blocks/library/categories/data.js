/**
 * Returns a jqXHR object with the categories or an error on failure.
 *
 * @returns {wp.api.collections.Categories} Returns a jqXHR object with all categories.
 */
export function getCategories() {
	const categoriesCollection = new wp.api.collections.Categories();

	const categories = categoriesCollection.fetch();

	return categories;
}

