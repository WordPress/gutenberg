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
import BlockQuickNavigation from '../block-quick-navigation';
import { useBorderPanelLabel } from '../../hooks/border';

import { unlock } from '../../lock-unlock';

function BlockStylesPanel( { clientId } ) {
	return (
		<PanelBody title={ __( 'Styles' ) }>
			<BlockStyles clientId={ clientId } />
		</PanelBody>
	);
}

function BlockInspector() {
	const {
		count,
		selectedBlockName,
		selectedBlockClientId,
		blockType,
		isSectionBlock,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectedBlockCount,
			getBlockName,
			getParentSectionBlock,
			isSectionBlock: _isSectionBlock,
		} = unlock( select( blockEditorStore ) );
		const _selectedBlockClientId = getSelectedBlockClientId();
		const renderedBlockClientId =
			getParentSectionBlock( _selectedBlockClientId ) ||
			getSelectedBlockClientId();
		const _selectedBlockName =
			renderedBlockClientId && getBlockName( renderedBlockClientId );
		const _blockType =
			_selectedBlockName && getBlockType( _selectedBlockName );

		return {
			count: getSelectedBlockCount(),
			selectedBlockClientId: renderedBlockClientId,
			selectedBlockName: _selectedBlockName,
			blockType: _blockType,
			isSectionBlock: _isSectionBlock( renderedBlockClientId ),
		};
	}, [] );

	const availableTabs = useInspectorControlsTabs( blockType?.name );
	const showTabs = availableTabs?.length > 1;

	// The block inspector animation settings will be completely
	// removed in the future to create an API which allows the block
	// inspector to transition between what it
	// displays based on the relationship between the selected block
	// and its parent, and only enable it if the parent is controlling
	// its children blocks.
	const blockInspectorAnimationSettings =
		useBlockInspectorAnimationSettings( blockType );

	const borderPanelLabel = useBorderPanelLabel( {
		blockName: selectedBlockName,
	} );

	if ( count > 1 && ! isSectionBlock ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				{ showTabs ? (
					<InspectorControlsTabs tabs={ availableTabs } />
				) : (
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
						<InspectorControls.Slot
							group="border"
							label={ borderPanelLabel }
						/>
						<InspectorControls.Slot group="styles" />
					</>
				) }
			</div>
		);
	}

	const isSelectedBlockUnregistered =
		selectedBlockName === getUnregisteredTypeHandlerName();

	/*
	 * If the selected block is of an unregistered type, avoid showing it as an actual selection
	 * because we want the user to focus on the unregistered block warning, not block settings.
	 */
	if (
		! blockType ||
		! selectedBlockClientId ||
		isSelectedBlockUnregistered
	) {
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
					selectedBlockClientId={ selectedBlockClientId }
				>
					{ children }
				</AnimatedContainer>
			) }
		>
			<BlockInspectorSingleBlock
				clientId={ selectedBlockClientId }
				blockName={ blockType.name }
				isSectionBlock={ isSectionBlock }
			/>
		</BlockInspectorSingleBlockWrapper>
	);
}

const BlockInspectorSingleBlockWrapper = ( { animate, wrapper, children } ) => {
	return animate ? wrapper( children ) : children;
};

const AnimatedContainer = ( {
	blockInspectorAnimationSettings,
	selectedBlockClientId,
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
			key={ selectedBlockClientId }
		>
			{ children }
		</motion.div>
	);
};

const BlockInspectorSingleBlock = ( {
	clientId,
	blockName,
	isSectionBlock,
} ) => {
	const availableTabs = useInspectorControlsTabs( blockName );
	const showTabs = ! isSectionBlock && availableTabs?.length > 1;

	const hasBlockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			const blockStyles = getBlockStyles( blockName );
			return blockStyles && blockStyles.length > 0;
		},
		[ blockName ]
	);
	const blockInformation = useBlockDisplayInformation( clientId );
	const borderPanelLabel = useBorderPanelLabel( { blockName } );
	const contentClientIds = useSelect(
		( select ) => {
			// Avoid unnecessary subscription.
			if ( ! isSectionBlock ) {
				return;
			}

			const {
				getClientIdsOfDescendants,
				getBlockName,
				getBlockEditingMode,
			} = select( blockEditorStore );
			return getClientIdsOfDescendants( clientId ).filter(
				( current ) =>
					getBlockName( current ) !== 'core/list-item' &&
					getBlockEditingMode( current ) === 'contentOnly'
			);
		},
		[ isSectionBlock, clientId ]
	);

	return (
		<div className="block-editor-block-inspector">
			<BlockCard
				{ ...blockInformation }
				className={ blockInformation.isSynced && 'is-synced' }
			/>
			<BlockVariationTransforms blockClientId={ clientId } />
			{ showTabs && (
				<InspectorControlsTabs
					hasBlockStyles={ hasBlockStyles }
					clientId={ clientId }
					blockName={ blockName }
					tabs={ availableTabs }
				/>
			) }
			{ ! showTabs && (
				<>
					{ hasBlockStyles && (
						<BlockStylesPanel clientId={ clientId } />
					) }

					{ contentClientIds && contentClientIds?.length > 0 && (
						<PanelBody title={ __( 'Content' ) }>
							<BlockQuickNavigation
								clientIds={ contentClientIds }
							/>
						</PanelBody>
					) }

					{ ! isSectionBlock && (
						<>
							<InspectorControls.Slot />
							<InspectorControls.Slot group="list" />
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
							<InspectorControls.Slot
								group="border"
								label={ borderPanelLabel }
							/>
							<InspectorControls.Slot group="styles" />
							<PositionControls />
							<InspectorControls.Slot group="bindings" />
							<div>
								<AdvancedControls />
							</div>
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
