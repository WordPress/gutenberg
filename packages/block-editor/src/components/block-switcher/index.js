/**
 * WordPress dependencies
 */
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarGroup,
	ToolbarItem,
	__experimentalText as Text,
	MenuGroup,
} from '@wordpress/components';
import {
	switchToBlockType,
	store as blocksStore,
	isReusableBlock,
	isTemplatePart,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockTransformationsMenu from './block-transformations-menu';
import { useBlockVariationTransforms } from './block-variation-transformations';
import BlockStylesMenu from './block-styles-menu';
import PatternTransformationsMenu from './pattern-transformations-menu';

function BlockSwitcherDropdownMenuContents( { onClose, clientIds } ) {
	const { replaceBlocks, multiSelect, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const {
		possibleBlockTransformations,
		patterns,
		blocks,
		isUsingBindings,
		canRemove,
		hasBlockStyles,
	} = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlocksByClientId,
				getBlockRootClientId,
				getBlockTransformItems,
				__experimentalGetPatternTransformItems,
				canRemoveBlocks,
				getBlockName,
			} = select( blockEditorStore );
			const { getBlockStyles } = select( blocksStore );
			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const _blocks = getBlocksByClientId( clientIds );
			const _isSingleBlock = clientIds.length === 1;
			const _blockName = _isSingleBlock && getBlockName( clientIds[ 0 ] );
			const _hasBlockStyles =
				_isSingleBlock && !! getBlockStyles( _blockName )?.length;
			return {
				blocks: _blocks,
				possibleBlockTransformations: getBlockTransformItems(
					_blocks,
					rootClientId
				),
				patterns: __experimentalGetPatternTransformItems(
					_blocks,
					rootClientId
				),
				isUsingBindings: clientIds.every(
					( clientId ) =>
						!! getBlockAttributes( clientId )?.metadata?.bindings
				),
				canRemove: canRemoveBlocks( clientIds ),
				hasBlockStyles: _hasBlockStyles,
			};
		},
		[ clientIds ]
	);
	const blockVariationTransformations = useBlockVariationTransforms( {
		clientIds,
		blocks,
	} );
	function selectForMultipleBlocks( insertedBlocks ) {
		if ( insertedBlocks.length > 1 ) {
			multiSelect(
				insertedBlocks[ 0 ].clientId,
				insertedBlocks[ insertedBlocks.length - 1 ].clientId
			);
		}
	}
	// Simple block transformation based on the `Block Transforms` API.
	function onBlockTransform( name ) {
		const newBlocks = switchToBlockType( blocks, name );
		replaceBlocks( clientIds, newBlocks );
		selectForMultipleBlocks( newBlocks );
	}
	function onBlockVariationTransform( name ) {
		updateBlockAttributes( blocks[ 0 ].clientId, {
			...blockVariationTransformations.find(
				( { name: variationName } ) => variationName === name
			).attributes,
		} );
	}
	// Pattern transformation through the `Patterns` API.
	function onPatternTransform( transformedBlocks ) {
		replaceBlocks( clientIds, transformedBlocks );
		selectForMultipleBlocks( transformedBlocks );
	}

	/**
	 * The `isSynced` check is a stopgap solution here.
	 * Ideally, the Transforms API should handle this
	 * by allowing to exclude blocks from wildcard transformations.
	 */
	const isSingleBlock = blocks.length === 1;
	const isSynced =
		isSingleBlock &&
		( isTemplatePart( blocks[ 0 ] ) || isReusableBlock( blocks[ 0 ] ) );
	const hasPossibleBlockTransformations =
		!! possibleBlockTransformations?.length && canRemove && ! isSynced;
	const hasPossibleBlockVariationTransformations =
		!! blockVariationTransformations?.length;
	const hasPatternTransformation = !! patterns?.length && canRemove;
	const hasBlockOrBlockVariationTransforms =
		hasPossibleBlockTransformations ||
		hasPossibleBlockVariationTransformations;
	const hasContents =
		hasBlockStyles ||
		hasBlockOrBlockVariationTransforms ||
		hasPatternTransformation;
	if ( ! hasContents ) {
		return (
			<p className="block-editor-block-switcher__no-transforms">
				{ __( 'No transforms.' ) }
			</p>
		);
	}

	const connectedBlockDescription = isSingleBlock
		? _x(
				'This block is connected.',
				'block toolbar button label and description'
		  )
		: _x(
				'These blocks are connected.',
				'block toolbar button label and description'
		  );

	return (
		<div className="block-editor-block-switcher__container">
			{ hasPatternTransformation && (
				<PatternTransformationsMenu
					blocks={ blocks }
					patterns={ patterns }
					onSelect={ ( transformedBlocks ) => {
						onPatternTransform( transformedBlocks );
						onClose();
					} }
				/>
			) }
			{ hasBlockOrBlockVariationTransforms && (
				<BlockTransformationsMenu
					className="block-editor-block-switcher__transforms__menugroup"
					possibleBlockTransformations={
						possibleBlockTransformations
					}
					possibleBlockVariationTransformations={
						blockVariationTransformations
					}
					blocks={ blocks }
					onSelect={ ( name ) => {
						onBlockTransform( name );
						onClose();
					} }
					onSelectVariation={ ( name ) => {
						onBlockVariationTransform( name );
						onClose();
					} }
				/>
			) }
			{ hasBlockStyles && (
				<BlockStylesMenu
					hoveredBlock={ blocks[ 0 ] }
					onSwitch={ onClose }
				/>
			) }
			{ isUsingBindings && (
				<MenuGroup>
					<Text className="block-editor-block-switcher__binding-indicator">
						{ connectedBlockDescription }
					</Text>
				</MenuGroup>
			) }
		</div>
	);
}

export const BlockSwitcher = ( { children, clientIds, label, text } ) => {
	const isSingleBlock = clientIds.length === 1;

	const blockSwitcherDescription = isSingleBlock
		? __( 'Change block type or style' )
		: sprintf(
				/* translators: %d: number of blocks. */
				_n(
					'Change type of %d block',
					'Change type of %d blocks',
					clientIds.length
				),
				clientIds.length
		  );
	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="block-editor-block-switcher"
						label={ label }
						popoverProps={ {
							placement: 'bottom-start',
							className: 'block-editor-block-switcher__popover',
						} }
						icon={ children }
						text={ text }
						toggleProps={ {
							description: blockSwitcherDescription,
							...toggleProps,
						} }
						menuProps={ { orientation: 'both' } }
					>
						{ ( { onClose } ) => (
							<BlockSwitcherDropdownMenuContents
								onClose={ onClose }
								clientIds={ clientIds }
							/>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
};

export default BlockSwitcher;
