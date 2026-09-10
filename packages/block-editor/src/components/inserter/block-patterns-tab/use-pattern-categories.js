import { useMemo } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import usePatternsState from '../hooks/use-patterns-state';
import {
	isPatternFiltered,
	allPatternsCategory,
	myPatternsCategory,
	starterPatternsCategory,
	getPopulatedCategories,
	INSERTER_PATTERN_TYPES,
} from './utils';

export function usePatternCategories( rootClientId, sourceFilter = 'all' ) {
	const [ patterns, allCategories ] = usePatternsState(
		undefined,
		rootClientId
	);

	const filteredPatterns = useMemo(
		() =>
			sourceFilter === 'all'
				? patterns
				: patterns.filter(
						( pattern ) =>
							! isPatternFiltered( pattern, sourceFilter )
				  ),
		[ sourceFilter, patterns ]
	);

	// Remove any empty categories.
	const populatedCategories = useMemo( () => {
		const categories = getPopulatedCategories(
			filteredPatterns,
			allCategories
		);
		if (
			filteredPatterns.some( ( pattern ) =>
				pattern.blockTypes?.includes( 'core/post-content' )
			)
		) {
			categories.unshift( starterPatternsCategory );
		}
		if (
			filteredPatterns.some(
				( pattern ) => pattern.type === INSERTER_PATTERN_TYPES.user
			)
		) {
			categories.unshift( myPatternsCategory );
		}
		if ( filteredPatterns.length > 0 ) {
			categories.unshift( {
				name: allPatternsCategory.name,
				label: allPatternsCategory.label,
			} );
		}
		speak(
			sprintf(
				/* translators: %d: number of categories . */
				_n(
					'%d category button displayed.',
					'%d category buttons displayed.',
					categories.length
				),
				categories.length
			)
		);
		return categories;
	}, [ allCategories, filteredPatterns ] );

	return populatedCategories;
}
