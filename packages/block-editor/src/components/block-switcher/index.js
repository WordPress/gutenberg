/**
 * External dependencies
 */
import { castArray, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { DropdownMenu, ToolbarGroup, ToolbarItem } from '@wordpress/components';
import {
	switchToBlockType,
	store as blocksStore,
	isReusableBlock,
	isTemplatePart,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
import BlockTitle from '../block-title';
import BlockTransformationsMenu from './block-transformations-menu';
import BlockStylesMenu from './block-styles-menu';
import PatternTransformationsMenu from './pattern-transformations-menu';

function BlockSwitcherDropDown( { onClose, blocks, clientIds } ) {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const {
		possibleBlockTransformations,
		hasBlockStyles,
		patterns,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockTransformItems,
				__experimentalGetPatternTransformItems,
			} = select( blockEditorStore );
			const { getBlockStyles } = select( blocksStore );
			const rootClientId = getBlockRootClientId(
				castArray( clientIds )[ 0 ]
			);
			const [ { name: firstBlockName } ] = blocks;
			const _isSingleBlockSelected = blocks.length === 1;
			const styles =
				_isSingleBlockSelected && getBlockStyles( firstBlockName );
			return {
				possibleBlockTransformations: getBlockTransformItems(
					blocks,
					rootClientId
				),
				hasBlockStyles: !! styles?.length,
				patterns: __experimentalGetPatternTransformItems(
					blocks,
					rootClientId
				),
			};
		},
		[ clientIds, blocks ]
	);
	// Simple block tranformation based on the `Block Transforms` API.
	const onBlockTransform = ( name ) =>
		replaceBlocks( clientIds, switchToBlockType( blocks, name ) );
	// Pattern transformation through the `Patterns` API.
	const onPatternTransform = ( transformedBlocks ) =>
		replaceBlocks( clientIds, transformedBlocks );
	const hasPossibleBlockTransformations = !! possibleBlockTransformations.length;
	const hasPatternTransformation = !! patterns?.length;
	const nothingToShow =
		! hasBlockStyles &&
		! hasPossibleBlockTransformations &&
		! hasPatternTransformation;
	return (
		<div className="block-editor-block-switcher__container">
			{ nothingToShow && __( 'No transformations' ) }
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
			{ hasPossibleBlockTransformations && (
				<BlockTransformationsMenu
					className="block-editor-block-switcher__transforms__menugroup"
					possibleBlockTransformations={
						possibleBlockTransformations
					}
					blocks={ blocks }
					onSelect={ ( name ) => {
						onBlockTransform( name );
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
		</div>
	);
}

export const BlockSwitcherDropdownMenu = ( { clientIds, blocks } ) => {
	const blockInformation = useBlockDisplayInformation( blocks[ 0 ].clientId );
	const { icon, blockTitle } = useSelect(
		( select ) => {
			const { getBlockType } = select( blocksStore );
			const [ { name: firstBlockName } ] = blocks;
			const _isSingleBlockSelected = blocks.length === 1;
			let _icon;
			if ( _isSingleBlockSelected ) {
				_icon = blockInformation?.icon; // Take into account active block variations.
			} else {
				const isSelectionOfSameType =
					uniq( blocks.map( ( { name } ) => name ) ).length === 1;
				// When selection consists of blocks of multiple types, display an
				// appropriate icon to communicate the non-uniformity.
				_icon = isSelectionOfSameType
					? getBlockType( firstBlockName )?.icon
					: stack;
			}
			return {
				icon: _icon,
				blockTitle: getBlockType( firstBlockName ).title,
			};
		},
		[ blocks, blockInformation?.icon ]
	);

	const isReusable = blocks.length === 1 && isReusableBlock( blocks[ 0 ] );
	const isTemplate = blocks.length === 1 && isTemplatePart( blocks[ 0 ] );
	const blockSwitcherLabel = blockTitle;
	const blockSwitcherDescription =
		1 === blocks.length
			? sprintf(
					/* translators: %s: block title. */
					__( '%s: Change block type or style' ),
					blockTitle
			  )
			: sprintf(
					/* translators: %d: number of blocks. */
					_n(
						'Change type of %d block',
						'Change type of %d blocks',
						blocks.length
					),
					blocks.length
			  );

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="block-editor-block-switcher"
						label={ blockSwitcherLabel }
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
							className: 'block-editor-block-switcher__popover',
						} }
						icon={
							<>
								<BlockIcon
									icon={ icon }
									className="block-editor-block-switcher__toggle"
									showColors
								/>
								{ ( isReusable || isTemplate ) && (
									<span className="block-editor-block-switcher__toggle-text">
										<BlockTitle clientId={ clientIds } />
									</span>
								) }
							</>
						}
						toggleProps={ {
							describedBy: blockSwitcherDescription,
							...toggleProps,
						} }
						menuProps={ { orientation: 'both' } }
					>
						{ ( { onClose } ) => (
							<BlockSwitcherDropDown
								onClose={ onClose }
								clientIds={ clientIds }
								blocks={ blocks }
							/>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
};

export const BlockSwitcher = ( { clientIds } ) => {
	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);

	if ( ! blocks.length || blocks.some( ( block ) => ! block ) ) {
		return null;
	}

	return (
		<BlockSwitcherDropdownMenu clientIds={ clientIds } blocks={ blocks } />
	);
};

export default BlockSwitcher;
