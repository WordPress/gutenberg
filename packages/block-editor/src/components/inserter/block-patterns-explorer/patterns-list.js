/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce, useAsyncList } from '@wordpress/compose';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import InserterNoResults from '../no-results';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import useBlockTypesState from '../hooks/use-block-types-state';
import InserterListbox from '../../inserter-listbox';
import { searchItems } from '../search-items';

const INITIAL_INSERTER_RESULTS = 2;

function PatternsListHeader( { filterValue, filteredBlockPatternsLength } ) {
	if ( ! filterValue ) {
		return null;
	}
	return (
		<Heading
			level={ 2 }
			lineHeight={ '48px' }
			className="block-editor-block-patterns-explorer__search-results-count"
		>
			{ sprintf(
				/* translators: %d: number of patterns. %s: block pattern search query */
				_n(
					'%1$d pattern found for "%2$s"',
					'%1$d patterns found for "%2$s"',
					filteredBlockPatternsLength
				),
				filteredBlockPatternsLength,
				filterValue
			) }
		</Heading>
	);
}

function PatternList( { filterValue, selectedCategory, patternCategories } ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		shouldFocusBlock: true,
	} );
	const [ allPatterns, , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);
	const [ unsyncedPatterns ] = useBlockTypesState(
		destinationRootClientId,
		onInsertBlocks,
		'unsynced'
	);
	const filteredUnsyncedPatterns = useMemo( () => {
		return unsyncedPatterns
			.filter(
				( { category: unsyncedPatternCategory } ) =>
					unsyncedPatternCategory === 'reusable'
			)
			.map( ( syncedPattern ) => ( {
				...syncedPattern,
				blocks: parse( syncedPattern.content, {
					__unstableSkipMigrationLogs: true,
				} ),
			} ) );
	}, [ unsyncedPatterns ] );

	const registeredPatternCategories = useMemo(
		() =>
			patternCategories.map(
				( patternCategory ) => patternCategory.name
			),
		[ patternCategories ]
	);

	const filteredBlockPatterns = useMemo( () => {
		if ( ! filterValue ) {
			return allPatterns.filter( ( pattern ) =>
				selectedCategory === 'uncategorized'
					? ! pattern.categories?.length ||
					  pattern.categories.every(
							( category ) =>
								! registeredPatternCategories.includes(
									category
								)
					  )
					: pattern.categories?.includes( selectedCategory )
			);
		}
		return searchItems( allPatterns, filterValue );
	}, [ filterValue, selectedCategory, allPatterns ] );

	// Announce search results on change.
	useEffect( () => {
		if ( ! filterValue ) {
			return;
		}
		const count = filteredBlockPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	const patterns =
		selectedCategory === 'reusable'
			? filteredUnsyncedPatterns
			: filteredBlockPatterns;

	const currentShownPatterns = useAsyncList( patterns, {
		step: INITIAL_INSERTER_RESULTS,
	} );

	const hasItems = !! patterns?.length;
	return (
		<div className="block-editor-block-patterns-explorer__list">
			{ hasItems && (
				<PatternsListHeader
					filterValue={ filterValue }
					filteredBlockPatternsLength={ filteredBlockPatterns.length }
				/>
			) }
			<InserterListbox>
				{ ! hasItems && <InserterNoResults /> }
				{ hasItems && (
					<BlockPatternsList
						shownPatterns={ currentShownPatterns }
						blockPatterns={ patterns }
						onClickPattern={ onSelectBlockPattern }
						isDraggable={ false }
					/>
				) }
			</InserterListbox>
		</div>
	);
}

export default PatternList;
