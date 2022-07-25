/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	getBlockType,
	getUnregisteredTypeHandlerName,
	hasBlockSupport,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	PanelBody,
	__experimentalUseSlot as useSlot,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
import { chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SkipToSelectedBlock from '../skip-to-selected-block';
import BlockCard from '../block-card';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import BlockStyles from '../block-styles';
import MultiSelectionInspector from '../multi-selection-inspector';
import DefaultStylePicker from '../default-style-picker';
import BlockVariationTransforms from '../block-variation-transforms';
import useBlockDisplayInformation from '../use-block-display-information';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';

function useContentBlocks( blockTypes, block ) {
	const contenBlocksObjectAux = useMemo( () => {
		return blockTypes.reduce( ( result, blockType ) => {
			if (
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
			return !! contenBlocksObjectAux[ blockName ];
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

function BlockInspectorNavigationEffects( { children } ) {
	const { selectBlock } = useDispatch( blockEditorStore );
	const { goTo, location } = useNavigator();
	const lastLocationClientId = useRef();
	const updatingSelectionTo = useRef();
	const locationClientId = useMemo( () => {
		if ( location.path.startsWith( '/block/' ) ) {
			return location.path.substring( '/block/'.length );
		}
	}, [ location.path ] );
	const selectedBlockId = useSelect( ( select ) => {
		return select( blockEditorStore ).getSelectedBlockClientId();
	} );
	// When the location changes update the selection to match the new location.
	useEffect( () => {
		lastLocationClientId.current = locationClientId;
		if ( locationClientId && selectedBlockId !== locationClientId ) {
			updatingSelectionTo.current = locationClientId;
			selectBlock( locationClientId );
		}
	}, [ locationClientId ] );
	// When the selection changes update the location to root if no selection update to match location is in progress.
	useEffect( () => {
		if ( updatingSelectionTo.current ) {
			updatingSelectionTo.current = undefined;
		} else if ( lastLocationClientId.current ) {
			goTo( '/' );
		}
	}, [ selectedBlockId ] );

	return children;
}

function BlockNavigationButton( { blockTypes, block, selectedBlock } ) {
	const blockType = blockTypes.find( ( { name } ) => name === block.name );
	return (
		<NavigatorButton
			path={ `/block/${ block.clientId }` }
			style={
				selectedBlock.clientId === block.clientId
					? { color: 'var(--wp-admin-theme-color)' }
					: {}
			}
		>
			<HStack justify="flex-start">
				<BlockIcon icon={ blockType.icon } />
				<FlexItem>{ blockType.title }</FlexItem>
			</HStack>
		</NavigatorButton>
	);
}

function BlockNavigatorScreen( { block } ) {
	return (
		<NavigatorScreen path={ `/block/${ block.clientId }` }>
			<BlockInspectorSingleBlock
				clientId={ block.clientId }
				blockName={ block.name }
				backButton={
					<NavigatorBackButton
						style={
							// TODO: This style override is also used in ToolsPanelHeader.
							// It should be supported out-of-the-box by Button.
							{ minWidth: 24, padding: 0 }
						}
						icon={ isRTL() ? chevronRight : chevronLeft }
						isSmall
						aria-label={ __( 'Navigate to the previous view' ) }
					/>
				}
			/>
		</NavigatorScreen>
	);
}

function BlockInspectorAbsorvedBy( { absorvedBy } ) {
	const { blockTypes, block, selectedBlock } = useSelect(
		( select ) => {
			return {
				blockTypes: select( blocksStore ).getBlockTypes(),
				block: select( blockEditorStore ).getBlock( absorvedBy ),
				selectedBlock: select( blockEditorStore ).getSelectedBlock(),
			};
		},
		[ absorvedBy ]
	);
	const blockInformation = useBlockDisplayInformation( absorvedBy );
	const contentBlocks = useContentBlocks( blockTypes, block );
	const showSelectedBlock =
		absorvedBy !== selectedBlock.clientId &&
		! contentBlocks.some(
			( contentBlock ) => contentBlock.clientId === selectedBlock.clientId
		);
	return (
		<div className="block-editor-block-inspector">
			<NavigatorProvider initialPath="/">
				<BlockInspectorNavigationEffects>
					<NavigatorScreen path="/">
						<BlockCard { ...blockInformation } />
						<BlockVariationTransforms
							blockClientId={ absorvedBy }
						/>
						<VStack
							spacing={ 1 }
							padding={ 4 }
							className="block-editor-block-inspector__block-buttons-container"
						>
							<h2 className="block-editor-block-card__title">
								{ __( 'Content' ) }
							</h2>
							<BlockNavigationButton
								selectedBlock={ selectedBlock }
								block={ block }
								blockTypes={ blockTypes }
							/>
							{ contentBlocks.map( ( contentBlock ) => (
								<BlockNavigationButton
									selectedBlock={ selectedBlock }
									key={ contentBlock.clientId }
									block={ contentBlock }
									blockTypes={ blockTypes }
								/>
							) ) }
							{ showSelectedBlock && (
								<>
									<h2 className="block-editor-block-card__title">
										{ __( 'Selected block' ) }
									</h2>
									<BlockNavigationButton
										selectedBlock={ selectedBlock }
										block={ selectedBlock }
										blockTypes={ blockTypes }
									/>
								</>
							) }
							;
						</VStack>
					</NavigatorScreen>
					<BlockNavigatorScreen block={ block } />
					{ contentBlocks.map( ( contentBlock ) => {
						return (
							<BlockNavigatorScreen
								key={ contentBlock.clientId }
								block={ contentBlock }
							/>
						);
					} ) }
					{ showSelectedBlock && (
						<BlockNavigatorScreen block={ selectedBlock } />
					) }
				</BlockInspectorNavigationEffects>
			</NavigatorProvider>
		</div>
	);
}

const BlockInspector = ( { showNoBlockSelectedMessage = true } ) => {
	const {
		count,
		selectedBlockName,
		selectedBlockClientId,
		blockType,
		absorvedBy,
	} = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getSelectedBlockCount,
			getBlockName,
			__unstableGetContentLockingParent,
			getBlockAttributes,
		} = select( blockEditorStore );
		const { getBlockStyles } = select( blocksStore );

		const _selectedBlockClientId = getSelectedBlockClientId();
		const _selectedBlockName =
			_selectedBlockClientId && getBlockName( _selectedBlockClientId );
		const _blockType =
			_selectedBlockName && getBlockType( _selectedBlockName );
		const blockStyles =
			_selectedBlockName && getBlockStyles( _selectedBlockName );

		return {
			count: getSelectedBlockCount(),
			selectedBlockClientId: _selectedBlockClientId,
			selectedBlockName: _selectedBlockName,
			blockType: _blockType,
			hasBlockStyles: blockStyles && blockStyles.length > 0,
			absorvedBy: getBlockAttributes( _selectedBlockClientId )?.lock
				?.content
				? _selectedBlockClientId
				: __unstableGetContentLockingParent( _selectedBlockClientId ),
		};
	}, [] );

	if ( count > 1 ) {
		return (
			<div className="block-editor-block-inspector">
				<MultiSelectionInspector />
				<InspectorControls.Slot />
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
	if ( absorvedBy ) {
		return <BlockInspectorAbsorvedBy absorvedBy={ absorvedBy } />;
	}
	return (
		<BlockInspectorSingleBlock
			clientId={ selectedBlockClientId }
			blockName={ blockType.name }
		/>
	);
};

const BlockInspectorSingleBlock = ( { clientId, blockName, backButton } ) => {
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
			<BlockCard backButton={ backButton } { ...blockInformation } />
			<BlockVariationTransforms blockClientId={ clientId } />
			{ hasBlockStyles && (
				<div>
					<PanelBody title={ __( 'Styles' ) }>
						<BlockStyles
							scope="core/block-inspector"
							clientId={ clientId }
						/>
						{ hasBlockSupport(
							blockName,
							'defaultStylePicker',
							true
						) && <DefaultStylePicker blockName={ blockName } /> }
					</PanelBody>
				</div>
			) }
			<InspectorControls.Slot />
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
			<div>
				<AdvancedControls />
			</div>
			<SkipToSelectedBlock key="back" />
		</div>
	);
};

const AdvancedControls = () => {
	const slot = useSlot( InspectorAdvancedControls.slotName );
	const hasFills = Boolean( slot.fills && slot.fills.length );

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
