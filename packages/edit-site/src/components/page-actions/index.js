/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TrashPageMenuItem from './trash-page-menu-item';
import EditPageMenuItem from '../rename-menu-item';

export default function PageActions( { post, toggleProps, onRemove } ) {
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			toggleProps={ toggleProps }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					<EditPageMenuItem item={ post } onClose={ onClose } />
					<TrashPageMenuItem
						postId={ post.id }
						onRemove={ onRemove }
					/>
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
