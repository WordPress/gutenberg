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
import InserterSearchResults from './search-results';
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
	const [ filterValue, setFilterValue ] = useState(
		__experimentalFilterValue
	);
	const [ hoveredItem, setHoveredItem ] = useState( null );
	const [ selectedPatternCategory, setSelectedPatternCategory ] =
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
	const { showPatterns, hasReusableBlocks } = useSelect(
		( select ) => {
			const { __experimentalGetAllowedPatterns, getSettings } =
				select( blockEditorStore );

			return {
				showPatterns: !! __experimentalGetAllowedPatterns(
					destinationRootClientId
				).length,
				hasReusableBlocks:
					!! getSettings().__experimentalReusableBlocks?.length,
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

	const searchRef = useRef();
	// TODO: this doesn't work now..
	useImperativeHandle( ref, () => ( {
		focusSearch: () => {
			searchRef.current?.focus();
		},
	} ) );

	const getCurrentTab = useCallback(
		( tab ) => {
			const searchControlProps = {};
			let searchResultsProps;
			let tabContent;
			if ( tab.name === 'blocks' ) {
				searchControlProps.label = __( 'Search for blocks' );
				searchResultsProps = {
					showBlockDirectory: true,
					maxBlockPatterns: 0,
				};
				tabContent = blocksTab;
			} else if ( tab.name === 'patterns' ) {
				searchControlProps.label = __( 'Search for patterns' );
				searchResultsProps = {
					maxBlockTypes: 0,
				};
				tabContent = patternsTab;
			} else if ( tab.name === 'reusable' ) {
				searchControlProps.label = __( 'Search for blocks' );
				searchResultsProps = {
					showBlockDirectory: true,
					maxBlockPatterns: 0,
				};
				tabContent = reusableBlocksTab;
			}

			return (
				<>
					<SearchControl
						className="block-editor-inserter__search"
						onChange={ ( value ) => {
							if ( hoveredItem ) setHoveredItem( null );
							setFilterValue( value );
						} }
						value={ filterValue }
						placeholder={ __( 'Search' ) }
						ref={ searchRef }
						{ ...searchControlProps }
					/>
					{ ! filterValue && tabContent }
					{ !! filterValue && (
						<div className="block-editor-inserter__no-tab-container">
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
								shouldFocusBlock={ shouldFocusBlock }
								{ ...searchResultsProps }
							/>
						</div>
					) }
				</>
			);
		},
		[ blocksTab, patternsTab, reusableBlocksTab, filterValue ]
	);

	const showPatternPanel =
		selectedTab === 'patterns' && ! filterValue && selectedPatternCategory;
	const showAsTabs = showPatterns || hasReusableBlocks;

	return (
		<div className="block-editor-inserter__menu">
			<div
				className={ classnames( 'block-editor-inserter__main-area', {
					'show-as-tabs': showAsTabs,
				} ) }
			>
				{ showAsTabs && (
					<InserterTabs
						showPatterns={ showPatterns }
						showReusableBlocks={ hasReusableBlocks }
						prioritizePatterns={ prioritizePatterns }
						onSelect={ setSelectedTab }
					>
						{ getCurrentTab }
					</InserterTabs>
				) }
				{ ! filterValue && ! showAsTabs && (
					<div className="block-editor-inserter__no-tab-container">
						{ blocksTab }
					</div>
				) }
			</div>
			{ showInserterHelpPanel && hoveredItem && (
				<InserterPreviewPanel item={ hoveredItem } />
			) }
			{ showPatternPanel && (
				<BlockPatternsCategoryDialog
					rootClientId={ destinationRootClientId }
					onInsert={ onInsertPattern }
					category={ selectedPatternCategory }
				/>
			) }
		</div>
	);
}

export default forwardRef( InserterMenu );
