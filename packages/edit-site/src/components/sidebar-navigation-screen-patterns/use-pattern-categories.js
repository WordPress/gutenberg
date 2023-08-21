/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useDefaultPatternCategories from './use-default-pattern-categories';
import useThemePatterns from './use-theme-patterns';
import usePatterns from '../page-patterns/use-patterns';
import { USER_PATTERNS } from '../page-patterns/utils';

export default function usePatternCategories() {
	const defaultCategories = useDefaultPatternCategories();
	defaultCategories.push( {
		name: 'uncategorized',
		label: __( 'Uncategorized' ),
	} );
	const themePatterns = useThemePatterns();
	const { patterns: userPatterns, categories: userCategories } =
		usePatterns( USER_PATTERNS );

	const patternCategories = useMemo( () => {
		const userPatternCategories = userCategories
			? userCategories.map( ( cat ) => ( {
					name: cat.slug,
					label: cat.name,
			  } ) )
			: [];
		const categoryMap = {};
		const categoriesWithCounts = [];

		// Create a map for easier counting of patterns in categories.
		defaultCategories.forEach( ( category ) => {
			if ( ! categoryMap[ category.name ] ) {
				categoryMap[ category.name ] = { ...category, count: 0 };
			}
		} );
		userPatternCategories.forEach( ( category ) => {
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
			// If the pattern has no categories, add it to uncategorized.
			if ( ! pattern.categories?.length ) {
				categoryMap.uncategorized.count += 1;
			}
		} );

		// Update the category counts to reflect user registered patterns.
		userPatterns.forEach( ( pattern ) => {
			pattern.categories?.forEach( ( category ) => {
				if ( categoryMap[ category ] ) {
					categoryMap[ category ].count += 1;
				}
			} );
			// If the pattern has no categories, add it to uncategorized.
			if ( ! pattern.categories?.length ) {
				categoryMap.uncategorized.count += 1;
			}
		} );

		// Filter categories so we only have those containing patterns.
		[ ...defaultCategories, ...userPatternCategories ].forEach(
			( category ) => {
				if (
					categoryMap[ category.name ].count &&
					! categoriesWithCounts.find(
						( cat ) => cat.name === category.name
					)
				) {
					categoriesWithCounts.push( categoryMap[ category.name ] );
				}
			}
		);

		return categoriesWithCounts;
	}, [ defaultCategories, themePatterns, userCategories, userPatterns ] );

	return { patternCategories, hasPatterns: !! patternCategories.length };
}
