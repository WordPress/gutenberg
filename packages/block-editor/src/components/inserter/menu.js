/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterSearchForm from './search-form';
import InserterPreviewPanel from './preview-panel';
import BlockTypesTab from './block-types-tab';
import BlockPatternsTabs from './block-patterns-tab';
import ReusableBlocksTab from './reusable-blocks-tab';
import InserterSearchResults from './search-results';
import useInsertionPoint from './hooks/use-insertion-point';
import InserterTabs from './tabs';
import { store as blockEditorStore } from '../../store';

function InserterMenu( {
	rootClientId,
	clientId,
	isAppender,
	__experimentalInsertionIndex,
	onSelect,
	showInserterHelpPanel,
	showMostUsedBlocks,
	shouldFocusBlock = true,
} ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const [ hoveredItem, setHoveredItem ] = useState( null );
	const [ selectedPatternCategory, setSelectedPatternCategory ] = useState(
		null
	);

	const [
		destinationRootClientId,
		onInsertBlocks,
		onToggleInsertionPoint,
	] = useInsertionPoint( {
		rootClientId,
		clientId,
		isAppender,
		insertionIndex: __experimentalInsertionIndex,
		shouldFocusBlock,
	} );
	const { showPatterns, hasReusableBlocks } = useSelect(
		( select ) => {
			const { __experimentalGetAllowedPatterns, getSettings } = select(
				blockEditorStore
			);

			return {
				showPatterns:
					! destinationRootClientId ||
					!! __experimentalGetAllowedPatterns(
						destinationRootClientId
					).length,
				hasReusableBlocks: !! getSettings().__experimentalReusableBlocks
					?.length,
			};
		},
		[ destinationRootClientId ]
	);

	const onInsert = useCallback(
		( blocks, meta, shouldForceFocusBlock ) => {
			onInsertBlocks( blocks, meta, shouldForceFocusBlock );
			onSelect();
		},
		[ onInsertBlocks, onSelect ]
	);

	const onInsertPattern = useCallback(
		( blocks, patternName ) => {
			onInsertBlocks( blocks, { patternName } );
			onSelect();
		},
		[ onInsertBlocks, onSelect ]
	);

	const onHover = useCallback(
		( item ) => {
			onToggleInsertionPoint( !! item );
			setHoveredItem( item );
		},
		[ onToggleInsertionPoint, setHoveredItem ]
	);

	const onClickPatternCategory = useCallback(
		( patternCategory ) => {
			setSelectedPatternCategory( patternCategory );
		},
		[ setSelectedPatternCategory ]
	);

	const blocksTab = useMemo(
		() => (
			<>
				<div className="block-editor-inserter__block-list">
					<BlockTypesTab
						rootClientId={ destinationRootClientId }
						onInsert={ onInsert }
						onHover={ onHover }
						showMostUsedBlocks={ showMostUsedBlocks }
					/>
				</div>
				{ showInserterHelpPanel && (
					<div className="block-editor-inserter__tips">
						<VisuallyHidden as="h2">
							{ __( 'A tip for using the block editor' ) }
						</VisuallyHidden>
						<Tips />
					</div>
				) }
			</>
		),
		[
			destinationRootClientId,
			onInsert,
			onHover,
			filterValue,
			showMostUsedBlocks,
			showInserterHelpPanel,
		]
	);

	const patternsTab = useMemo(
		() => (
			<BlockPatternsTabs
				rootClientId={ destinationRootClientId }
				onInsert={ onInsertPattern }
				onClickCategory={ onClickPatternCategory }
				selectedCategory={ selectedPatternCategory }
			/>
		),
		[
			destinationRootClientId,
			onInsertPattern,
			onClickPatternCategory,
			selectedPatternCategory,
		]
	);

	const reusableBlocksTab = useMemo(
		() => (
			<ReusableBlocksTab
				rootClientId={ destinationRootClientId }
				onInsert={ onInsert }
				onHover={ onHover }
			/>
		),
		[ destinationRootClientId, onInsert, onHover ]
	);

	const getCurrentTab = useCallback(
		( tab ) => {
			if ( tab.name === 'blocks' ) {
				return blocksTab;
			} else if ( tab.name === 'patterns' ) {
				return patternsTab;
			}
			return reusableBlocksTab;
		},
		[ blocksTab, patternsTab, reusableBlocksTab ]
	);

	return (
		<div className="block-editor-inserter__menu">
			<div className="block-editor-inserter__main-area">
				{ /* the following div is necessary to fix the sticky position of the search form */ }
				<div className="block-editor-inserter__content">
					<InserterSearchForm
						onChange={ ( value ) => {
							if ( hoveredItem ) setHoveredItem( null );
							setFilterValue( value );
						} }
						value={ filterValue }
						label={ __( 'Search for blocks and patterns' ) }
						placeholder={ __( 'Search' ) }
					/>
					{ !! filterValue && (
						<InserterSearchResults
							filterValue={ filterValue }
							onSelect={ onSelect }
							onHover={ onHover }
							rootClientId={ rootClientId }
							clientId={ clientId }
							isAppender={ isAppender }
							__experimentalInsertionIndex={
								__experimentalInsertionIndex
							}
							showBlockDirectory
							shouldFocusBlock={ shouldFocusBlock }
						/>
					) }
					{ ! filterValue && ( showPatterns || hasReusableBlocks ) && (
						<InserterTabs
							showPatterns={ showPatterns }
							showReusableBlocks={ hasReusableBlocks }
						>
							{ getCurrentTab }
						</InserterTabs>
					) }
					{ ! filterValue &&
						! showPatterns &&
						! hasReusableBlocks &&
						blocksTab }
				</div>
			</div>
			{ showInserterHelpPanel && hoveredItem && (
				<InserterPreviewPanel item={ hoveredItem } />
			) }
		</div>
	);
}

export default InserterMenu;
