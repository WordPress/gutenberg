/**
 * External dependencies
 */
import { castArray, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { switchToBlockType, store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockTransformationsMenu from './block-transformations-menu';
import BlockStylesMenu from './block-styles-menu';

const BlockSwitcher = ( { clientIds } ) => {
	const { replaceBlocks } = useDispatch( 'core/block-editor' );
	const {
		blocks,
		possibleBlockTransformations,
		hasBlockStyles,
		icon,
	} = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockRootClientId,
				getBlockTransformItems,
			} = select( 'core/block-editor' );
			const { getBlockStyles, getBlockType } = select( blocksStore );
			const rootClientId = getBlockRootClientId(
				castArray( clientIds )[ 0 ]
			);
			const _blocks = getBlocksByClientId( clientIds );
			const isSingleBlockSelected = _blocks?.length === 1;
			const firstBlock = !! _blocks?.length ? _blocks[ 0 ] : null;
			const styles =
				isSingleBlockSelected && getBlockStyles( firstBlock.name );
			// When selection consists of blocks of multiple types, display an
			// appropriate icon to communicate the non-uniformity.
			const isSelectionOfSameType =
				uniq( ( _blocks || [] ).map( ( { name } ) => name ) ).length ===
				1;
			return {
				blocks: _blocks,
				possibleBlockTransformations:
					_blocks && getBlockTransformItems( _blocks, rootClientId ),
				hasBlockStyles: !! styles?.length,
				icon: isSelectionOfSameType
					? getBlockType( firstBlock.name )?.icon
					: stack,
			};
		},
		[ clientIds ]
	);

	if ( ! blocks?.length ) return null;

	const onTransform = ( name ) =>
		replaceBlocks( clientIds, switchToBlockType( blocks, name ) );

	const hasPossibleBlockTransformations = !! possibleBlockTransformations.length;
	if ( ! hasBlockStyles && ! hasPossibleBlockTransformations ) {
		return (
			<ToolbarGroup>
				<ToolbarButton
					disabled
					className="block-editor-block-switcher__no-switcher-icon"
					title={ __( 'Block icon' ) }
					icon={ <BlockIcon icon={ icon } showColors /> }
				/>
			</ToolbarGroup>
		);
	}

	const blockSwitcherLabel =
		1 === blocks.length
			? __( 'Change block type or style' )
			: sprintf(
					/* translators: %s: number of blocks. */
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
							<BlockIcon
								icon={ icon }
								className="block-editor-block-switcher__toggle"
								showColors
							/>
						}
						toggleProps={ toggleProps }
						menuProps={ { orientation: 'both' } }
					>
						{ ( { onClose } ) =>
							( hasBlockStyles ||
								hasPossibleBlockTransformations ) && (
								<div className="block-editor-block-switcher__container">
									{ hasPossibleBlockTransformations && (
										<BlockTransformationsMenu
											className="block-editor-block-switcher__transforms__menugroup"
											possibleBlockTransformations={
												possibleBlockTransformations
											}
											blocks={ blocks }
											onSelect={ ( name ) => {
												onTransform( name );
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
							)
						}
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
};

export default BlockSwitcher;
