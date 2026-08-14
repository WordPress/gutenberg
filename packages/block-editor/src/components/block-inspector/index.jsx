import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	ToggleControl,
	__experimentalSpacer as Spacer,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import EditContents from './edit-contents';
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import MultiSelectionInspector from '../multi-selection-inspector';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import BlockStyles from '../block-styles';
import { ListViewContentPopover } from '../inspector-controls/list-view-content-popover';
import InspectorControls from '../inspector-controls';
import { BlockInspectorPreTabsSlot } from './inspector-pre-tabs-slot-fill';
import { default as InspectorControlsTabs } from '../inspector-controls-tabs';
import { SectionStyleControls } from '../inspector-controls-tabs/styles-tab';
import useInspectorControlsTabs from '../inspector-controls-tabs/use-inspector-controls-tabs';
import InspectorControlsLastItem from '../inspector-controls/last-item';
import AdvancedControls from '../inspector-controls-tabs/advanced-controls-panel';
import PositionControls from '../inspector-controls-tabs/position-controls-panel';
import useBlockInspectorAnimationSettings from './useBlockInspectorAnimationSettings';
import { BlockStateBadges, BlockStatesControl } from '../../hooks/states';
import ContentTab from '../inspector-controls-tabs/content-tab';
import ViewportVisibilityInfo from '../block-visibility/viewport-visibility-info';
import { unlock } from '../../lock-unlock';
import {
	BlockStyleStateProvider,
	hasPseudoBlockStyleState,
	hasViewportBlockStyleState,
	isDefaultBlockStyleState,
} from '../../hooks/block-style-state';
import MixedTextStyleControls from './mixed-text-style-controls';
import {
	getContentOnlySectionClientIds,
	getExpandedTextStyleTargetClientIds,
	getTextStyleTargetClientIds,
} from './mixed-text-style-utils';

const EMPTY_ARRAY = [];

function StyleInspectorSlots( {
	showAdvancedControls = true,
	showPositionControls = true,
	showBindingsControls = true,
} ) {
	return (
		<>
			<InspectorControls.Slot />
			<InspectorControls.Slot
				group="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				group="color"
				label={ __( 'Color' ) }
				className="color-block-support-panel__inner-wrapper"
			/>
			<InspectorControls.Slot
				group="background"
				label={ __( 'Background' ) }
				className="background-block-support-panel__inner-wrapper"
			/>
			<InspectorControls.Slot group="layout" label={ __( 'Layout' ) } />
			<InspectorControls.Slot
				group="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot group="border" label={ __( 'Borders' ) } />
			<InspectorControls.Slot
				group="elements"
				label={ __( 'Elements' ) }
				className="elements-block-support-panel__inner-wrapper"
			/>
			{ showPositionControls && <PositionControls /> }
			<InspectorControls.Slot group="styles" />
			{ showBindingsControls && (
				<InspectorControls.Slot group="bindings" />
			) }
			{ showAdvancedControls && (
				<div>
					<AdvancedControls />
				</div>
			) }
		</>
	);
}

function StyleStateInspectorSlots( {
	blockName,
	clientId,
	contentClientIds,
	isSectionBlock,
	selectedBlockStyleState,
} ) {
	const isViewportStyleState =
		hasViewportBlockStyleState( selectedBlockStyleState ) &&
		! hasPseudoBlockStyleState( selectedBlockStyleState );
	const showSectionStyleControls =
		isSectionBlock && blockName !== 'core/template-part';
	return (
		<>
			{ showSectionStyleControls && (
				<BlockStyleStateProvider value={ selectedBlockStyleState }>
					<SectionStyleControls
						blockName={ blockName }
						clientId={ clientId }
						contentClientIds={ contentClientIds }
					/>
				</BlockStyleStateProvider>
			) }
			{ ! showSectionStyleControls && (
				<>
					<InspectorControls.Slot
						group="typography"
						label={ __( 'Typography' ) }
					/>
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
					/>
					<InspectorControls.Slot
						group="background"
						label={ __( 'Background' ) }
						className="background-block-support-panel__inner-wrapper"
					/>
					{ isViewportStyleState && (
						<InspectorControls.Slot
							group="layout"
							label={ __( 'Layout' ) }
						/>
					) }
					<InspectorControls.Slot
						group="dimensions"
						label={ __( 'Dimensions' ) }
					/>
					<InspectorControls.Slot
						group="border"
						label={ __( 'Borders' ) }
					/>
					<InspectorControls.Slot
						group="elements"
						label={ __( 'Elements' ) }
						className="elements-block-support-panel__inner-wrapper"
					/>
				</>
			) }
			{ isViewportStyleState && (
				<InspectorControls.Slot group="viewport" />
			) }
		</>
	);
}

function BlockInspector() {
	const {
		selectedBlockCount,
		renderedBlockName,
		renderedBlockClientId,
		blockType,
		isSectionBlock,
		isSectionBlockInSelection,
		hasBlockStyles,
		editedContentOnlySection,
		blockEditingMode,
		selectedBlockStyleState,
		showStateOnCanvas,
		isResponsiveEditing,
		blockStatesEditingEnabled,
		isMixedSelection,
		selectedBlockClientIds,
		selectedSectionClientIds,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getSelectedBlockClientId,
			getSelectedBlockClientIds,
			getSelectedBlockCount,
			getBlockName,
			getParentSectionBlock,
			isSectionBlock: _isSectionBlock,
			getEditedContentOnlySection,
			isWithinEditedContentOnlySection,
			getBlockEditingMode,
			getSelectedBlockStyleState,
			isSelectedBlockStyleStateShownOnCanvas,
			isResponsiveEditing: _isResponsiveEditing,
		} = unlock( select( blockEditorStore ) );
		const { getBlockStyles } = select( blocksStore );
		const _selectedBlockClientId = getSelectedBlockClientId();
		const isWithinEditedSection = isWithinEditedContentOnlySection(
			_selectedBlockClientId
		);
		const _renderedBlockClientId = isWithinEditedSection
			? _selectedBlockClientId
			: getParentSectionBlock( _selectedBlockClientId ) ||
			  _selectedBlockClientId;
		const _renderedBlockName =
			_renderedBlockClientId && getBlockName( _renderedBlockClientId );
		const _blockType =
			_renderedBlockName && getBlockType( _renderedBlockName );
		const _selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockNames = _selectedBlockClientIds.map( ( clientId ) =>
			getBlockName( clientId )
		);
		const _isMixedSelection = new Set( selectedBlockNames ).size > 1;
		const _selectedSectionClientIds = _selectedBlockClientIds.filter(
			( id ) => _isSectionBlock( id )
		);
		const blockStyles =
			_renderedBlockName && getBlockStyles( _renderedBlockName );
		const _hasBlockStyles = blockStyles && blockStyles.length > 0;

		return {
			selectedBlockCount: getSelectedBlockCount(),
			renderedBlockClientId: _renderedBlockClientId,
			renderedBlockName: _renderedBlockName,
			blockType: _blockType,
			isSectionBlockInSelection: _selectedSectionClientIds.length > 0,
			selectedSectionClientIds: _selectedSectionClientIds,
			isSectionBlock: _isSectionBlock( _renderedBlockClientId ),
			hasBlockStyles: _hasBlockStyles,
			editedContentOnlySection: getEditedContentOnlySection(),
			blockEditingMode: getBlockEditingMode( _renderedBlockClientId ),
			selectedBlockStyleState: getSelectedBlockStyleState(
				_renderedBlockClientId
			),
			showStateOnCanvas: isSelectedBlockStyleStateShownOnCanvas(
				_renderedBlockClientId
			),
			isResponsiveEditing: _isResponsiveEditing(),
			blockStatesEditingEnabled: getSettings().blockStatesEditingEnabled,
			isMixedSelection: _isMixedSelection,
			selectedBlockClientIds: _selectedBlockClientIds,
		};
	}, [] );

	// Resolve content-only descendants and expanded mixed-selection targets with
	// the selection-specific dependencies kept out of the primary selector.
	const {
		contentClientIds,
		contentTextStyleClientIds,
		mixedSelectionTextStyleClientIds,
	} = useSelect(
		( select ) => {
			const shouldCollectSelectedTextStyleTargets =
				selectedBlockCount > 1 &&
				( isMixedSelection || selectedSectionClientIds.length > 0 );
			if (
				( ! isSectionBlock || ! renderedBlockClientId ) &&
				! shouldCollectSelectedTextStyleTargets
			) {
				return {
					contentClientIds: EMPTY_ARRAY,
					contentTextStyleClientIds: EMPTY_ARRAY,
					mixedSelectionTextStyleClientIds: EMPTY_ARRAY,
				};
			}

			const {
				getClientIdsOfDescendants,
				getBlockEditingMode,
				getBlockName,
				shouldRenderBlockListView,
			} = unlock( select( blockEditorStore ) );

			const representedClientIds =
				isSectionBlock && renderedBlockClientId
					? getContentOnlySectionClientIds(
							[ renderedBlockClientId ],
							getClientIdsOfDescendants,
							getBlockEditingMode,
							shouldRenderBlockListView
					  )
					: EMPTY_ARRAY;
			return {
				contentClientIds: representedClientIds,
				contentTextStyleClientIds: getTextStyleTargetClientIds(
					representedClientIds,
					getBlockName,
					getBlockType
				),
				mixedSelectionTextStyleClientIds:
					shouldCollectSelectedTextStyleTargets
						? getExpandedTextStyleTargetClientIds(
								selectedBlockClientIds,
								selectedSectionClientIds,
								( sectionClientId ) =>
									getContentOnlySectionClientIds(
										[ sectionClientId ],
										getClientIdsOfDescendants,
										getBlockEditingMode,
										shouldRenderBlockListView
									),
								getBlockName,
								getBlockType
						  )
						: EMPTY_ARRAY,
			};
		},
		[
			isMixedSelection,
			isSectionBlock,
			renderedBlockClientId,
			selectedBlockClientIds,
			selectedBlockCount,
			selectedSectionClientIds,
		]
	);

	const hasSharedTextStyleControls =
		mixedSelectionTextStyleClientIds.length > 0 ||
		contentTextStyleClientIds.length > 0;

	const availableTabs = useInspectorControlsTabs(
		blockType?.name,
		contentClientIds,
		isSectionBlock,
		hasBlockStyles,
		hasSharedTextStyleControls
	);
	const hasMultipleTabs = availableTabs?.length > 1;

	// The block inspector animation settings will be completely
	// removed in the future to create an API which allows the block
	// inspector to transition between what it
	// displays based on the relationship between the selected block
	// and its parent, and only enable it if the parent is controlling
	// its children blocks.
	const blockInspectorAnimationSettings =
		useBlockInspectorAnimationSettings( blockType );

	const hasSelectedBlocks = selectedBlockCount > 1;
	const isBlockStyleStateSelected = ! isDefaultBlockStyleState(
		selectedBlockStyleState
	);

	if ( hasSelectedBlocks && ! isSectionBlockInSelection ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				{ hasMultipleTabs ? (
					<InspectorControlsTabs
						tabs={ availableTabs }
						textStyleClientIds={ mixedSelectionTextStyleClientIds }
					/>
				) : (
					<>
						<MixedTextStyleControls
							clientIds={ mixedSelectionTextStyleClientIds }
						/>
						<StyleInspectorSlots
							showAdvancedControls={ false }
							showPositionControls={ false }
							showBindingsControls={ false }
						/>
					</>
				) }
			</div>
		);
	}

	if ( hasSelectedBlocks && isSectionBlockInSelection ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				<MixedTextStyleControls
					clientIds={ mixedSelectionTextStyleClientIds }
				/>
			</div>
		);
	}

	const isRenderedBlockUnregistered =
		renderedBlockName === getUnregisteredTypeHandlerName();

	/*
	 * If the rendered block is of an unregistered type, avoid showing it as an actual selection
	 * because we want the user to focus on the unregistered block warning, not block settings.
	 */
	const shouldShowWarning =
		! blockType || ! renderedBlockClientId || isRenderedBlockUnregistered;

	if ( shouldShowWarning ) {
		return (
			<span className="block-editor-block-inspector__no-blocks">
				{ __( 'No block selected.' ) }
			</span>
		);
	}

	return (
		<BlockInspectorSingleBlockWrapper
			animate={ blockInspectorAnimationSettings }
			wrapper={ ( children ) => (
				<AnimatedContainer
					blockInspectorAnimationSettings={
						blockInspectorAnimationSettings
					}
					renderedBlockClientId={ renderedBlockClientId }
				>
					{ children }
				</AnimatedContainer>
			) }
		>
			<BlockInspectorSingleBlock
				renderedBlockClientId={ renderedBlockClientId }
				blockName={ blockType.name }
				isSectionBlock={ isSectionBlock }
				availableTabs={ availableTabs }
				contentClientIds={ contentClientIds }
				textStyleClientIds={ contentTextStyleClientIds }
				hasBlockStyles={ hasBlockStyles }
				editedContentOnlySection={ editedContentOnlySection }
				blockEditingMode={ blockEditingMode }
				selectedBlockStyleState={ selectedBlockStyleState }
				showStateOnCanvas={ showStateOnCanvas }
				isResponsiveEditing={ isResponsiveEditing }
				blockStatesEditingEnabled={ blockStatesEditingEnabled }
				isBlockStyleStateSelected={ isBlockStyleStateSelected }
			/>
		</BlockInspectorSingleBlockWrapper>
	);
}

const BlockInspectorSingleBlockWrapper = ( { animate, wrapper, children } ) => {
	return animate ? wrapper( children ) : children;
};

const AnimatedContainer = ( {
	blockInspectorAnimationSettings,
	renderedBlockClientId,
	children,
} ) => {
	const animationOrigin =
		blockInspectorAnimationSettings &&
		blockInspectorAnimationSettings.enterDirection === 'leftToRight'
			? -50
			: 50;

	return (
		<motion.div
			animate={ {
				x: 0,
				opacity: 1,
				transition: {
					ease: 'easeInOut',
					duration: 0.14,
				},
			} }
			initial={ {
				x: animationOrigin,
				opacity: 0,
			} }
			key={ renderedBlockClientId }
		>
			{ children }
		</motion.div>
	);
};

const BlockInspectorSingleBlock = ( {
	// The block that is displayed in the inspector. This is the block whose
	// controls and information are shown to the user.
	renderedBlockClientId,
	blockName,
	isSectionBlock,
	availableTabs,
	contentClientIds,
	textStyleClientIds,
	hasBlockStyles,
	editedContentOnlySection,
	blockEditingMode,
	selectedBlockStyleState,
	showStateOnCanvas,
	isResponsiveEditing,
	blockStatesEditingEnabled = true,
} ) => {
	const listViewRef = useRef( null );
	const hasMultipleTabs = availableTabs?.length > 1;
	const hasPseudoState = hasPseudoBlockStyleState( selectedBlockStyleState );
	const isEditingStyleState =
		( hasViewportBlockStyleState( selectedBlockStyleState ) &&
			isResponsiveEditing ) ||
		hasPseudoBlockStyleState( selectedBlockStyleState );
	const hasParentChildBlockCards =
		editedContentOnlySection &&
		editedContentOnlySection !== renderedBlockClientId;
	const parentBlockInformation = useBlockDisplayInformation(
		editedContentOnlySection
	);
	const blockInformation = useBlockDisplayInformation(
		renderedBlockClientId
	);
	const isBlockSynced = blockInformation.isSynced;
	const {
		setSelectedBlockStyleState,
		setSelectedBlockStyleStateCanvasPreview,
	} = unlock( useDispatch( blockEditorStore ) );
	const onBlockStyleStateChange = ( value ) => {
		setSelectedBlockStyleState( renderedBlockClientId, value );
	};
	const onShowStateOnCanvasChange = ( value ) => {
		setSelectedBlockStyleStateCanvasPreview( renderedBlockClientId, value );
	};

	return (
		<div className="block-editor-block-inspector">
			{ hasParentChildBlockCards && (
				<BlockCard
					{ ...parentBlockInformation }
					className={
						parentBlockInformation?.isSynced && 'is-synced'
					}
					parentClientId={ editedContentOnlySection }
				/>
			) }
			<BlockCard
				{ ...blockInformation }
				allowParentNavigation
				className={ isBlockSynced && 'is-synced' }
				isChild={ hasParentChildBlockCards }
				clientId={ renderedBlockClientId }
				controls={
					blockEditingMode === 'default' &&
					blockStatesEditingEnabled && (
						<BlockStatesControl
							name={ blockName }
							value={ selectedBlockStyleState }
							onChange={ onBlockStyleStateChange }
						/>
					)
				}
			/>
			{ blockEditingMode === 'default' && isEditingStyleState && (
				<Spacer paddingX={ 4 } paddingY={ 2 }>
					{ hasPseudoState && (
						<ToggleControl
							label={ __( 'Show state on canvas' ) }
							checked={ showStateOnCanvas }
							onChange={ onShowStateOnCanvasChange }
						/>
					) }
					<BlockStateBadges
						name={ blockName }
						value={ selectedBlockStyleState }
						isResponsiveEditing={ isResponsiveEditing }
					/>
				</Spacer>
			) }
			<ViewportVisibilityInfo clientId={ renderedBlockClientId } />
			<EditContents clientId={ renderedBlockClientId } />
			{ ! isEditingStyleState && (
				<BlockVariationTransforms
					blockClientId={ renderedBlockClientId }
				/>
			) }
			<BlockInspectorPreTabsSlot />
			{ isEditingStyleState && (
				<StyleStateInspectorSlots
					clientId={ renderedBlockClientId }
					contentClientIds={ contentClientIds }
					isSectionBlock={ isSectionBlock }
					selectedBlockStyleState={ selectedBlockStyleState }
				/>
			) }
			{ ! isEditingStyleState && hasMultipleTabs && (
				<>
					<InspectorControlsTabs
						hasBlockStyles={ hasBlockStyles }
						clientId={ renderedBlockClientId }
						blockName={ blockName }
						tabs={ availableTabs }
						isSectionBlock={ isSectionBlock }
						contentClientIds={ contentClientIds }
						textStyleClientIds={ textStyleClientIds }
					/>
				</>
			) }
			{ ! isEditingStyleState && ! hasMultipleTabs && (
				<>
					{ hasBlockStyles && (
						<BlockStyles clientId={ renderedBlockClientId } />
					) }
					<ContentTab contentClientIds={ contentClientIds } />
					<InspectorControls.Slot group="content" />
					<InspectorControls.Slot group="list" ref={ listViewRef } />
					<ListViewContentPopover listViewRef={ listViewRef } />
					{ isSectionBlock && (
						<MixedTextStyleControls
							clientIds={ textStyleClientIds }
						/>
					) }
					{ ! isSectionBlock && <StyleInspectorSlots /> }
				</>
			) }
			{ ! isEditingStyleState && <InspectorControlsLastItem.Slot /> }
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-inspector/README.md
 */
export default BlockInspector;
