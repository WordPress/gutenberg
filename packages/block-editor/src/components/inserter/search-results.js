/**
 * External dependencies
 */
import { orderBy, isEmpty } from 'lodash';

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
import BlockTypesList from '../block-types-list';
import BlockPatternsList from '../block-patterns-list';
import __experimentalInserterMenuExtension from '../inserter-menu-extension';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useInsertionPoint from './hooks/use-insertion-point';
import usePatternsState from './hooks/use-patterns-state';
import useBlockTypesState from './hooks/use-block-types-state';
import { searchBlockItems, searchItems } from './search-items';
import InserterListbox from '../inserter-listbox';

function InserterSearchResults( {
	filterValue,
	onSelect,
	onHover,
	rootClientId,
	clientId,
	isAppender,
	__experimentalInsertionIndex,
	maxBlockPatterns,
	maxBlockTypes,
	showBlockDirectory = false,
	isDraggable = true,
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
	const [
		blockTypes,
		blockTypeCategories,
		blockTypeCollections,
		onSelectBlockType,
	] = useBlockTypesState( destinationRootClientId, onInsertBlocks );
	const [ patterns, , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);

	const filteredBlockTypes = useMemo( () => {
		const results = searchBlockItems(
			orderBy( blockTypes, [ 'frecency' ], [ 'desc' ] ),
			blockTypeCategories,
			blockTypeCollections,
			filterValue
		);

		return maxBlockTypes !== undefined
			? results.slice( 0, maxBlockTypes )
			: results;
	}, [
		filterValue,
		blockTypes,
		blockTypeCategories,
		blockTypeCollections,
		maxBlockTypes,
	] );

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
		const count = filteredBlockTypes.length + filteredBlockPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	const currentShownPatterns = useAsyncList( filteredBlockPatterns );

	const hasItems =
		! isEmpty( filteredBlockTypes ) || ! isEmpty( filteredBlockPatterns );

	return (
		<InserterListbox>
			{ ! showBlockDirectory && ! hasItems && <InserterNoResults /> }

			{ !! filteredBlockTypes.length && (
				<InserterPanel
					title={
						<VisuallyHidden>{ __( 'Blocks' ) }</VisuallyHidden>
					}
				>
					<BlockTypesList
						items={ filteredBlockTypes }
						onSelect={ onSelectBlockType }
						onHover={ onHover }
						label={ __( 'Blocks' ) }
						isDraggable={ isDraggable }
					/>
				</InserterPanel>
			) }

			{ !! filteredBlockTypes.length &&
				!! filteredBlockPatterns.length && (
					<div className="block-editor-inserter__quick-inserter-separator" />
				) }

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
							isDraggable={ isDraggable }
						/>
					</div>
				</InserterPanel>
			) }

			{ showBlockDirectory && (
				<__experimentalInserterMenuExtension.Slot
					fillProps={ {
						onSelect: onSelectBlockType,
						onHover,
						filterValue,
						hasItems,
						rootClientId: destinationRootClientId,
					} }
				>
					{ ( fills ) => {
						if ( fills.length ) {
							return fills;
						}
						if ( ! hasItems ) {
							return <InserterNoResults />;
						}
						return null;
					} }
				</__experimentalInserterMenuExtension.Slot>
			) }
		</InserterListbox>
	);
}

export default InserterSearchResults;
