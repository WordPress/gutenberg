/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	store as blocksStore,
} from '@wordpress/blocks';
import { PanelBody, __unstableMotion as motion } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import EditContents from './edit-contents';
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import MultiSelectionInspector from '../multi-selection-inspector';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import BlockStyles from '../block-styles';
import { default as InspectorControls } from '../inspector-controls';
import { default as InspectorControlsTabs } from '../inspector-controls-tabs';
import useInspectorControlsTabs from '../inspector-controls-tabs/use-inspector-controls-tabs';
import AdvancedControls from '../inspector-controls-tabs/advanced-controls-panel';
import PositionControls from '../inspector-controls-tabs/position-controls-panel';
import useBlockInspectorAnimationSettings from './useBlockInspectorAnimationSettings';
import { useBorderPanelLabel } from '../../hooks/border';
import ContentTab from '../inspector-controls-tabs/content-tab';
import { unlock } from '../../lock-unlock';

function BlockStylesPanel( { clientId } ) {
	return (
		<PanelBody title={ __( 'Styles' ) }>
			<BlockStyles clientId={ clientId } />
		</PanelBody>
	);
}

function StyleInspectorSlots( {
	blockName,
	showAdvancedControls = true,
	showPositionControls = true,
	showListControls = false,
	showBindingsControls = true,
} ) {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );
	return (
		<>
			<InspectorControls.Slot />
			{ showListControls && <InspectorControls.Slot group="list" /> }
			<InspectorControls.Slot
				group="color"
				label={ __( 'Color' ) }
				className="color-block-support-panel__inner-wrapper"
			/>
			<InspectorControls.Slot
				group="background"
				label={ __( 'Background image' ) }
			/>
			<InspectorControls.Slot
				group="typography"
				label={ __( 'Typography' ) }
			/>
			<InspectorControls.Slot
				group="dimensions"
				label={ __( 'Dimensions' ) }
			/>
			<InspectorControls.Slot group="border" label={ borderPanelLabel } />
			<InspectorControls.Slot group="styles" />
			{ showPositionControls && <PositionControls /> }
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

function BlockInspector() {
	const {
		selectedBlockCount,
		selectedBlockClientId,
		renderedBlockName,
		renderedBlockClientId,
		blockType,
		isSectionBlock,
		isSectionBlockInSelection,
		hasBlockStyles,
		editedContentOnlySection,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectedBlockClientIds,
			getSelectedBlockCount,
			getBlockName,
			getParentSectionBlock,
			isSectionBlock: _isSectionBlock,
			getEditedContentOnlySection,
			isWithinEditedContentOnlySection,
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
			( id ) => _isSectionBlock( id )
		);
		const blockStyles =
			_renderedBlockName && getBlockStyles( _renderedBlockName );
		const _hasBlockStyles = blockStyles && blockStyles.length > 0;

		return {
			selectedBlockCount: getSelectedBlockCount(),
			selectedBlockClientId: _selectedBlockClientId,
			renderedBlockClientId: _renderedBlockClientId,
			renderedBlockName: _renderedBlockName,
			blockType: _blockType,
			isSectionBlockInSelection: _isSectionBlockInSelection,
			isSectionBlock: _isSectionBlock( _renderedBlockClientId ),
			hasBlockStyles: _hasBlockStyles,
			editedContentOnlySection: getEditedContentOnlySection(),
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
				getBlockName,
				getBlockEditingMode,
			} = unlock( select( blockEditorStore ) );

			const descendants = getClientIdsOfDescendants(
				renderedBlockClientId
			);

			// Temporary workaround for issue #71991
			// Exclude Navigation block children from Content sidebar until proper
			// drill-down experience is implemented (see #65699)
			// This prevents a poor UX where all Nav block sub-items are shown
			// when the parent block is in contentOnly mode.
			// Build a Set of all navigation block descendants for efficient lookup
			const navigationDescendants = new Set();
			descendants.forEach( ( clientId ) => {
				if ( getBlockName( clientId ) === 'core/navigation' ) {
					const navChildren = getClientIdsOfDescendants( clientId );
					navChildren.forEach( ( childId ) =>
						navigationDescendants.add( childId )
					);
				}
			} );

			return descendants.filter( ( current ) => {
				// Exclude navigation block children
				if ( navigationDescendants.has( current ) ) {
					return false;
				}

				return (
					getBlockName( current ) !== 'core/list-item' &&
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

	if ( hasSelectedBlocks && ! isSectionBlockInSelection ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				{ hasMultipleTabs ? (
					<InspectorControlsTabs tabs={ availableTabs } />
				) : (
					<StyleInspectorSlots
						blockName={ renderedBlockName }
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
				selectedBlockClientId={ selectedBlockClientId }
				blockName={ blockType.name }
				isSectionBlock={ isSectionBlock }
				availableTabs={ availableTabs }
				contentClientIds={ contentClientIds }
				hasBlockStyles={ hasBlockStyles }
				editedContentOnlySection={ editedContentOnlySection }
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
	// The actual block that is selected in the editor. This may or may not
	// be the same as the rendered block (e.g., when a child block is selected
	// but its parent section block is the main one rendered in the inspector).
	selectedBlockClientId,
	blockName,
	isSectionBlock,
	availableTabs,
	contentClientIds,
	hasBlockStyles,
	editedContentOnlySection,
} ) => {
	const hasMultipleTabs = availableTabs?.length > 1;
	const hasParentChildBlockCards =
		window?.__experimentalContentOnlyPatternInsertion &&
		editedContentOnlySection &&
		editedContentOnlySection !== renderedBlockClientId;
	const parentBlockInformation = useBlockDisplayInformation(
		editedContentOnlySection
	);
	const blockInformation = useBlockDisplayInformation(
		renderedBlockClientId
	);
	const isBlockSynced = blockInformation.isSynced;
	const shouldShowTabs = ! isBlockSynced && hasMultipleTabs;
	const isSectionBlockSelected =
		window?.__experimentalContentOnlyPatternInsertion &&
		selectedBlockClientId === renderedBlockClientId;

	return (
		<div className="block-editor-block-inspector">
			{ hasParentChildBlockCards && (
				<BlockCard
					{ ...parentBlockInformation }
					className={ parentBlockInformation.isSynced && 'is-synced' }
					parentClientId={ editedContentOnlySection }
				/>
			) }
			<BlockCard
				{ ...blockInformation }
				allowParentNavigation
				className={ isBlockSynced && 'is-synced' }
				isChild={ hasParentChildBlockCards }
				clientId={ renderedBlockClientId }
			/>
			{ window?.__experimentalContentOnlyPatternInsertion && (
				<EditContents clientId={ renderedBlockClientId } />
			) }
			<BlockVariationTransforms blockClientId={ renderedBlockClientId } />
			{ shouldShowTabs && (
				<InspectorControlsTabs
					hasBlockStyles={ hasBlockStyles }
					clientId={ renderedBlockClientId }
					blockName={ blockName }
					tabs={ availableTabs }
					isSectionBlock={ isSectionBlock }
					contentClientIds={ contentClientIds }
				/>
			) }
			{ ! shouldShowTabs && (
				<>
					{ hasBlockStyles && (
						<BlockStylesPanel clientId={ renderedBlockClientId } />
					) }
					<ContentTab
						rootClientId={ renderedBlockClientId }
						contentClientIds={ contentClientIds }
					/>
					{ ! isSectionBlock && (
						<StyleInspectorSlots
							blockName={ blockName }
							showListControls
						/>
					) }
					{ isSectionBlock &&
						isBlockSynced &&
						isSectionBlockSelected && (
							<>
								<InspectorControls.Slot />
								{ /* Allow AdvancedControls so users can adjust local attributes (e.g. additional CSS classes, HTML element). */ }
								<AdvancedControls />
							</>
						) }
				</>
			) }
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-inspector/README.md
 */
export default BlockInspector;
