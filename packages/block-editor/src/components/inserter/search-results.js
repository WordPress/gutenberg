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
import __unstableInserterMenuExtension from '../inserter-menu-extension';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useInsertionPoint from './hooks/use-insertion-point';
import usePatternsState from './hooks/use-patterns-state';
import useBlockTypesState from './hooks/use-block-types-state';
import { searchBlockItems, searchItems } from './search-items';
import InserterListbox from '../inserter-listbox';

const INITIAL_INSERTER_RESULTS = 9;
/**
 * Shared reference to an empty array for cases where it is important to avoid
 * returning a new array reference on every invocation and rerendering the component.
 *
 * @type {Array}
 */
const EMPTY_ARRAY = [];

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
	__experimentalPrioritizePatterns,
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

	const filteredBlockPatterns = useMemo( () => {
		const results = searchItems( patterns, filterValue );
		return maxBlockPatterns !== undefined
			? results.slice( 0, maxBlockPatterns )
			: results;
	}, [ filterValue, patterns, maxBlockPatterns ] );

	let maxBlockTypesToShow = maxBlockTypes;
	if (
		__experimentalPrioritizePatterns &&
		filteredBlockPatterns.length > 2
	) {
		maxBlockTypesToShow = 0;
	}

	const filteredBlockTypes = useMemo( () => {
		const results = searchBlockItems(
			orderBy( blockTypes, [ 'frecency' ], [ 'desc' ] ),
			blockTypeCategories,
			blockTypeCollections,
			filterValue
		);

		return maxBlockTypesToShow !== undefined
			? results.slice( 0, maxBlockTypesToShow )
			: results;
	}, [
		filterValue,
		blockTypes,
		blockTypeCategories,
		blockTypeCollections,
		maxBlockTypes,
	] );

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

	const currentShownBlockTypes = useAsyncList( filteredBlockTypes, {
		step: INITIAL_INSERTER_RESULTS,
	} );
	const currentShownPatterns = useAsyncList(
		currentShownBlockTypes.length === filteredBlockTypes.length
			? filteredBlockPatterns
			: EMPTY_ARRAY
	);

	const hasItems =
		! isEmpty( filteredBlockTypes ) || ! isEmpty( filteredBlockPatterns );

	const blocksUI = !! filteredBlockTypes.length && (
		<InserterPanel
			title={ <VisuallyHidden>{ __( 'Blocks' ) }</VisuallyHidden> }
		>
			<BlockTypesList
				items={ currentShownBlockTypes }
				onSelect={ onSelectBlockType }
				onHover={ onHover }
				label={ __( 'Blocks' ) }
				isDraggable={ isDraggable }
			/>
		</InserterPanel>
	);

	const patternsUI = !! filteredBlockPatterns.length && (
		<InserterPanel
			title={
				<VisuallyHidden>{ __( 'Block Patterns' ) }</VisuallyHidden>
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
	);

	return (
		<InserterListbox>
			{ ! showBlockDirectory && ! hasItems && <InserterNoResults /> }

			{ __experimentalPrioritizePatterns ? patternsUI : blocksUI }

			{ !! filteredBlockTypes.length &&
				!! filteredBlockPatterns.length && (
					<div className="block-editor-inserter__quick-inserter-separator" />
				) }

			{ __experimentalPrioritizePatterns ? blocksUI : patternsUI }

			{ showBlockDirectory && (
				<__unstableInserterMenuExtension.Slot
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
				</__unstableInserterMenuExtension.Slot>
			) }
		</InserterListbox>
	);
}

export default InserterSearchResults;
