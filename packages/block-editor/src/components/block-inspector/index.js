/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import { __unstableMotion as motion } from '@wordpress/components';
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
import ViewportVisibilityInfo from '../block-visibility/viewport-visibility-info';
import { unlock } from '../../lock-unlock';

function StyleInspectorSlots( {
	blockName,
	showAdvancedControls = true,
	showPositionControls = true,
	showBindingsControls = true,
} ) {
	const borderPanelLabel = useBorderPanelLabel( { blockName } );
	return (
		<>
			<InspectorControls.Slot />
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

			// Exclude items from the content tab that are already present in the
			// List View tab.
			const listViewDescendants = new Set();
			descendants.forEach( ( clientId ) => {
				const blockName = getBlockName( clientId );
				// Navigation block doesn't have List View block support, but
				// it does have a custom implementation that is shown within
				// patterns, so it's included in this condition.
				if (
					blockName === 'core/navigation' ||
					hasBlockSupport( blockName, 'listView' )
				) {
					const listViewChildren =
						getClientIdsOfDescendants( clientId );
					listViewChildren.forEach( ( childId ) =>
						listViewDescendants.add( childId )
					);
				}
			} );

			return descendants.filter( ( current ) => {
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
	blockName,
	isSectionBlock,
	availableTabs,
	contentClientIds,
	hasBlockStyles,
	editedContentOnlySection,
} ) => {
	const hasMultipleTabs = availableTabs?.length > 1;
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
			<ViewportVisibilityInfo clientId={ renderedBlockClientId } />
			<EditContents clientId={ renderedBlockClientId } />
			<BlockVariationTransforms blockClientId={ renderedBlockClientId } />
			{ hasMultipleTabs && (
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
			{ ! hasMultipleTabs && (
				<>
					{ hasBlockStyles && (
						<BlockStyles clientId={ renderedBlockClientId } />
					) }
					<ContentTab contentClientIds={ contentClientIds } />
					<InspectorControls.Slot group="content" />
					<InspectorControls.Slot group="list" />
					{ ! isSectionBlock && (
						<StyleInspectorSlots blockName={ blockName } />
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
