/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { addSubmenu, moreVertical } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as blockEditorStore, BlockTitle } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	position: 'bottom right',
	variant: 'toolbar',
};

export const LeafMoreMenu = ( props ) => {
	const { clientId, block } = props;

	const { insertBlock, replaceBlock, removeBlocks, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	const label = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Options' ) }
			className="block-editor-block-settings-menu"
			popoverProps={ POPOVER_PROPS }
			noIcons
			{ ...props }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<MenuItem
						icon={ addSubmenu }
						onClick={ () => {
							const updateSelectionOnInsert = false;
							const newLink = createBlock(
								'core/navigation-link'
							);
							if ( block.name === 'core/navigation-submenu' ) {
								insertBlock(
									newLink,
									block.innerBlocks.length,
									clientId,
									updateSelectionOnInsert
								);
							} else {
								// Convert to a submenu if the block currently isn't one.
								const newSubmenu = createBlock(
									'core/navigation-submenu',
									block.attributes,
									block.innerBlocks
								);

								// The following must happen as two independent actions.
								// Why? Because the offcanvas editor relies on the getLastInsertedBlocksClientIds
								// selector to determine which block is "active". As the UX needs the newLink to be
								// the "active" block it must be the last block to be inserted.
								// Therefore the Submenu is first created and **then** the newLink is inserted
								// thus ensuring it is the last inserted block.
								replaceBlock( clientId, newSubmenu );

								replaceInnerBlocks(
									newSubmenu.clientId,
									[ newLink ],
									updateSelectionOnInsert
								);
							}
							onClose();
						} }
					>
						{ __( 'Add submenu item' ) }
					</MenuItem>
					<MenuItem
						onClick={ () => {
							removeBlocks( [ clientId ], false );
							onClose();
						} }
					>
						{ label }
					</MenuItem>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};
