/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce, useAsyncList } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import InserterNoResults from '../no-results';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import InserterListbox from '../../inserter-listbox';
import { searchItems } from '../search-items';

const INITIAL_INSERTER_RESULTS = 6;

function PatternExplorerSearchResults( {
	filterValue,
	onSelect,
	rootClientId,
	clientId,
	isAppender,
	__experimentalInsertionIndex,
	maxBlockPatterns,
	shouldFocusBlock = true,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );

	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		onSelect,
		rootClientId,
		clientId,
		isAppender,
		insertionIndex: __experimentalInsertionIndex,
		shouldFocusBlock,
	} );
	const [ patterns, , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);

	const filteredBlockPatterns = useMemo( () => {
		const results = searchItems( patterns, filterValue );
		return maxBlockPatterns !== undefined
			? results.slice( 0, maxBlockPatterns )
			: results;
	}, [ filterValue, patterns, maxBlockPatterns ] );

	// Announce search results on change
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

	const currentShownPatterns = useAsyncList( filteredBlockPatterns, {
		step: INITIAL_INSERTER_RESULTS,
	} );

	const hasItems = !! filteredBlockPatterns?.length;
	return (
		<>
			{ hasItems && (
				<h2 className="block-editor-block-patterns-explorer__search-results-count">
					{ sprintf(
						/* translators: %d: number of patterns. %s: block pattern search query */
						_n(
							'%1$d pattern found for "%2$s"',
							'%1$d patterns found for "%2$s"',
							filteredBlockPatterns.length
						),
						filteredBlockPatterns.length,
						filterValue
					) }
				</h2>
			) }
			<InserterListbox>
				{ ! hasItems && <InserterNoResults /> }
				{ hasItems && (
					<BlockPatternsList
						shownPatterns={ currentShownPatterns }
						blockPatterns={ filteredBlockPatterns }
						onClickPattern={ onSelectBlockPattern }
						isDraggable={ false }
					/>
				) }
			</InserterListbox>
		</>
	);
}

export default PatternExplorerSearchResults;
