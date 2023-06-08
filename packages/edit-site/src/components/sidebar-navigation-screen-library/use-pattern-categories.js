/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

	const userPatterns = useSelect( ( select ) =>
		select( coreStore ).getEntityRecords( 'postType', 'wp_block', {
			per_page: -1,
		} )
	);

	const uncategorized = useMemo( () => {
		const category = {
			count: 0,
			id: 'uncategorized',
			slug: 'uncategorized',
			name: __( 'Uncategorized' ),
		};

		( userPatterns || [] ).forEach( ( pattern ) => {
			if ( ! pattern.wp_pattern?.length ) {
				category.count += 1;
			}
		} );

		return category;
	}, [ userPatterns ] );

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

		if ( uncategorized.count ) {
			categoriesWithCounts.push( uncategorized );
		}

		return categoriesWithCounts;
	}, [ categories, themePatterns, uncategorized ] );

	return { patternCategories, hasPatterns: !! patternCategories.length };
}
