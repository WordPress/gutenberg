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
import { PatternCategoryPreviews } from './block-patterns-tab/pattern-category-previews';
import { MediaTab, MediaCategoryPanel } from './media-tab';
import InserterSearchResults from './search-results';
import useInsertionPoint from './hooks/use-insertion-point';
import { store as blockEditorStore } from '../../store';
import TabbedSidebar from '../tabbed-sidebar';
import { useZoomOut } from '../../hooks/use-zoom-out';
import { unlock } from '../../lock-unlock';

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
		onPatternCategorySelection,
		onClose,
		__experimentalInitialTab,
		__experimentalInitialCategory,
	},
	ref
) {
	const { isZoomOutMode, inserterSearchInputRef } = useSelect( ( select ) => {
		const { __unstableGetEditorMode, getInserterSearchInputRef } = unlock(
			select( blockEditorStore )
		);
		return {
			isZoomOutMode: __unstableGetEditorMode() === 'zoom-out',
			inserterSearchInputRef: getInserterSearchInputRef(),
		};
	}, [] );

	const [ filterValue, setFilterValue, delayedFilterValue ] =
		useDebouncedInput( __experimentalFilterValue );
	const [ hoveredItem, setHoveredItem ] = useState( null );
	const [ selectedPatternCategory, setSelectedPatternCategory ] = useState(
		__experimentalInitialCategory
	);
	const [ patternFilter, setPatternFilter ] = useState( 'all' );
	const [ selectedMediaCategory, setSelectedMediaCategory ] =
		useState( null );
	function getInitialTab() {
		if ( __experimentalInitialTab ) {
			return __experimentalInitialTab;
		}

		if ( isZoomOutMode ) {
			return 'patterns';
		}
	}
	const [ selectedTab, setSelectedTab ] = useState( getInitialTab() );

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
		( blocks, meta, shouldForceFocusBlock, _rootClientId ) => {
			onInsertBlocks(
				blocks,
				meta,
				shouldForceFocusBlock,
				_rootClientId
			);
			onSelect( blocks );

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
		[ onInsertBlocks, onSelect, ref, shouldFocusBlock ]
	);

	const onInsertPattern = useCallback(
		( blocks, patternName ) => {
			onToggleInsertionPoint( false );
			onInsertBlocks( blocks, { patternName } );
			onSelect();
		},
		[ onInsertBlocks, onSelect, onToggleInsertionPoint ]
	);

	const onHover = useCallback(
		( item ) => {
			onToggleInsertionPoint( item );
			setHoveredItem( item );
		},
		[ onToggleInsertionPoint, setHoveredItem ]
	);

	const onClickPatternCategory = useCallback(
		( patternCategory, filter ) => {
			setSelectedPatternCategory( patternCategory );
			setPatternFilter( filter );
			onPatternCategorySelection?.();
		},
		[ setSelectedPatternCategory, onPatternCategorySelection ]
	);

	const showPatternPanel =
		selectedTab === 'patterns' &&
		! delayedFilterValue &&
		!! selectedPatternCategory;

	const showMediaPanel = selectedTab === 'media' && !! selectedMediaCategory;

	const showZoomOut =
		showPatternPanel && !! window.__experimentalEnableZoomedOutPatternsTab;

	useZoomOut( showZoomOut );

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
					ref={ inserterSearchInputRef }
				/>

				{ !! delayedFilterValue && (
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
						prioritizePatterns={ selectedTab === 'patterns' }
					/>
				) }
			</>
		);
	}, [
		selectedTab,
		filterValue,
		inserterSearchInputRef,
		delayedFilterValue,
		onSelect,
		onHover,
		rootClientId,
		clientId,
		isAppender,
		__experimentalInsertionIndex,
		shouldFocusBlock,
		hoveredItem,
		setFilterValue,
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
					<PatternCategoryPreviews
						rootClientId={ destinationRootClientId }
						onInsert={ onInsertPattern }
						category={ selectedPatternCategory }
						patternFilter={ patternFilter }
						showTitlesAsTooltip
					/>
				) }
			</BlockPatternsTab>
		);
	}, [
		destinationRootClientId,
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
				<TabbedSidebar
					ref={ tabsRef }
					onSelect={ handleSetSelectedTab }
					onClose={ onClose }
					selectedTab={ selectedTab }
					closeButtonLabel={ __( 'Close block inserter' ) }
					tabs={ [
						{
							name: 'blocks',
							title: __( 'Blocks' ),
							panel: (
								<>
									{ inserterSearch }
									{ selectedTab === 'blocks' &&
										! delayedFilterValue &&
										blocksTab }
								</>
							),
						},
						{
							name: 'patterns',
							title: __( 'Patterns' ),
							panel: (
								<>
									{ inserterSearch }
									{ selectedTab === 'patterns' &&
										! delayedFilterValue &&
										patternsTab }
								</>
							),
						},
						{
							name: 'media',
							title: __( 'Media' ),
							panel: (
								<>
									{ inserterSearch }
									{ mediaTab }
								</>
							),
						},
					] }
				/>
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

export const PrivateInserterMenu = forwardRef( InserterMenu );

function PublicInserterMenu( props, ref ) {
	return (
		<PrivateInserterMenu
			{ ...props }
			onPatternCategorySelection={ NOOP }
			ref={ ref }
		/>
	);
}

export default forwardRef( PublicInserterMenu );
