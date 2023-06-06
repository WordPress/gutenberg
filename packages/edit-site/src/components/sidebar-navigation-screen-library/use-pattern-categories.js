/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
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

	// We're collecting the both user & theme patterns along with the taxonomy
	// categories so that we can recalculate the category counts to reflect
	// merged patterns, additions, or deletions.
	const themePatterns = useThemePatterns();
	const userPatterns = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_block', {
				per_page: -1,
			} ),
		[]
	);

	const patternCategories = useMemo( () => {
		if ( ! categories ) {
			return [];
		}

		const categoryMap = {};
		const categoriesWithCounts = [];

		// Create a map that we can easily update category counts
		// for both user and theme patterns that match.
		categories.forEach( ( patternCategory ) => {
			if ( ! categoryMap[ patternCategory.id ] ) {
				const category = { ...patternCategory, count: 0 };
				categoryMap[ category.id ] = category;
				categoryMap[ category.slug ] = category;
			}
		} );

		( userPatterns || [] ).forEach( ( pattern ) => {
			pattern.wp_pattern?.forEach( ( categoryId ) => {
				if ( categoryMap[ categoryId ] ) {
					categoryMap[ categoryId ].count += 1;
				}
			} );
		} );

		themePatterns.forEach( ( pattern ) => {
			pattern.categories?.forEach( ( patternCategory ) => {
				if ( categoryMap[ patternCategory ] ) {
					categoryMap[ patternCategory ].count += 1;
				}
			} );
		} );

		categories.forEach( ( category ) => {
			if ( categoryMap[ category.id ].count ) {
				categoriesWithCounts.push( categoryMap[ category.id ] );
			}
		} );

		return categoriesWithCounts;
	}, [ categories, themePatterns, userPatterns ] );

	return { patternCategories, hasPatterns: !! patternCategories.length };
}
