/**
 * External dependencies
 */
import { fromPairs } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InserterPanel from './panel';
import { searchItems } from './search-items';
import InserterNoResults from './no-results';
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';

function BlockPatternsSearchResults( { filterValue, onInsert } ) {
	const [ patterns, , onClick ] = usePatternsState( onInsert );
	const currentShownPatterns = useAsyncList( patterns );

	const filteredPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);

	if ( filterValue ) {
		return !! filteredPatterns.length ? (
			<InserterPanel title={ __( 'Search Results' ) }>
				<BlockPatternList
					shownPatterns={ currentShownPatterns }
					blockPatterns={ filteredPatterns }
					onClickPattern={ onClick }
				/>
			</InserterPanel>
		) : (
			<InserterNoResults />
		);
	}
}

function BlockPatternsPerCategories( { onInsert } ) {
	const [ patterns, categories, onClick ] = usePatternsState( onInsert );

	const getPatternIndex = useCallback(
		( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return Infinity;
			}
			const indexedCategories = fromPairs(
				categories.map( ( { name }, index ) => [ name, index ] )
			);
			return Math.min(
				...pattern.categories.map( ( category ) =>
					indexedCategories[ category ] !== undefined
						? indexedCategories[ category ]
						: Infinity
				)
			);
		},
		[ categories ]
	);

	// Ordering the patterns per category is important for the async rendering.
	const orderedPatterns = useMemo( () => {
		return patterns.sort( ( a, b ) => {
			return getPatternIndex( a ) - getPatternIndex( b );
		} );
	}, [ patterns, getPatternIndex ] );

	const currentShownPatterns = useAsyncList( orderedPatterns );

	// Uncategorized Patterns
	const uncategorizedPatterns = useMemo(
		() =>
			patterns.filter(
				( pattern ) => getPatternIndex( pattern ) === Infinity
			),
		[ patterns, getPatternIndex ]
	);

	return (
		<>
			{ categories.map( ( patternCategory ) => {
				const categoryPatterns = patterns.filter(
					( pattern ) =>
						pattern.categories &&
						pattern.categories.includes( patternCategory.name )
				);
				return (
					!! categoryPatterns.length && (
						<InserterPanel
							key={ patternCategory.name }
							title={ patternCategory.label }
						>
							<BlockPatternList
								shownPatterns={ currentShownPatterns }
								blockPatterns={ categoryPatterns }
								onClickPattern={ onClick }
							/>
						</InserterPanel>
					)
				);
			} ) }

			{ !! uncategorizedPatterns.length && (
				<InserterPanel title={ _x( 'Uncategorized' ) }>
					<BlockPatternList
						shownPatterns={ currentShownPatterns }
						blockPatterns={ uncategorizedPatterns }
						onClickPattern={ onClick }
					/>
				</InserterPanel>
			) }
		</>
	);
}

function BlockPatternsTabs( { onInsert, filterValue } ) {
	return filterValue ? (
		<BlockPatternsSearchResults
			onInsert={ onInsert }
			filterValue={ filterValue }
		/>
	) : (
		<BlockPatternsPerCategories onInsert={ onInsert } />
	);
}

export default BlockPatternsTabs;
