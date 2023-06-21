/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useDefaultPatternCategories from './use-default-pattern-categories';
import useThemePatterns from './use-theme-patterns';

export default function usePatternCategories() {
	const defaultCategories = useDefaultPatternCategories();
	const themePatterns = useThemePatterns();
	const userPatterns = useSelect( ( select ) =>
		select( coreStore ).getEntityRecords( 'postType', 'wp_block', {
			per_page: -1,
		} )
	);

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

		// Add "Your Patterns" category for user patterns if there are any.
		if ( userPatterns?.length ) {
			categoriesWithCounts.push( {
				count: userPatterns.length || 0,
				name: 'custom-patterns',
				label: __( 'Custom patterns' ),
			} );
		}

		return categoriesWithCounts;
	}, [ defaultCategories, themePatterns, userPatterns ] );

	return { patternCategories, hasPatterns: !! patternCategories.length };
}
