/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { CATEGORY_SLUG } from './components/category-selector';

/**
 * Helper hook that creates a Map with the core and user patterns categories
 * and removes any duplicates. It's used when we need to create new user
 * categories when creating or importing patterns.
 * This hook also provides a function to find or create a pattern category.
 *
 * @return {Object} The merged categories map and the callback function to find or create a category.
 */
export function useAddPatternCategory() {
	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { corePatternCategories, userPatternCategories } = useSelect(
		( select ) => {
			const { getUserPatternCategories, getBlockPatternCategories } =
				select( coreStore );

			return {
				corePatternCategories: getBlockPatternCategories(),
				userPatternCategories: getUserPatternCategories(),
			};
		},
		[]
	);
	const categoryMap = useMemo( () => {
		// Merge the user and core pattern categories and remove any duplicates.
		const uniqueCategories = new Map();
		userPatternCategories.forEach( ( category ) => {
			uniqueCategories.set( category.label.toLowerCase(), {
				label: category.label,
				name: category.name,
				id: category.id,
			} );
		} );

		corePatternCategories.forEach( ( category ) => {
			if (
				! uniqueCategories.has( category.label.toLowerCase() ) &&
				// There are two core categories with `Post` label so explicitly remove the one with
				// the `query` slug to avoid any confusion.
				category.name !== 'query'
			) {
				uniqueCategories.set( category.label.toLowerCase(), {
					label: category.label,
					name: category.name,
				} );
			}
		} );
		return uniqueCategories;
	}, [ userPatternCategories, corePatternCategories ] );

	async function findOrCreateTerm( term ) {
		try {
			const existingTerm = categoryMap.get( term.toLowerCase() );
			if ( existingTerm?.id ) {
				return existingTerm.id;
			}
			// If we have an existing core category we need to match the new user category to the
			// correct slug rather than autogenerating it to prevent duplicates, eg. the core `Headers`
			// category uses the singular `header` as the slug.
			const termData = existingTerm
				? { name: existingTerm.label, slug: existingTerm.name }
				: { name: term };
			const newTerm = await saveEntityRecord(
				'taxonomy',
				CATEGORY_SLUG,
				termData,
				{ throwOnError: true }
			);
			invalidateResolution( 'getUserPatternCategories' );
			return newTerm.id;
		} catch ( error ) {
			if ( error.code !== 'term_exists' ) {
				throw error;
			}
			return error.data.term_id;
		}
	}

	return { categoryMap, findOrCreateTerm };
}
