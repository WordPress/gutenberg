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
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TabPanel,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { cog, listView, styles } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import InspectorControlsGroups from '../inspector-controls/groups';
import BlockStyles from '../block-styles';
import MultiSelectionInspector from '../multi-selection-inspector';
import DefaultStylePicker from '../default-style-picker';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

const TAB_MENU = {
	name: 'menu',
	title: 'Menu',
	value: 'menu',
	icon: listView,
};

const TAB_SETTINGS = {
	name: 'settings',
	title: 'Settings',
	value: 'settings',
	icon: cog,
};

const TAB_APPEARANCE = {
	name: 'appearance',
	title: 'Appearance',
	value: 'appearance',
	icon: styles,
};

function useInspectorControlsTabs() {
	const tabs = [];
	const {
		border: borderGroup,
		color: colorGroup,
		default: defaultGroup,
		dimensions: dimensionsGroup,
		menu: menuGroup,
		typography: typographyGroup,
	} = InspectorControlsGroups;

	// Menu Tab: If there are any fills for the menu group add that tab.
	const menuFills = useSlotFills( menuGroup.Slot.__unstableName );

	if ( !! menuFills && menuFills.length ) {
		tabs.push( TAB_MENU );
	}

	// Settings Tab: If there are any fills for the general InspectorControls
	// or Advanced Controls slot, then add this tab.
	const settingsFills = [
		...( useSlotFills( defaultGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( InspectorAdvancedControls.slotName ) || [] ),
	];

	if ( settingsFills.length ) {
		tabs.push( TAB_SETTINGS );
	}

	// Appearance Tab: Add this tab if there are any fills for block supports
	// e.g. border, color, spacing, typography, etc.
	const appearanceFills = [
		...( useSlotFills( borderGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( colorGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( dimensionsGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( typographyGroup.Slot.__unstableName ) || [] ),
	];

	if ( appearanceFills.length ) {
		tabs.push( TAB_APPEARANCE );
	}

	return tabs;
}

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
		[ blockTypes ]
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
			<BlockCard { ...blockInformation } />
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
	const availableTabs = useInspectorControlsTabs();

	if ( count > 1 ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				{ !! availableTabs.length && (
					<TabPanel
						className="block-editor-block-inspector__tabs"
						tabs={ availableTabs }
					>
						{ ( tab ) => {
							if ( tab.name === TAB_MENU.name ) {
								return (
									<InspectorControls.Slot __experimentalGroup="menu" />
								);
							}

							if ( tab.name === TAB_SETTINGS.name ) {
								return <InspectorControls.Slot />;
							}

							if ( tab.name === TAB_APPEARANCE.name ) {
								return (
									<>
										<InspectorControls.Slot
											__experimentalGroup="color"
											label={ __( 'Color' ) }
											className="color-block-support-panel__inner-wrapper"
										/>
										<InspectorControls.Slot
											__experimentalGroup="typography"
											label={ __( 'Typography' ) }
										/>
										<InspectorControls.Slot
											__experimentalGroup="dimensions"
											label={ __( 'Dimensions' ) }
										/>
										<InspectorControls.Slot
											__experimentalGroup="border"
											label={ __( 'Border' ) }
										/>
									</>
								);
							}
						} }
					</TabPanel>
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
		<BlockInspectorSingleBlock
			clientId={ selectedBlockClientId }
			blockName={ blockType.name }
			tabs={ availableTabs }
		/>
	);
};

const BlockInspectorSingleBlock = ( { clientId, blockName, tabs } ) => {
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
			<BlockCard { ...blockInformation } />
			<BlockVariationTransforms blockClientId={ clientId } />
			{ !! tabs.length && (
				<TabPanel
					className="block-editor-block-inspector__tabs"
					tabs={ tabs }
				>
					{ ( tab ) => {
						if ( tab.name === TAB_MENU.name ) {
							return (
								<InspectorControls.Slot __experimentalGroup="menu" />
							);
						}

						if ( tab.name === TAB_SETTINGS.name ) {
							return (
								<>
									<InspectorControls.Slot />
									<div>
										<AdvancedControls />
									</div>
								</>
							);
						}

						if ( tab.name === TAB_APPEARANCE.name ) {
							return (
								<>
									{ hasBlockStyles && (
										<div>
											<PanelBody title={ __( 'Styles' ) }>
												<BlockStyles
													clientId={ clientId }
												/>
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
									<InspectorControls.Slot
										__experimentalGroup="color"
										label={ __( 'Color' ) }
										className="color-block-support-panel__inner-wrapper"
									/>
									<InspectorControls.Slot
										__experimentalGroup="typography"
										label={ __( 'Typography' ) }
									/>
									<InspectorControls.Slot
										__experimentalGroup="dimensions"
										label={ __( 'Dimensions' ) }
									/>
									<InspectorControls.Slot
										__experimentalGroup="border"
										label={ __( 'Border' ) }
									/>
								</>
							);
						}
					} }
				</TabPanel>
			) }
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

const AdvancedControls = () => {
	const fills = useSlotFills( InspectorAdvancedControls.slotName );
	const hasFills = Boolean( fills && fills.length );

	if ( ! hasFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ false }
		>
			<InspectorControls.Slot __experimentalGroup="advanced" />
		</PanelBody>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-inspector/README.md
 */
export default BlockInspector;
