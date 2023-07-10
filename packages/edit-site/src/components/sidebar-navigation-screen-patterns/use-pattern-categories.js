/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDefaultPatternCategories from './use-default-pattern-categories';
import useThemePatterns from './use-theme-patterns';

export default function usePatternCategories() {
	const defaultCategories = useDefaultPatternCategories();
	const themePatterns = useThemePatterns();

	const patternCategories = useMemo( () => {
		const categoryMap = {};
		const categoriesWithCounts = [];

		// Create a map for easier counting of patterns in categories.
		defaultCategories.forEach( ( category ) => {
			if ( ! categoryMap[ category.name ] ) {
				categoryMap[ category.name ] = { ...category, count: 0 };
			}
		} );

		// Update the category counts to reflect theme registered patterns.
		themePatterns.forEach( ( pattern ) => {
			pattern.categories?.forEach( ( category ) => {
				if ( categoryMap[ category ] ) {
					categoryMap[ category ].count += 1;
				}
			} );
		} );

		// Filter categories so we only have those containing patterns.
		defaultCategories.forEach( ( category ) => {
			if ( categoryMap[ category.name ].count ) {
				categoriesWithCounts.push( categoryMap[ category.name ] );
			}
		} );

		return categoriesWithCounts;
	}, [ defaultCategories, themePatterns ] );

	return { patternCategories, hasPatterns: !! patternCategories.length };
}
