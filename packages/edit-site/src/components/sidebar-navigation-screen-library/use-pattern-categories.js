/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useThemePatterns from './use-theme-patterns';

export default function usePatternCategories() {
	const { records: categories } = useEntityRecords(
		'taxonomy',
		'wp_pattern',
		{ per_page: -1, hide_empty: false, context: 'view' }
	);

	const themePatterns = useThemePatterns();
	const patternCategories = useMemo( () => {
		if ( ! categories ) {
			return [];
		}

		const categoryMap = {};
		const categoriesWithCounts = [];

		// Create a map that we can easily update category counts
		// for theme patterns that match.
		categories.forEach( ( patternCategory ) => {
			if ( ! categoryMap[ patternCategory.slug ] ) {
				categoryMap[ patternCategory.slug ] = { ...patternCategory };
			}
		} );

		themePatterns.forEach( ( pattern ) => {
			pattern.categories?.forEach( ( patternCategory ) => {
				if ( categoryMap[ patternCategory ] ) {
					categoryMap[ patternCategory ].count += 1;
				}
			} );
		} );

		categories.forEach( ( category ) => {
			if ( categoryMap[ category.slug ].count ) {
				categoriesWithCounts.push( categoryMap[ category.slug ] );
			}
		} );

		return categoriesWithCounts;
	}, [ categories, themePatterns ] );

	return { patternCategories, hasPatterns: !! patternCategories.length };
}
