/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useState,
	useCallback,
	useMemo,
	useImperativeHandle,
	useRef,
} from '@wordpress/element';
import { VisuallyHidden, SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterPreviewPanel from './preview-panel';
import BlockTypesTab from './block-types-tab';
import BlockPatternsTabs, {
	BlockPatternsCategoryDialog,
} from './block-patterns-tab';
import ReusableBlocksTab from './reusable-blocks-tab';
import { MediaTab, MediaCategoryDialog, useMediaCategories } from './media-tab';
import InserterSearchResults from './search-results';
import useDebouncedInput from './hooks/use-debounced-input';
import useInsertionPoint from './hooks/use-insertion-point';
import InserterTabs from './tabs';
import { store as blockEditorStore } from '../../store';

function InserterMenu(
	{
		rootClientId,
		clientId,
		isAppender,
		__experimentalInsertionIndex,
		onSelect,
		showInserterHelpPanel,
		showMostUsedBlocks,
		__experimentalFilterValue = '',
		shouldFocusBlock = true,
		prioritizePatterns,
	},
	ref
) {
	const [ filterValue, setFilterValue, delayedFilterValue ] =
		useDebouncedInput( __experimentalFilterValue );
	const [ hoveredItem, setHoveredItem ] = useState( null );
	const [ selectedPatternCategory, setSelectedPatternCategory ] =
		useState( null );
	const [ selectedMediaCategory, setSelectedMediaCategory ] =
		useState( null );
	const [ selectedTab, setSelectedTab ] = useState( null );

	const [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ] =
		useInsertionPoint( {
			rootClientId,
			clientId,
			isAppender,
			insertionIndex: __experimentalInsertionIndex,
			shouldFocusBlock,
		} );
	const { showPatterns, inserterItems } = useSelect(
		( select ) => {
			const { __experimentalGetAllowedPatterns, getInserterItems } =
				select( blockEditorStore );
			return {
				showPatterns: !! __experimentalGetAllowedPatterns(
					destinationRootClientId
				).length,
				inserterItems: getInserterItems( destinationRootClientId ),
			};
		},
		[ destinationRootClientId ]
	);
	const hasReusableBlocks = useMemo( () => {
		return inserterItems.some(
			( { category } ) => category === 'reusable'
		);
	}, [ inserterItems ] );

	const mediaCategories = useMediaCategories( destinationRootClientId );
	const showMedia = !! mediaCategories.length;

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

	const onHoverPattern = useCallback(
		( item ) => {
			onToggleInsertionPoint( !! item );
		},
		[ onToggleInsertionPoint ]
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
			showMostUsedBlocks,
			showInserterHelpPanel,
		]
	);

	const patternsTab = useMemo(
		() => (
			<BlockPatternsTabs
				rootClientId={ destinationRootClientId }
				onInsert={ onInsertPattern }
				onSelectCategory={ onClickPatternCategory }
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

	const mediaTab = useMemo(
		() => (
			<MediaTab
				rootClientId={ destinationRootClientId }
				selectedCategory={ selectedMediaCategory }
				onSelectCategory={ setSelectedMediaCategory }
				onInsert={ onInsert }
			/>
		),
		[
			destinationRootClientId,
			onInsert,
			selectedMediaCategory,
			setSelectedMediaCategory,
		]
	);

	const getCurrentTab = useCallback(
		( tab ) => {
			if ( tab.name === 'blocks' ) {
				return blocksTab;
			} else if ( tab.name === 'patterns' ) {
				return patternsTab;
			} else if ( tab.name === 'reusable' ) {
				return reusableBlocksTab;
			} else if ( tab.name === 'media' ) {
				return mediaTab;
			}
		},
		[ blocksTab, patternsTab, reusableBlocksTab, mediaTab ]
	);

	const searchRef = useRef();
	useImperativeHandle( ref, () => ( {
		focusSearch: () => {
			searchRef.current.focus();
		},
	} ) );

	const showPatternPanel =
		selectedTab === 'patterns' &&
		! delayedFilterValue &&
		selectedPatternCategory;
	const showAsTabs =
		! delayedFilterValue &&
		( showPatterns || hasReusableBlocks || showMedia );
	const showMediaPanel =
		selectedTab === 'media' &&
		! delayedFilterValue &&
		selectedMediaCategory;
	return (
		<div className="block-editor-inserter__menu">
			<div
				className={ classnames( 'block-editor-inserter__main-area', {
					'show-as-tabs': showAsTabs,
				} ) }
			>
				<SearchControl
					__nextHasNoMarginBottom
					className="block-editor-inserter__search"
					onChange={ ( value ) => {
						if ( hoveredItem ) setHoveredItem( null );
						setFilterValue( value );
					} }
					value={ filterValue }
					label={ __( 'Search for blocks and patterns' ) }
					placeholder={ __( 'Search' ) }
					ref={ searchRef }
				/>
				{ !! delayedFilterValue && (
					<div className="block-editor-inserter__no-tab-container">
						<InserterSearchResults
							filterValue={ delayedFilterValue }
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
					</div>
				) }
				{ showAsTabs && (
					<InserterTabs
						showPatterns={ showPatterns }
						showReusableBlocks={ hasReusableBlocks }
						showMedia={ showMedia }
						prioritizePatterns={ prioritizePatterns }
						onSelect={ setSelectedTab }
					>
						{ getCurrentTab }
					</InserterTabs>
				) }
				{ ! delayedFilterValue && ! showAsTabs && (
					<div className="block-editor-inserter__no-tab-container">
						{ blocksTab }
					</div>
				) }
			</div>
			{ showMediaPanel && (
				<MediaCategoryDialog
					rootClientId={ destinationRootClientId }
					onInsert={ onInsert }
					category={ selectedMediaCategory }
				/>
			) }
			{ showInserterHelpPanel && hoveredItem && (
				<InserterPreviewPanel item={ hoveredItem } />
			) }
			{ showPatternPanel && (
				<BlockPatternsCategoryDialog
					rootClientId={ destinationRootClientId }
					onInsert={ onInsertPattern }
					onHover={ onHoverPattern }
					category={ selectedPatternCategory }
					showTitlesAsTooltip
				/>
			) }
		</div>
	);
}

export default forwardRef( InserterMenu );
