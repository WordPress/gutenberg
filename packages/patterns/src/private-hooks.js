/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Helper hook that creates a Map with the core and user patterns categories
 * and removes any duplicates. It's used when we need to create new user
 * categories when creating or importing patterns.
 *
 * @return {Map} The merged categories.
 */
export function usePatternCategoriesMap() {
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
	return useMemo( () => {
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
}
