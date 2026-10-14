import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import usePatternsState from '../hooks/use-patterns-state';
import {
	isPatternFiltered,
	allPatternsCategory,
	myPatternsCategory,
	starterPatternsCategory,
	installedThemePatternsCategory,
	getPopulatedCategories,
	INSERTER_PATTERN_TYPES,
} from './utils';
import { store as blockEditorStore } from '../../../store';
import { selectInstalledThemePatternsKey } from '../../../store/private-keys';

export function usePatternCategories( rootClientId, sourceFilter = 'all' ) {
	const [ patterns, allCategories ] = usePatternsState(
		undefined,
		rootClientId
	);
	// Patterns from other installed themes load once their category is open,
	// so the category is offered whenever the editor can provide them.
	const hasInstalledThemePatterns = useSelect(
		( select ) =>
			!! select( blockEditorStore ).getSettings()[
				selectInstalledThemePatternsKey
			],
		[]
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
		if (
			hasInstalledThemePatterns &&
			[ 'all', INSERTER_PATTERN_TYPES.theme ].includes( sourceFilter )
		) {
			categories.push( installedThemePatternsCategory );
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
	}, [
		allCategories,
		filteredPatterns,
		hasInstalledThemePatterns,
		sourceFilter,
	] );

	return populatedCategories;
}
