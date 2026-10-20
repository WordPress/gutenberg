import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	MenuGroup,
	MenuItem,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import type { ReactNode } from 'react';
import { check } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import EditContents from './edit-contents';
import { PrivateBlockInspectorEditOriginal } from './edit-original-slot-fill';
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
import { PrivateInspectorControlsStyleStateAdvanced } from '../inspector-controls/groups';
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
import type {
	AnimatedContainerProps,
	BlockInspectorSingleBlockProps,
	BlockInspectorSingleBlockWrapperProps,
	StyleInspectorSlotsProps,
	StyleStateInspectorSlotsProps,
} from './types';
import type { BlockStyleState } from '../../hooks/types';

function StyleInspectorSlots( {
	showAdvancedControls = true,
	showPositionControls = true,
	showBindingsControls = true,
}: StyleInspectorSlotsProps ) {
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
}: StyleStateInspectorSlotsProps ) {
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
					{ isViewportStyleState && <PositionControls /> }
				</>
			) }
			{ ! isDefaultBlockStyleState( selectedBlockStyleState ) && (
				<InspectorControls.Slot group="style-state" />
			) }
			{ ! isDefaultBlockStyleState( selectedBlockStyleState ) && (
				<PrivateInspectorControlsStyleStateAdvanced.Slot />
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
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const _isSectionBlockInSelection = selectedBlockClientIds.some(
			( id: string ) => _isSectionBlock( id )
		);
		const blockStyles =
			_renderedBlockName && getBlockStyles( _renderedBlockName );
		const _hasBlockStyles = blockStyles && blockStyles.length > 0;

		return {
			selectedBlockCount: getSelectedBlockCount(),
			renderedBlockClientId: _renderedBlockClientId,
			renderedBlockName: _renderedBlockName,
			blockType: _blockType,
			isSectionBlockInSelection: _isSectionBlockInSelection,
			isSectionBlock: _isSectionBlock( _renderedBlockClientId ),
			hasBlockStyles: _hasBlockStyles,
			editedContentOnlySection: getEditedContentOnlySection(),
			blockEditingMode: getBlockEditingMode( _renderedBlockClientId ),
			selectedBlockStyleState: _renderedBlockClientId
				? getSelectedBlockStyleState( _renderedBlockClientId )
				: undefined,
			showStateOnCanvas: isSelectedBlockStyleStateShownOnCanvas(
				_renderedBlockClientId
			),
			isResponsiveEditing: _isResponsiveEditing(),
			blockStatesEditingEnabled: getSettings().blockStatesEditingEnabled,
		};
	}, [] );

	// Separate useSelect for contentClientIds with proper dependencies
	const contentClientIds = useSelect(
		( select ) => {
			if ( ! isSectionBlock || ! renderedBlockClientId ) {
				return [];
			}

			const {
				getClientIdsOfDescendants,
				getBlockEditingMode,
				shouldRenderBlockListView,
			} = unlock( select( blockEditorStore ) );

			const descendants = getClientIdsOfDescendants(
				renderedBlockClientId
			);

			// Exclude items from the content tab that are already present in the
			// List View tab.
			const listViewDescendants = new Set< string >();
			descendants.forEach( ( clientId: string ) => {
				if ( shouldRenderBlockListView( clientId ) ) {
					const listViewChildren =
						getClientIdsOfDescendants( clientId );
					listViewChildren.forEach( ( childId: string ) =>
						listViewDescendants.add( childId )
					);
				}
			} );

			return descendants.filter( ( current: string ) => {
				return (
					! listViewDescendants.has( current ) &&
					getBlockEditingMode( current ) === 'contentOnly'
				);
			} );
		},
		[ isSectionBlock, renderedBlockClientId ]
	);

	const availableTabs = useInspectorControlsTabs(
		blockType?.name,
		contentClientIds,
		isSectionBlock,
		hasBlockStyles
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
					<InspectorControlsTabs tabs={ availableTabs } />
				) : (
					<StyleInspectorSlots
						showAdvancedControls={ false }
						showPositionControls={ false }
						showBindingsControls={ false }
					/>
				) }
			</div>
		);
	}

	if ( hasSelectedBlocks && isSectionBlockInSelection ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
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
			wrapper={ ( children: ReactNode ) => (
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
				hasBlockStyles={ hasBlockStyles }
				editedContentOnlySection={ editedContentOnlySection }
				blockEditingMode={ blockEditingMode }
				selectedBlockStyleState={ selectedBlockStyleState }
				showStateOnCanvas={ showStateOnCanvas }
				isResponsiveEditing={ isResponsiveEditing }
				blockStatesEditingEnabled={ blockStatesEditingEnabled }
				// @ts-expect-error The single block view ignores `isBlockStyleStateSelected`.
				isBlockStyleStateSelected={ isBlockStyleStateSelected }
			/>
		</BlockInspectorSingleBlockWrapper>
	);
}

const BlockInspectorSingleBlockWrapper = ( {
	animate,
	wrapper,
	children,
}: BlockInspectorSingleBlockWrapperProps ) => {
	return animate ? wrapper( children ) : children;
};

const AnimatedContainer = ( {
	blockInspectorAnimationSettings,
	renderedBlockClientId,
	children,
}: AnimatedContainerProps ) => {
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
	hasBlockStyles,
	editedContentOnlySection,
	blockEditingMode,
	selectedBlockStyleState,
	showStateOnCanvas,
	isResponsiveEditing,
	blockStatesEditingEnabled = true,
}: BlockInspectorSingleBlockProps ) => {
	const listViewRef = useRef< HTMLDivElement >( null );
	const hasMultipleTabs = availableTabs?.length > 1;
	const isEditingStyleState =
		( hasViewportBlockStyleState( selectedBlockStyleState ) &&
			isResponsiveEditing ) ||
		hasPseudoBlockStyleState( selectedBlockStyleState );
	// When a style state is active, the badges replace the block description.
	const showStateBadges =
		blockEditingMode === 'default' && isEditingStyleState;
	const hasParentChildBlockCards =
		editedContentOnlySection &&
		editedContentOnlySection !== renderedBlockClientId;
	// The hook returns `null` without a client ID.
	const parentBlockInformation = useBlockDisplayInformation(
		editedContentOnlySection as string
	);
	// The rendered block has a block type, so it has display information.
	const blockInformation = useBlockDisplayInformation(
		renderedBlockClientId
	)!;
	const isBlockSynced = blockInformation.isSynced;
	const {
		setSelectedBlockStyleState,
		setSelectedBlockStyleStateCanvasPreview,
	} = unlock( useDispatch( blockEditorStore ) );
	const onBlockStyleStateChange = ( value: BlockStyleState ) => {
		setSelectedBlockStyleState( renderedBlockClientId, value );
	};
	const onShowStateOnCanvasChange = ( value: boolean ) => {
		setSelectedBlockStyleStateCanvasPreview( renderedBlockClientId, value );
	};

	return (
		<div className="block-editor-block-inspector">
			{ hasParentChildBlockCards && (
				<BlockCard
					{ ...parentBlockInformation }
					// `BlockCard` passes the class name to `clsx`.
					className={
						( parentBlockInformation?.isSynced &&
							'is-synced' ) as string
					}
					parentClientId={ editedContentOnlySection }
				/>
			) }
			<BlockCard
				{ ...blockInformation }
				description={
					showStateBadges ? undefined : blockInformation.description
				}
				allowParentNavigation
				// `BlockCard` passes the class name to `clsx`.
				className={ ( isBlockSynced && 'is-synced' ) as string }
				// `BlockCard` only checks whether this is truthy.
				isChild={ hasParentChildBlockCards as boolean }
				clientId={ renderedBlockClientId }
				controls={
					blockEditingMode === 'default' &&
					blockStatesEditingEnabled && (
						<BlockStatesControl
							name={ blockName }
							value={ selectedBlockStyleState }
							onChange={ onBlockStyleStateChange }
						>
							<MenuGroup>
								<MenuItem
									role="menuitemcheckbox"
									isSelected={ showStateOnCanvas }
									icon={ showStateOnCanvas ? check : null }
									// Previewing is only meaningful while a
									// non-default pseudo state is selected.
									disabled={
										! hasPseudoBlockStyleState(
											selectedBlockStyleState
										)
									}
									onClick={ () =>
										onShowStateOnCanvasChange(
											! showStateOnCanvas
										)
									}
								>
									{ __( 'Preview on canvas' ) }
								</MenuItem>
							</MenuGroup>
						</BlockStatesControl>
					)
				}
			/>
			{ showStateBadges && (
				<div className="block-editor-block-inspector__state-badges">
					<Text
						variant="body-sm"
						className="block-editor-block-inspector__state-badges-text"
					>
						{
							/* translators: Instructive text shown before the style state badges in the block inspector; the badges indicate the style states the user is currently editing. */
							__( 'Editing:' )
						}
					</Text>
					<BlockStateBadges
						name={ blockName }
						value={ selectedBlockStyleState }
						isResponsiveEditing={ isResponsiveEditing }
					/>
				</div>
			) }
			<ViewportVisibilityInfo clientId={ renderedBlockClientId } />
			<EditContents clientId={ renderedBlockClientId } />
			<PrivateBlockInspectorEditOriginal.Slot
				fillProps={ { clientId: renderedBlockClientId } }
			/>
			{ ! isEditingStyleState && (
				<BlockVariationTransforms
					blockClientId={ renderedBlockClientId }
				/>
			) }
			<BlockInspectorPreTabsSlot />
			{ isEditingStyleState && (
				// @ts-expect-error Bug: without `blockName`, template parts get the section controls.
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
