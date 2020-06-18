/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

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
	const shownBlockTypes = useMemo(
		() => blockTypes.slice( 0, SHOWN_BLOCK_TYPES ),
		[ blockTypes ]
	);
	const shownBlockPatterns = useMemo(
		() => blockPatterns.slice( 0, SHOWN_BLOCK_PATTERNS ),
		[ blockTypes ]
	);
	return (
		<div className="block-editor-inserter__quick-inserter-results">
			{ ! shownBlockTypes.length && ! shownBlockPatterns.length && (
				<InserterNoResults />
			) }

			{ !! shownBlockTypes.length && (
				<InserterPanel
					title={
						<VisuallyHidden>{ __( 'Blocks' ) }</VisuallyHidden>
					}
				>
					<BlockTypesList
						items={ shownBlockTypes }
						onSelect={ onSelectBlockType }
						onHover={ onHover }
					/>
				</InserterPanel>
			) }

			{ !! shownBlockTypes.length && !! shownBlockPatterns.length && (
				<div className="block-editor-inserter__quick-inserter-separator" />
			) }

			{ !! shownBlockPatterns.length && (
				<InserterPanel
					title={
						<VisuallyHidden>{ __( 'Blocks' ) }</VisuallyHidden>
					}
				>
					<div className="block-editor-inserter__quick-inserter-patterns">
						<BlockPatternsList
							shownPatterns={ shownBlockPatterns }
							blockPatterns={ shownBlockPatterns }
							onClickPattern={ onSelectBlockPattern }
						/>
					</div>
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
	const [ patterns, , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks
	);
	const showPatterns =
		! destinationRootClientId && patterns.length && !! filterValue;
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

	const setInsererIsOpened = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getSettings()
				.__experimentalSetIsInserterOpened,
		[]
	);

	useEffect( () => {
		if ( setInsererIsOpened ) {
			setInsererIsOpened( false );
		}
	}, [ setInsererIsOpened ] );

	return (
		<div className="block-editor-inserter__quick-inserter">
			{ showSearch && (
				<InserterSearchForm
					value={ filterValue }
					onChange={ ( value ) => {
						setFilterValue( value );
					} }
				/>
			) }

			<QuickInserterList
				blockTypes={ filteredBlockTypes }
				blockPatterns={ showPatterns ? filteredBlockPatterns : [] }
				onSelectBlockPattern={ onSelectBlockPattern }
				onSelectBlockType={ onSelectBlockType }
				onHover={ onToggleInsertionPoint }
			/>

			{ setInsererIsOpened && (
				<Button
					className="block-editor-inserter__quick-inserter-expand"
					onClick={ () => setInsererIsOpened( true ) }
				>
					{ __( 'Browse all' ) }
				</Button>
			) }
		</div>
	);
}

export default QuickInserter;
