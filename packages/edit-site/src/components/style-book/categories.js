/**
 * categoryDefinition object.
 *
 * @typedef {Object} StyleBookCategory
 *
 * @property {string} slug     Category identifier.
 * @property {string} title    Category title/label.
 * @property {Array?} blocks   Array of block names to include in the category. Used when blocks are not included in the category by default.
 * @property {Array?} excludes Array of blocks to exclude from the category. Used when blocks are included in the category by default.
 */

/**
 * blockExamples object.
 *
 * @typedef {Object} blockExamples
 *
 * @property {string} name     Block name, e.g., "core/paragraph".
 * @property {string} title    Block title/label.
 * @property {string} category Block category.
 * @property {Object} blocks   Block object.
 */

/**
 * getCategoryExamples return value.
 *
 * @typedef {Object} CategoryExamples
 *
 * @property {string}                   slug          Category identifier.
 * @property {string}                   title         Category title/label.
 * @property {Array<blockExamples>?}    examples      Array of block examples.
 * @property {Array<CategoryExamples>?} subcategories Array of subcategory examples.
 */

/**
 * Returns category examples for a given category definition and list of examples.
 * @param {StyleBookCategory}    categoryDefinition The category definition.
 * @param {Array<blockExamples>} examples           An array of block examples.
 * @return {CategoryExamples|undefined} An object containing the category examples.
 */
export function getCategoryExamples( categoryDefinition, examples ) {
	if ( ! categoryDefinition?.slug || ! examples?.length ) {
		return;
	}

	if ( categoryDefinition?.subcategories?.length ) {
		return categoryDefinition.subcategories.reduce(
			( acc, subcategoryDefinition ) => {
				const subcategoryExamples = getCategoryExamples(
					subcategoryDefinition,
					examples
				);
				if ( subcategoryExamples ) {
					acc.subcategories = [
						...acc.subcategories,
						subcategoryExamples,
					];
				}
				return acc;
			},
			{
				title: categoryDefinition.title,
				slug: categoryDefinition.slug,
				subcategories: [],
			}
		);
	}

	const blocksToInclude = categoryDefinition?.blocks || [];
	const blocksToExclude = categoryDefinition?.exclude || [];
	const categoryExamples = examples.filter( ( example ) => {
		return (
			! blocksToExclude.includes( example.name ) &&
			( example.category === categoryDefinition.slug ||
				blocksToInclude.includes( example.name ) )
		);
	} );

	if ( ! categoryExamples.length ) {
		return;
	}

	return {
		title: categoryDefinition.title,
		slug: categoryDefinition.slug,
		examples: categoryExamples,
	};
}
