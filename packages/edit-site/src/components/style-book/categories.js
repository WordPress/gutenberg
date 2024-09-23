/**
 * categoryDefinition object.
 *
 * @typedef {Object} StyleBookCategory
 *
 * @property {string} name     Object with named attributes.
 * @property {string} title    Object with named attributes.
 * @property {Array?} blocks   Object with named attributes.
 * @property {Array?} excludes Array with numeric attributes.
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
 * @property {string}                   name       Name of the category.
 * @property {string}                   title      Title of the category for the UI.
 * @property {Array<blockExamples>?}    examples   Object with named attributes.
 * @property {Array<CategoryExamples>?} categories Array with numeric attributes.
 */

/**
 * Returns category examples for a given category definition and list of examples.
 * @param {StyleBookCategory}    categoryDefinition The category definition.
 * @param {Array<blockExamples>} examples           An array of block examples.
 * @return {CategoryExamples|undefined} An object containing the category examples.
 */
export function getCategoryExamples( categoryDefinition, examples ) {
	if ( ! categoryDefinition?.name || ! examples?.length ) {
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
				name: categoryDefinition.name,
				subcategories: [],
			}
		);
	}

	const blocksToInclude = categoryDefinition?.blocks || [];
	const blocksToExclude = categoryDefinition?.exclude || [];
	const categoryExamples = examples.filter( ( example ) => {
		return (
			! blocksToExclude.includes( example.name ) &&
			( example.category === categoryDefinition.name ||
				blocksToInclude.includes( example.name ) )
		);
	} );

	if ( ! categoryExamples.length ) {
		return;
	}

	return {
		title: categoryDefinition.title,
		name: categoryDefinition.name,
		examples: categoryExamples,
	};
}
