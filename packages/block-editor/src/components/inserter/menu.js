/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
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

function InserterMenu( {
	rootClientId,
	clientId,
	isAppender,
	__experimentalSelectBlockOnInsert,
	__experimentalInsertionIndex,
	onSelect,
	showInserterHelpPanel,
	showMostUsedBlocks,
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
		selectBlockOnInsert: __experimentalSelectBlockOnInsert,
		insertionIndex: __experimentalInsertionIndex,
	} );
	const { hasPatterns, hasReusableBlocks } = useSelect( ( select ) => {
		const {
			__experimentalBlockPatterns,
			__experimentalReusableBlocks,
		} = select( 'core/block-editor' ).getSettings();

		return {
			hasPatterns: !! __experimentalBlockPatterns?.length,
			hasReusableBlocks: !! __experimentalReusableBlocks?.length,
		};
	}, [] );

	const showPatterns = ! destinationRootClientId && hasPatterns;

	const onInsert = ( blocks ) => {
		onInsertBlocks( blocks );
		onSelect();
	};

	const onInsertPattern = ( blocks, patternName ) => {
		onInsertBlocks( blocks, { patternName } );
		onSelect();
	};

	const onHover = ( item ) => {
		onToggleInsertionPoint( !! item );
		setHoveredItem( item );
	};

	const onClickPatternCategory = ( patternCategory ) => {
		setSelectedPatternCategory( patternCategory );
	};

	const blocksTab = (
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
	);

	const patternsTab = (
		<BlockPatternsTabs
			onInsert={ onInsertPattern }
			onClickCategory={ onClickPatternCategory }
			selectedCategory={ selectedPatternCategory }
		/>
	);

	const reusableBlocksTab = (
		<ReusableBlocksTab
			rootClientId={ destinationRootClientId }
			onInsert={ onInsert }
			onHover={ onHover }
		/>
	);

	// Disable reason (no-autofocus): The inserter menu is a modal display, not one which
	// is always visible, and one which already incurs this behavior of autoFocus via
	// Popover's focusOnMount.
	/* eslint-disable jsx-a11y/no-autofocus */
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
							selectBlockOnInsert={
								__experimentalSelectBlockOnInsert
							}
							showBlockDirectory
						/>
					) }
					{ ! filterValue && ( showPatterns || hasReusableBlocks ) && (
						<InserterTabs
							showPatterns={ showPatterns }
							showReusableBlocks={ hasReusableBlocks }
						>
							{ ( tab ) => {
								if ( tab.name === 'blocks' ) {
									return blocksTab;
								} else if ( tab.name === 'patterns' ) {
									return patternsTab;
								}
								return reusableBlocksTab;
							} }
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
	/* eslint-enable jsx-a11y/no-autofocus */
}

export default InserterMenu;
