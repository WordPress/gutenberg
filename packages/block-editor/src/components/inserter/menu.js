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
import { VisuallyHidden, SearchControl, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterPreviewPanel from './preview-panel';
import BlockTypesTab from './block-types-tab';
import BlockPatternsTab from './block-patterns-tab';
import { PatternCategoryPreviewPanel } from './block-patterns-tab/pattern-category-preview-panel';
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
	const [ patternFilter, setPatternFilter ] = useState( 'all' );
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
		( patternCategory, filter ) => {
			setSelectedPatternCategory( patternCategory );
			setPatternFilter( filter );
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
			<BlockPatternsTab
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
			} else if ( tab.name === 'media' ) {
				return mediaTab;
			}
		},
		[ blocksTab, patternsTab, mediaTab ]
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

	const handleSetSelectedTab = ( value ) => {
		// If no longer on patterns tab remove the category setting.
		if ( value !== 'patterns' ) {
			setSelectedPatternCategory( null );
		}
		setSelectedTab( value );
	};

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
							onHoverPattern={ onHoverPattern }
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
						onSelect={ handleSetSelectedTab }
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
				<Popover
					className="block-editor-inserter__preview-container__popover"
					placement="right-start"
					offset={ 16 }
					focusOnMount={ false }
					animate={ false }
				>
					<InserterPreviewPanel item={ hoveredItem } />
				</Popover>
			) }
			{ showPatternPanel && (
				<PatternCategoryPreviewPanel
					rootClientId={ destinationRootClientId }
					onInsert={ onInsertPattern }
					onHover={ onHoverPattern }
					category={ selectedPatternCategory }
					patternFilter={ patternFilter }
					showTitlesAsTooltip
				/>
			) }
		</div>
	);
}

export default forwardRef( InserterMenu );
