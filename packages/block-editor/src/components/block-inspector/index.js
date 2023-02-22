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
import {
	FlexItem,
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import MultiSelectionInspector from '../multi-selection-inspector';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import DefaultStylePicker from '../default-style-picker';
import { default as InspectorControls } from '../inspector-controls';
import { default as InspectorControlsTabs } from '../inspector-controls-tabs';
import useInspectorControlsTabs from '../inspector-controls-tabs/use-inspector-controls-tabs';
import AdvancedControls from '../inspector-controls-tabs/advanced-controls-panel';
import PositionControls from '../inspector-controls-tabs/position-controls-panel';
import useBlockInspectorAnimationSettings from './useBlockInspectorAnimationSettings';

function useContentBlocks( blockTypes, block ) {
	const contentBlocksObjectAux = useMemo( () => {
		return blockTypes.reduce( ( result, blockType ) => {
			if (
				blockType.name !== 'core/list-item' &&
				Object.entries( blockType.attributes ).some(
					( [ , { __experimentalRole } ] ) =>
						__experimentalRole === 'content'
				)
			) {
				result[ blockType.name ] = true;
			}
			return result;
		}, {} );
	}, [ blockTypes ] );
	const isContentBlock = useCallback(
		( blockName ) => {
			return !! contentBlocksObjectAux[ blockName ];
		},
		[ contentBlocksObjectAux ]
	);
	return useMemo( () => {
		return getContentBlocks( [ block ], isContentBlock );
	}, [ block, isContentBlock ] );
}

function getContentBlocks( blocks, isContentBlock ) {
	const result = [];
	for ( const block of blocks ) {
		if ( isContentBlock( block.name ) ) {
			result.push( block );
		}
		result.push( ...getContentBlocks( block.innerBlocks, isContentBlock ) );
	}
	return result;
}

function BlockNavigationButton( { blockTypes, block, selectedBlock } ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const blockType = blockTypes.find( ( { name } ) => name === block.name );
	const isSelected =
		selectedBlock && selectedBlock.clientId === block.clientId;
	return (
		<Button
			isPressed={ isSelected }
			onClick={ () => selectBlock( block.clientId ) }
		>
			<HStack justify="flex-start">
				<BlockIcon icon={ blockType.icon } />
				<FlexItem>{ blockType.title }</FlexItem>
			</HStack>
		</Button>
	);
}

function BlockInspectorLockedBlocks( { topLevelLockedBlock } ) {
	const { blockTypes, block, selectedBlock } = useSelect(
		( select ) => {
			return {
				blockTypes: select( blocksStore ).getBlockTypes(),
				block: select( blockEditorStore ).getBlock(
					topLevelLockedBlock
				),
				selectedBlock: select( blockEditorStore ).getSelectedBlock(),
			};
		},
		[ topLevelLockedBlock ]
	);
	const blockInformation = useBlockDisplayInformation( topLevelLockedBlock );
	const contentBlocks = useContentBlocks( blockTypes, block );
	return (
		<div className="block-editor-block-inspector">
			<BlockCard
				{ ...blockInformation }
				className={ blockInformation.isSynced && 'is-synced' }
			/>
			<BlockVariationTransforms blockClientId={ topLevelLockedBlock } />
			<VStack
				spacing={ 1 }
				padding={ 4 }
				className="block-editor-block-inspector__block-buttons-container"
			>
				<h2 className="block-editor-block-card__title">
					{ __( 'Content' ) }
				</h2>
				{ contentBlocks.map( ( contentBlock ) => (
					<BlockNavigationButton
						selectedBlock={ selectedBlock }
						key={ contentBlock.clientId }
						block={ contentBlock }
						blockTypes={ blockTypes }
					/>
				) ) }
			</VStack>
		</div>
	);
}

const BlockInspector = ( { showNoBlockSelectedMessage = true } ) => {
	const {
		count,
		selectedBlockName,
		selectedBlockClientId,
		blockType,
		topLevelLockedBlock,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectedBlockCount,
			getBlockName,
			__unstableGetContentLockingParent,
			getTemplateLock,
		} = select( blockEditorStore );

		const _selectedBlockClientId = getSelectedBlockClientId();
		const _selectedBlockName =
			_selectedBlockClientId && getBlockName( _selectedBlockClientId );
		const _blockType =
			_selectedBlockName && getBlockType( _selectedBlockName );

		return {
			count: getSelectedBlockCount(),
			selectedBlockClientId: _selectedBlockClientId,
			selectedBlockName: _selectedBlockName,
			blockType: _blockType,
			topLevelLockedBlock:
				__unstableGetContentLockingParent( _selectedBlockClientId ) ||
				( getTemplateLock( _selectedBlockClientId ) === 'contentOnly'
					? _selectedBlockClientId
					: undefined ),
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
	const blockInspectorAnimationSettings = useBlockInspectorAnimationSettings(
		blockType,
		selectedBlockClientId
	);

	if ( count > 1 ) {
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
							group="typography"
							label={ __( 'Typography' ) }
						/>
						<InspectorControls.Slot
							group="dimensions"
							label={ __( 'Dimensions' ) }
						/>
						<InspectorControls.Slot
							group="border"
							label={ __( 'Border' ) }
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
		if ( showNoBlockSelectedMessage ) {
			return (
				<span className="block-editor-block-inspector__no-blocks">
					{ __( 'No block selected.' ) }
				</span>
			);
		}
		return null;
	}
	if ( topLevelLockedBlock ) {
		return (
			<BlockInspectorLockedBlocks
				topLevelLockedBlock={ topLevelLockedBlock }
			/>
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
			/>
		</BlockInspectorSingleBlockWrapper>
	);
};

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

const BlockInspectorSingleBlock = ( { clientId, blockName } ) => {
	const availableTabs = useInspectorControlsTabs( blockName );
	const showTabs = availableTabs?.length > 1;

	const hasBlockStyles = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			const blockStyles = getBlockStyles( blockName );
			return blockStyles && blockStyles.length > 0;
		},
		[ blockName ]
	);
	const blockInformation = useBlockDisplayInformation( clientId );

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
						<div>
							<PanelBody title={ __( 'Styles' ) }>
								<BlockStyles clientId={ clientId } />
								{ hasBlockSupport(
									blockName,
									'defaultStylePicker',
									true
								) && (
									<DefaultStylePicker
										blockName={ blockName }
									/>
								) }
							</PanelBody>
						</div>
					) }
					<InspectorControls.Slot />
					<InspectorControls.Slot
						group="color"
						label={ __( 'Color' ) }
						className="color-block-support-panel__inner-wrapper"
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
						label={ __( 'Border' ) }
					/>
					<InspectorControls.Slot group="styles" />
					<PositionControls />
					<div>
						<AdvancedControls />
					</div>
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
