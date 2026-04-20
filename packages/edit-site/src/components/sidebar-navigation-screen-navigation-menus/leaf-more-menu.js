/**
 * WordPress dependencies
 */

import { chevronUp, chevronDown, moreVertical, pencil } from '@wordpress/icons';
import { DropdownMenu, MenuItem, MenuGroup } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { BlockTitle, store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

const POPOVER_PROPS = {
	className: 'block-editor-block-settings-menu__popover',
	placement: 'bottom-start',
};

const BLOCKS_WITH_LINK_EDIT_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

export default function LeafMoreMenu( props ) {
	const history = useHistory();
	const { path } = useLocation();
	const { block, setEditingBlock } = props;
	const { clientId } = block;
	const { moveBlocksDown, moveBlocksUp, removeBlocks } =
		useDispatch( blockEditorStore );

	const removeLabel = sprintf(
		/* translators: %s: block name */
		__( 'Remove %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const goToLabel = sprintf(
		/* translators: %s: block name */
		__( 'Go to %s' ),
		BlockTitle( { clientId, maximumLength: 25 } )
	);

	const canEditLink = BLOCKS_WITH_LINK_EDIT_SUPPORT.includes( block?.name );

	const rootClientId = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );

			return getBlockRootClientId( clientId );
		},
		[ clientId ]
	);

	const onGoToPage = useCallback(
		( selectedBlock ) => {
			const { attributes, name } = selectedBlock;
			if (
				attributes.kind === 'post-type' &&
				attributes.id &&
				attributes.type &&
				history
			) {
				history.navigate(
					`/${ attributes.type }/${ attributes.id }?canvas=edit`,
					{
						state: { backPath: path },
					}
				);
			}
			if ( name === 'core/page-list-item' && attributes.id && history ) {
				history.navigate( `/page/${ attributes.id }?canvas=edit`, {
					state: { backPath: path },
				} );
			}
		},
		[ path, history ]
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
				<>
					<MenuGroup>
						{ canEditLink && (
							<MenuItem
								icon={ pencil }
								onClick={ () => {
									setEditingBlock( block );
									onClose();
								} }
							>
								{ __( 'Edit link' ) }
							</MenuItem>
						) }
						<MenuItem
							icon={ chevronUp }
							onClick={ () => {
								moveBlocksUp( [ clientId ], rootClientId );
								onClose();
							} }
						>
							{ __( 'Move up' ) }
						</MenuItem>
						<MenuItem
							icon={ chevronDown }
							onClick={ () => {
								moveBlocksDown( [ clientId ], rootClientId );
								onClose();
							} }
						>
							{ __( 'Move down' ) }
						</MenuItem>
						{ block.attributes?.type === 'page' &&
							block.attributes?.id && (
								<MenuItem
									onClick={ () => {
										onGoToPage( block );
										onClose();
									} }
								>
									{ goToLabel }
								</MenuItem>
							) }
					</MenuGroup>
					<MenuGroup>
						<MenuItem
							onClick={ () => {
								removeBlocks( [ clientId ], false );
								onClose();
							} }
						>
							{ removeLabel }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
}
