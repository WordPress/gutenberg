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
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
import BlockTransformationsMenu from './block-transformations-menu';
import BlockStylesMenu from './block-styles-menu';

export const BlockSwitcherDropdownMenu = ( { clientIds, blocks } ) => {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( blocks[ 0 ].clientId );
	const { possibleBlockTransformations, hasBlockStyles, icon } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlockTransformItems } = select(
				blockEditorStore
			);
			const { getBlockStyles, getBlockType } = select( blocksStore );
			const rootClientId = getBlockRootClientId(
				castArray( clientIds )[ 0 ]
			);
			const [ { name: firstBlockName } ] = blocks;
			const _isSingleBlockSelected = blocks.length === 1;
			const styles =
				_isSingleBlockSelected && getBlockStyles( firstBlockName );
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
				possibleBlockTransformations: getBlockTransformItems(
					blocks,
					rootClientId
				),
				hasBlockStyles: !! styles?.length,
				icon: _icon,
			};
		},
		[ clientIds, blocks, blockInformation?.icon ]
	);
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

export const BlockSwitcher = ( { clientIds } ) => {
	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);

	return !! blocks?.length ? (
		<BlockSwitcherDropdownMenu clientIds={ clientIds } blocks={ blocks } />
	) : null;
};

export default BlockSwitcher;
