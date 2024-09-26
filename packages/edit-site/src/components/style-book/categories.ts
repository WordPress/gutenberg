/**
 * Internal dependencies
 */
import type {
	BlockExample,
	StyleBookCategory,
	CategoryExamples,
} from './types';

/**
 * Returns category examples for a given category definition and list of examples.
 * @param {StyleBookCategory} categoryDefinition The category definition.
 * @param {BlockExample[]}    examples           An array of block examples.
 * @return {CategoryExamples|undefined} An object containing the category examples.
 */
export function getCategoryExamples(
	categoryDefinition: StyleBookCategory,
	examples: BlockExample[]
): CategoryExamples | undefined {
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
