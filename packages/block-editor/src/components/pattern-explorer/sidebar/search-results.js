/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/components';
import { useDebounce, useAsyncList } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import InserterPanel from '../../inserter/panel';
import InserterNoResults from '../../inserter/no-results';
import useInsertionPoint from '../../inserter/hooks/use-insertion-point';
import usePatternsState from '../../inserter/hooks/use-patterns-state';
import { searchItems } from '../../inserter/search-items';
import InserterListbox from '../../inserter-listbox';

function InserterSearchResults( {
	filterValue,
	onSelect,
	rootClientId,
	__experimentalInsertionIndex,
	maxBlockPatterns,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId ] = useInsertionPoint( {
		rootClientId,
		insertionIndex: __experimentalInsertionIndex,
	} );
	const [ patterns, , onSelectBlockPattern ] = usePatternsState(
		undefined,
		destinationRootClientId,
		onSelect
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
	const currentShownPatterns = useAsyncList( filteredBlockPatterns );
	const hasItems = !! filteredBlockPatterns?.length;
	return (
		<InserterListbox>
			{ ! hasItems && <InserterNoResults /> }
			{ !! filteredBlockPatterns.length && (
				<InserterPanel
					title={
						<VisuallyHidden>
							{ __( 'Block Patterns' ) }
						</VisuallyHidden>
					}
				>
					<div className="block-editor-inserter__quick-inserter-patterns">
						<BlockPatternsList
							shownPatterns={ currentShownPatterns }
							blockPatterns={ filteredBlockPatterns }
							onClickPattern={ onSelectBlockPattern }
							isDraggable={ false }
						/>
					</div>
				</InserterPanel>
			) }
		</InserterListbox>
	);
}

export default InserterSearchResults;
