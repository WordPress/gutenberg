/**
 * WordPress dependencies
 */
// @wordpress/blocks imports are not typed.
// @ts-expect-error
import { getCategories } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import type {
	BlockExample,
	StyleBookCategory,
	CategoryExamples,
} from './types';
import {
	STYLE_BOOK_CATEGORIES,
	STYLE_BOOK_THEME_SUBCATEGORIES,
} from './constants';

/**
 * Returns category examples for a given category definition and list of examples.
 * @param {StyleBookCategory} categoryDefinition The category definition.
 * @param {BlockExample[]}    examples           An array of block examples.
 * @return {CategoryExamples|undefined} An object containing the category examples.
 */
export function getExamplesByCategory(
	categoryDefinition: StyleBookCategory,
	examples: BlockExample[]
): CategoryExamples | undefined {
	if ( ! categoryDefinition?.slug || ! examples?.length ) {
		return;
	}
	const categories: CategoryExamples[] =
		categoryDefinition?.subcategories ?? [];
	if ( categories.length ) {
		return categories.reduce(
			( acc, subcategoryDefinition ) => {
				const subcategoryExamples = getExamplesByCategory(
					subcategoryDefinition,
					examples
				);
				if ( subcategoryExamples ) {
					if ( ! acc.subcategories ) {
						acc.subcategories = [];
					}
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

/**
 * Returns category examples for a given category definition and list of examples.
 *
 * @return {StyleBookCategory[]} An array of top-level category definitions.
 */
export function getTopLevelStyleBookCategories(): StyleBookCategory[] {
	const reservedCategories = [
		...STYLE_BOOK_THEME_SUBCATEGORIES,
		...STYLE_BOOK_CATEGORIES,
	].map( ( { slug } ) => slug );
	const extraCategories: StyleBookCategory[] = getCategories();
	const extraCategoriesFiltered = extraCategories.filter(
		( { slug } ) => ! reservedCategories.includes( slug )
	);
	return [ ...STYLE_BOOK_CATEGORIES, ...extraCategoriesFiltered ];
}
