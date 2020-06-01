/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import BlockPatternsList from '../block-patterns-list';
import InserterSearchForm from './search-form';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useInsertionPoint from './hooks/use-insertion-point';
import usePatternsState from './hooks/use-patterns-state';
import useBlockTypesState from './hooks/use-block-types-state';
import { searchBlockItems, searchItems } from './search-items';

const SEARCH_THRESHOLD = 6;
const SHOWN_BLOCK_TYPES = 6;
const SHOWN_BLOCK_PATTERNS = 2;

function QuickInserterList( {
	blockTypes,
	blockPatterns,
	onSelectBlockType,
	onSelectBlockPattern,
	onHover,
} ) {
	const showBlockTypes = useMemo(
		() => blockTypes.slice( 0, SHOWN_BLOCK_TYPES ),
		[ blockTypes ]
	);
	const shownBlockPatterns = useMemo(
		() => blockPatterns.slice( 0, SHOWN_BLOCK_PATTERNS ),
		[ blockTypes ]
	);
	return (
		<div className="block-editor-inserter__quick-inserter__results">
			{ ! showBlockTypes.length && ! shownBlockPatterns.length && (
				<InserterNoResults />
			) }

			{ !! showBlockTypes.length && (
				<InserterPanel title={ __( 'Blocks' ) }>
					<BlockTypesList
						items={ showBlockTypes }
						onSelect={ onSelectBlockType }
						onHover={ onHover }
					/>
				</InserterPanel>
			) }

			{ !! shownBlockPatterns.length && (
				<InserterPanel title={ __( 'Patterns' ) }>
					<BlockPatternsList
						shownPatterns={ shownBlockPatterns }
						blockPatterns={ shownBlockPatterns }
						onClickPattern={ onSelectBlockPattern }
					/>
				</InserterPanel>
			) }
		</div>
	);
}

function QuickInserter( {
	rootClientId,
	clientId,
	isAppender,
	selectBlockOnInsert,
} ) {
	const [ isFiltered, setIsFiltered ] = useState( false );
	const [ filterValue, setFilterValue ] = useState( '' );
	const [
		destinationRootClientId,
		onInsertBlocks,
		onToggleInsertionPoint,
	] = useInsertionPoint( {
		rootClientId,
		clientId,
		isAppender,
		selectBlockOnInsert,
	} );
	const [
		blockTypes,
		blockTypeCategories,
		blockTypeCollections,
		onSelectBlockType,
	] = useBlockTypesState( destinationRootClientId, onInsertBlocks );
	const [ patterns, onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks
	);
	const showPatterns = ! destinationRootClientId && patterns.length;
	const showSearch =
		( showPatterns && patterns.length > SEARCH_THRESHOLD ) ||
		blockTypes.length > SEARCH_THRESHOLD;

	const filteredBlockTypes = useMemo( () => {
		return searchBlockItems(
			blockTypes,
			blockTypeCategories,
			blockTypeCollections,
			filterValue
		);
	}, [ filterValue, blockTypes, blockTypeCategories, blockTypeCollections ] );

	const filteredBlockPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);

	return (
		<div className="block-editor-inserter__quick-inserter">
			{ showSearch && (
				<InserterSearchForm
					onChange={ ( value ) => {
						setFilterValue( value );
						setIsFiltered( true );
					} }
				/>
			) }
			{ ( ! showSearch || isFiltered ) && (
				<QuickInserterList
					blockTypes={ filteredBlockTypes }
					blockPatterns={ showPatterns ? filteredBlockPatterns : [] }
					onSelectBlockPattern={ onSelectBlockPattern }
					onSelectBlockType={ onSelectBlockType }
					onHover={ onToggleInsertionPoint }
				/>
			) }
		</div>
	);
}

export default QuickInserter;
