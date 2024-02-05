/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	addSubmenu,
	chevronUp,
	chevronDown,
	moreVertical,
} from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU = [
	'core/navigation-link',
	'core/navigation-submenu',
];

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

function AddSubmenuItem( { block, expandedState, expand, setInsertedBlock } ) {
	const { insertBlock, replaceBlock, replaceInnerBlocks } =
		useDispatch( blockEditorStore );

	const clientId = block.clientId;
	const isDisabled = ! BLOCKS_THAT_CAN_BE_CONVERTED_TO_SUBMENU.includes(
		block.name
	);
	return (
		<DropdownMenuItem
			prefix={ <Icon size={ 24 } icon={ addSubmenu } /> }
			disabled={ isDisabled }
			onClick={ () => {
				const updateSelectionOnInsert = false;
				const newLink = createBlock( 'core/navigation-link' );

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

				// This call sets the local List View state for the "last inserted block".
				// This is required for the Nav Block to determine whether or not to display
				// the Link UI for this new block.
				setInsertedBlock( newLink );

				if ( ! expandedState[ block.clientId ] ) {
					expand( block.clientId );
				}
			} }
		>
			<DropdownMenuItemLabel>
				{ __( 'Add submenu link' ) }
			</DropdownMenuItemLabel>
		</DropdownMenuItem>
	);
}

// TODO: double check if props passed to it are correct
export default function LeafMoreMenu( {
	toggleProps,
	label,
	icon,
	disableOpenOnArrowDown,
	block,
	// Unused (avoid forwarding with rest props)
	expand,
	expandedState,
	setInsertedBlock,
	// Rest props
	...props
} ) {
	const { clientId } = block;

	const { moveBlocksDown, moveBlocksUp, removeBlocks } =
		useDispatch( blockEditorStore );

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const rootClientId = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );

			return getBlockRootClientId( clientId );
		},
		[ clientId ]
	);

	// Save the dropdownTriggerId in case it is enforced via toggleProps, so that
	// it can be passed as the value for the `aria-labelledby` prop for the
	// dropdown content. This would normally work out of the box for the
	// `DropdownMenu` component, but in this case the toggle may receive an
	// external id from the parent `ToolbarItem` that can't be ignored.
	const dropdownMenuExtraProps = {};

	if ( !! toggleProps?.id ) {
		dropdownMenuExtraProps[ 'aria-labelledby' ] = toggleProps?.id;
	}

	const dropdownMenuRef = useRef( null );

	return (
		<DropdownMenu
			ref={ dropdownMenuRef }
			trigger={
				<Button
					{ ...toggleProps }
					className={ classnames(
						'block-editor-block-settings-menu__trigger',
						toggleProps?.className
					) }
					onKeyDown={ ( event ) => {
						if (
							disableOpenOnArrowDown &&
							event.key === 'ArrowDown'
						) {
							event.preventDefault();
						}
						toggleProps?.onKeyDown?.( event );
					} }
					__next40pxDefaultSize
					label={ label ?? __( 'Options' ) }
					icon={ icon ?? moreVertical }
				/>
			}
			className="block-editor-block-settings-menu"
			placement="bottom-start"
			gutter={ 12 }
			{ ...dropdownMenuExtraProps }
			{ ...props }
		>
			<>
				<DropdownMenuGroup>
					<DropdownMenuItem
						prefix={ <Icon size={ 24 } icon={ chevronUp } /> }
						onClick={ () => {
							moveBlocksUp( [ clientId ], rootClientId );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Move up' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
					<DropdownMenuItem
						prefix={ <Icon size={ 24 } icon={ chevronDown } /> }
						onClick={ () => {
							moveBlocksDown( [ clientId ], rootClientId );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Move down' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
					<AddSubmenuItem
						block={ block }
						expanded
						expandedState={ props.expandedState }
						expand={ props.expand }
						setInsertedBlock={ props.setInsertedBlock }
					/>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={ () => {
							removeBlocks( [ clientId ], false );
						} }
					>
						<DropdownMenuItemLabel>
							{ removeLabel }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</>
		</DropdownMenu>
	);
}
