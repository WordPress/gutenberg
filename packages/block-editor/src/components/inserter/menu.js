/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useState,
	useCallback,
	useMemo,
	useRef,
	useLayoutEffect,
} from '@wordpress/element';
import { VisuallyHidden, SearchControl, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDebouncedInput } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Tips from './tips';
import InserterPreviewPanel from './preview-panel';
import BlockTypesTab from './block-types-tab';
import BlockPatternsTab from './block-patterns-tab';
import { PatternCategoryPreviewPanel } from './block-patterns-tab/pattern-category-preview-panel';
import { MediaTab, MediaCategoryPanel } from './media-tab';
import InserterSearchResults from './search-results';
import useInsertionPoint from './hooks/use-insertion-point';
import InserterTabs from './tabs';
import { useZoomOut } from '../../hooks/use-zoom-out';
import { store as blockEditorStore } from '../../store';

const NOOP = () => {};
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
		__experimentalOnPatternCategorySelection = NOOP,
		onClose,
		__experimentalInitialTab,
		__experimentalInitialCategory,
	},
	ref
) {
	const isZoomOutMode = useSelect(
		( select ) =>
			select( blockEditorStore ).__unstableGetEditorMode() === 'zoom-out',
		[]
	);
	const [ filterValue, setFilterValue, delayedFilterValue ] =
		useDebouncedInput( __experimentalFilterValue );
	const [ hoveredItem, setHoveredItem ] = useState( null );
	const [ selectedPatternCategory, setSelectedPatternCategory ] = useState(
		__experimentalInitialCategory
	);
	const [ patternFilter, setPatternFilter ] = useState( 'all' );
	const [ selectedMediaCategory, setSelectedMediaCategory ] =
		useState( null );
	const [ selectedTab, setSelectedTab ] = useState(
		__experimentalInitialTab
	);

	const [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ] =
		useInsertionPoint( {
			rootClientId,
			clientId,
			isAppender,
			insertionIndex: __experimentalInsertionIndex,
			shouldFocusBlock,
		} );
	const blockTypesTabRef = useRef();

	const onInsert = useCallback(
		( blocks, meta, shouldForceFocusBlock ) => {
			onInsertBlocks( blocks, meta, shouldForceFocusBlock );
			onSelect();

			// Check for focus loss due to filtering blocks by selected block type
			window.requestAnimationFrame( () => {
				if (
					! shouldFocusBlock &&
					! blockTypesTabRef?.current.contains(
						ref.current.ownerDocument.activeElement
					)
				) {
					// There has been a focus loss, so focus the first button in the block types tab
					blockTypesTabRef?.current.querySelector( 'button' ).focus();
				}
			} );
		},
		[ onInsertBlocks, onSelect, shouldFocusBlock ]
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
			__experimentalOnPatternCategorySelection();
		},
		[ setSelectedPatternCategory, __experimentalOnPatternCategorySelection ]
	);

	const showPatternPanel =
		selectedTab === 'patterns' &&
		! delayedFilterValue &&
		!! selectedPatternCategory;

	const showMediaPanel = selectedTab === 'media' && !! selectedMediaCategory;

	const inserterSearch = useMemo( () => {
		if ( selectedTab === 'media' ) {
			return null;
		}

		return (
			<>
				<SearchControl
					__nextHasNoMarginBottom
					className="block-editor-inserter__search"
					onChange={ ( value ) => {
						if ( hoveredItem ) {
							setHoveredItem( null );
						}
						setFilterValue( value );
					} }
					value={ filterValue }
					label={ __( 'Search for blocks and patterns' ) }
					placeholder={ __( 'Search' ) }
				/>
				{ !! delayedFilterValue && (
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
						prioritizePatterns={ selectedTab === 'patterns' }
					/>
				) }
			</>
		);
	}, [
		selectedTab,
		hoveredItem,
		setHoveredItem,
		setFilterValue,
		filterValue,
		delayedFilterValue,
		onSelect,
		onHover,
		onHoverPattern,
		shouldFocusBlock,
		clientId,
		rootClientId,
		__experimentalInsertionIndex,
		isAppender,
	] );

	const blocksTab = useMemo( () => {
		return (
			<>
				<div className="block-editor-inserter__block-list">
					<BlockTypesTab
						ref={ blockTypesTabRef }
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
	}, [
		destinationRootClientId,
		onInsert,
		onHover,
		showMostUsedBlocks,
		showInserterHelpPanel,
	] );

	const patternsTab = useMemo( () => {
		return (
			<BlockPatternsTab
				rootClientId={ destinationRootClientId }
				onInsert={ onInsertPattern }
				onSelectCategory={ onClickPatternCategory }
				selectedCategory={ selectedPatternCategory }
			>
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
			</BlockPatternsTab>
		);
	}, [
		destinationRootClientId,
		onHoverPattern,
		onInsertPattern,
		onClickPatternCategory,
		patternFilter,
		selectedPatternCategory,
		showPatternPanel,
	] );

	const mediaTab = useMemo( () => {
		return (
			<MediaTab
				rootClientId={ destinationRootClientId }
				selectedCategory={ selectedMediaCategory }
				onSelectCategory={ setSelectedMediaCategory }
				onInsert={ onInsert }
			>
				{ showMediaPanel && (
					<MediaCategoryPanel
						rootClientId={ destinationRootClientId }
						onInsert={ onInsert }
						category={ selectedMediaCategory }
					/>
				) }
			</MediaTab>
		);
	}, [
		destinationRootClientId,
		onInsert,
		selectedMediaCategory,
		setSelectedMediaCategory,
		showMediaPanel,
	] );

	// When the pattern panel is showing, we want to use zoom out mode
	useZoomOut( showPatternPanel );

	const handleSetSelectedTab = ( value ) => {
		// If no longer on patterns tab remove the category setting.
		if ( value !== 'patterns' ) {
			setSelectedPatternCategory( null );
		}
		setSelectedTab( value );
	};

	// Focus first active tab, if any
	const tabsRef = useRef();
	useLayoutEffect( () => {
		if ( tabsRef.current ) {
			window.requestAnimationFrame( () => {
				tabsRef.current
					.querySelector( '[role="tab"][aria-selected="true"]' )
					?.focus();
			} );
		}
	}, [] );

	return (
		<div
			className={ clsx( 'block-editor-inserter__menu', {
				'show-panel': showPatternPanel || showMediaPanel,
				'is-zoom-out': isZoomOutMode,
			} ) }
			ref={ ref }
		>
			<div className="block-editor-inserter__main-area">
				<InserterTabs
					ref={ tabsRef }
					onSelect={ handleSetSelectedTab }
					onClose={ onClose }
					selectedTab={ selectedTab }
				>
					{ inserterSearch }
					{ selectedTab === 'blocks' &&
						! delayedFilterValue &&
						blocksTab }
					{ selectedTab === 'patterns' &&
						! delayedFilterValue &&
						patternsTab }
					{ selectedTab === 'media' && mediaTab }
				</InserterTabs>
			</div>
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
		</div>
	);
}

export default forwardRef( InserterMenu );
